import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is optional at build time.
 *
 * The marketing side of the site — every page except the shop and the admin —
 * renders from the static catalogue in `data/catalogue.ts` and must keep
 * working before anyone has created a Supabase project. So the client is only
 * constructed when both environment variables are present, and every caller
 * checks `isSupabaseConfigured` first rather than assuming a connection.
 *
 * Set these in `.env.local` (see `.env.example`):
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon public key>
 *
 * The anon key is designed to be public — row level security in schema.sql is
 * what actually protects the data. Never put the service-role key here.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/** Narrowing helper so call sites get a non-null client or a clear error. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local."
    );
  }
  return supabase;
}

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

/** Online payment needs both a database and a Razorpay publishable key. */
export const isPaymentConfigured = Boolean(isSupabaseConfigured && RAZORPAY_KEY_ID);
