import { createClient } from "@supabase/supabase-js";

const config = window.PULSEBUDGET_CONFIG || {};

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;
