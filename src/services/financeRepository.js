import { supabase } from "../lib/supabaseClient.js";

const PROFILE_TABLE = "finance_profiles";
const TRANSACTION_TABLE = "finance_transactions";

export async function getProfile(userId) {
  return supabase.from(PROFILE_TABLE).select("state").eq("user_id", userId).maybeSingle();
}

export async function upsertProfile(userId, state) {
  const profileState = {
    income: state.income,
    openingBalance: state.openingBalance,
    categories: state.categories,
    budgets: state.budgets,
    planned: state.planned
  };

  return supabase.from(PROFILE_TABLE).upsert({
    user_id: userId,
    state: profileState,
    updated_at: new Date().toISOString()
  });
}

export async function createProfile(userId, state) {
  return supabase.from(PROFILE_TABLE).insert({
    user_id: userId,
    state,
    updated_at: new Date().toISOString()
  });
}

export async function getTransactions(userId) {
  return supabase
    .from(TRANSACTION_TABLE)
    .select("id, amount, category, date, note")
    .eq("user_id", userId)
    .order("date", { ascending: false });
}

export async function insertTransaction(userId, transaction) {
  return supabase
    .from(TRANSACTION_TABLE)
    .insert({
      id: transaction.id,
      user_id: userId,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note || ""
    })
    .select("id, amount, category, date, note")
    .single();
}

export async function deleteAllTransactions(userId) {
  return supabase.from(TRANSACTION_TABLE).delete().eq("user_id", userId);
}
