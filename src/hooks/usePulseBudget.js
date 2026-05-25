import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyBudgetMap, starterState } from "../data/categories.js";
import { cashFlowEngine } from "../lib/cashFlowEngine.js";
import { createId, monthKey } from "../lib/formatters.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const STORAGE_KEY = "pulsebudget-state-v2";
const TABLE = "finance_profiles";

function normalizeState(value) {
  return {
    ...starterState,
    ...value,
    budgets: { ...emptyBudgetMap, ...(value?.budgets || {}) },
    expenses: value?.expenses || [],
    planned: value?.planned || []
  };
}

function loadLocalState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return starterState;
  }
}

export function usePulseBudget() {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(loadLocalState);
  const [status, setStatus] = useState("Sign in to sync this budget across devices.");
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedCloud = useRef(false);

  const engine = useMemo(() => cashFlowEngine(state), [state]);

  const persistLocal = useCallback((nextState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, []);

  const setFinanceState = useCallback(
    (updater) => {
      setState((current) => {
        const nextState = normalizeState(typeof updater === "function" ? updater(current) : updater);
        persistLocal(nextState);
        return nextState;
      });
    },
    [persistLocal]
  );

  const syncCloud = useCallback(
    async (nextState = state) => {
      if (!supabase || !session?.user || !hasLoadedCloud.current) return;
      const { error } = await supabase.from(TABLE).upsert({
        user_id: session.user.id,
        state: nextState,
        updated_at: new Date().toISOString()
      });

      setStatus(error ? "Cloud save failed. Local backup is still active." : `Cloud sync active for ${session.user.email}.`);
    },
    [session, state]
  );

  useEffect(() => {
    syncCloud(state);
  }, [state, syncCloud]);

  const loadCloudState = useCallback(
    async (activeSession) => {
      if (!supabase || !activeSession?.user) return;
      const { data, error } = await supabase
        .from(TABLE)
        .select("state")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();

      if (error) {
        setStatus("Could not load cloud data. Local backup is still active.");
        return;
      }

      if (data?.state) {
        const cloudState = normalizeState(data.state);
        setState(cloudState);
        persistLocal(cloudState);
        hasLoadedCloud.current = true;
        setStatus(`Cloud sync active for ${activeSession.user.email}.`);
        return;
      }

      const freshState = normalizeState(starterState);
      setState(freshState);
      persistLocal(freshState);
      const { error: insertError } = await supabase.from(TABLE).insert({
        user_id: activeSession.user.id,
        state: freshState,
        updated_at: new Date().toISOString()
      });
      if (insertError) {
        setStatus("Could not create your cloud profile. Try refreshing the page.");
        return;
      }
      hasLoadedCloud.current = true;
      setStatus(`Cloud profile created for ${activeSession.user.email}.`);
    },
    [persistLocal]
  );

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!isSupabaseConfigured || !supabase) {
        setStatus("Supabase config is missing.");
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      setSession(data.session);
      if (data.session) await loadCloudState(data.session);
      setIsLoading(false);
    }

    init();

    const { data: authListener } =
      supabase?.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) {
          hasLoadedCloud.current = false;
          setStatus(`Cloud sync active for ${nextSession.user.email}.`);
          setTimeout(() => loadCloudState(nextSession), 0);
        } else {
          hasLoadedCloud.current = false;
          const freshState = normalizeState(starterState);
          setState(freshState);
          persistLocal(freshState);
          setStatus("Sign in to sync this budget across devices.");
        }
      }) || {};

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadCloudState, persistLocal]);

  async function signIn(email, password) {
    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setStatus(error.message);
  }

  async function signUp(email, password) {
    setStatus("Creating account...");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`
      }
    });
    setStatus(error ? error.message : "Account created. Check your email if Supabase asks for confirmation.");
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  function clearAccount() {
    setFinanceState(starterState);
    setStatus("Account data cleared. Cloud sync will save the zero balance.");
  }

  function addExpense(expense) {
    setFinanceState((current) => ({
      ...current,
      expenses: [
        ...current.expenses,
        {
          id: createId(),
          date: monthKey(new Date()),
          ...expense,
          amount: Number(expense.amount || 0)
        }
      ]
    }));
  }

  function addPlanned(item) {
    setFinanceState((current) => ({
      ...current,
      planned: [
        ...current.planned,
        {
          id: createId(),
          ...item,
          amount: Number(item.amount || 0)
        }
      ]
    }));
  }

  function updateBudget(category, value) {
    setFinanceState((current) => ({
      ...current,
      budgets: {
        ...current.budgets,
        [category]: Number(value || 0)
      }
    }));
  }

  function updateIncome(value) {
    setFinanceState((current) => ({ ...current, income: Number(value || 0) }));
  }

  return {
    engine,
    isLoading,
    session,
    state,
    status,
    actions: {
      addExpense,
      addPlanned,
      clearAccount,
      signIn,
      signOut,
      signUp,
      updateBudget,
      updateIncome
    }
  };
}
