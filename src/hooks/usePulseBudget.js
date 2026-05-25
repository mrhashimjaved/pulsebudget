import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories as defaultCategories, starterState, budgetMapFor } from "../data/categories.js";
import { cashFlowEngine } from "../lib/cashFlowEngine.js";
import { createId, monthKey } from "../lib/formatters.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import {
  createProfile,
  deleteAllTransactions,
  getProfile,
  getTransactions,
  insertTransaction,
  upsertProfile
} from "../services/financeRepository.js";

const STORAGE_KEY = "pulsebudget-state-v3";

function normalizeState(value) {
  const categories = value?.categories?.length ? value.categories : defaultCategories;
  return {
    ...starterState,
    ...value,
    categories,
    budgets: budgetMapFor(categories, value?.budgets || {}),
    expenses: value?.expenses || [],
    planned: value?.planned || []
  };
}

function profileOnly(state) {
  return {
    income: state.income,
    openingBalance: state.openingBalance,
    categories: state.categories,
    budgets: state.budgets,
    planned: state.planned
  };
}

function loadLocalState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return normalizeState(starterState);
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
      let nextState;
      setState((current) => {
        nextState = normalizeState(typeof updater === "function" ? updater(current) : updater);
        persistLocal(nextState);
        return nextState;
      });
      return nextState;
    },
    [persistLocal]
  );

  const syncCloud = useCallback(
    async (nextState = state) => {
      if (!supabase || !session?.user || !hasLoadedCloud.current) return;
      const { error } = await upsertProfile(session.user.id, profileOnly(nextState));
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

      const [{ data: profile, error: profileError }, { data: transactions, error: transactionError }] = await Promise.all([
        getProfile(activeSession.user.id),
        getTransactions(activeSession.user.id)
      ]);

      if (profileError) {
        setStatus("Could not load profile settings. Local backup is still active.");
        return;
      }

      if (transactionError) {
        setStatus("Profile loaded. Run the updated SQL schema to enable transaction-table sync.");
      }

      if (profile?.state) {
        const cloudState = normalizeState({
          ...profile.state,
          expenses: transactionError ? profile.state.expenses || [] : transactions || []
        });
        setState(cloudState);
        persistLocal(cloudState);
        hasLoadedCloud.current = true;
        if (!transactionError) setStatus(`Cloud sync active for ${activeSession.user.email}.`);
        return;
      }

      const freshState = normalizeState(starterState);
      setState(freshState);
      persistLocal(freshState);
      const { error: insertError } = await createProfile(activeSession.user.id, profileOnly(freshState));
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

  async function hardReset(password) {
    if (!session?.user?.email || !password) {
      setStatus("Enter your password to confirm hard reset.");
      return false;
    }

    setStatus("Confirming password...");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password
    });

    if (authError) {
      setStatus("Password confirmation failed. Account was not reset.");
      return false;
    }

    const freshState = normalizeState(starterState);
    const { error: transactionError } = await deleteAllTransactions(session.user.id);
    const { error: profileError } = await upsertProfile(session.user.id, profileOnly(freshState));

    if (transactionError || profileError) {
      setStatus("Reset could not finish. Check Supabase schema and try again.");
      return false;
    }

    setFinanceState(freshState);
    setStatus("Account reset complete. All budgets, expenses, and trends are back to zero.");
    return true;
  }

  async function addExpense(expense) {
    if (!session?.user) return;
    const transaction = {
      id: createId(),
      date: expense.date || monthKey(new Date()),
      category: expense.category,
      amount: Number(expense.amount || 0),
      note: expense.note || ""
    };

    const { data, error } = await insertTransaction(session.user.id, transaction);
    if (error) {
      setStatus("Could not save transaction. Run the updated Supabase schema if this is a new deploy.");
      return;
    }

    setFinanceState((current) => ({
      ...current,
      expenses: [data || transaction, ...current.expenses]
    }));
  }

  function addPlanned(item) {
    setFinanceState((current) => ({
      ...current,
      planned: [
        ...current.planned,
        {
          id: createId(),
          date: item.date || monthKey(new Date()),
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

  function addCategory(name) {
    const category = name.trim();
    if (!category) return;
    setFinanceState((current) => {
      if (current.categories.includes(category)) return current;
      const categories = [...current.categories, category];
      return {
        ...current,
        categories,
        budgets: budgetMapFor(categories, current.budgets)
      };
    });
  }

  function removeCategory(category) {
    setFinanceState((current) => {
      const categories = current.categories.filter((item) => item !== category);
      return {
        ...current,
        categories,
        budgets: budgetMapFor(categories, current.budgets),
        planned: current.planned.filter((item) => item.category !== category)
      };
    });
  }

  return {
    engine,
    isLoading,
    session,
    state,
    status,
    actions: {
      addCategory,
      addExpense,
      addPlanned,
      hardReset,
      removeCategory,
      signIn,
      signOut,
      signUp,
      updateBudget,
      updateIncome
    }
  };
}
