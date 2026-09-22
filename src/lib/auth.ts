import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, requireSupabase, supabase } from "./supabase";

export type AuthState = {
  session: Session | null;
  /** Signed in AND listed in the `admins` table. */
  isAdmin: boolean;
  loading: boolean;
};

/**
 * Session plus admin membership, held once for the whole app.
 *
 * Deliberately a module-level store rather than per-component state. Since
 * pricing is gated on being signed in, every `Price` on the page asks this
 * question — and on a shop grid of forty products, a hook that opened its own
 * session check and its own `admins` query would fire eighty requests to draw
 * one screen. One subscription answers all of them.
 *
 * Being signed in is not the same as being an admin: the gate is a row in
 * `public.admins`, checked here for the UI and enforced independently by row
 * level security in the database. The client-side check only decides what to
 * render — it is not what protects the data, so a tampered client gains
 * nothing.
 */
let state: AuthState = {
  session: null,
  isAdmin: false,
  // Nothing to wait for when there is no backend configured.
  loading: isSupabaseConfigured,
};

const listeners = new Set<() => void>();
let started = false;

/** A new object only when something actually changed, so renders stay honest. */
function patch(next: Partial<AuthState>) {
  const merged = { ...state, ...next };
  if (
    merged.session === state.session &&
    merged.isAdmin === state.isAdmin &&
    merged.loading === state.loading
  ) {
    return;
  }
  state = merged;
  listeners.forEach((l) => l());
}

/**
 * Opens the session subscription the first time anything asks for auth, and
 * never closes it: it lives as long as the tab does, and tearing it down when
 * the last `Price` unmounts would only mean opening it again on the next page.
 */
function start() {
  if (started || !supabase) return;
  started = true;
  const client = supabase;

  const checkAdmin = async (next: Session | null) => {
    if (!next) {
      patch({ isAdmin: false });
      return;
    }
    const { data } = await client
      .from("admins")
      .select("user_id")
      .eq("user_id", next.user.id)
      .maybeSingle();
    patch({ isAdmin: Boolean(data) });
  };

  void client.auth
    .getSession()
    .then(async ({ data }) => {
      patch({ session: data.session });
      await checkAdmin(data.session);
    })
    .catch(() => {
      // An unreachable backend must not leave the whole site stuck on the
      // loading placeholder: settle as signed out and let the page render.
    })
    .finally(() => patch({ loading: false }));

  client.auth.onAuthStateChange((_event, next) => {
    patch({ session: next, loading: false });
    void checkAdmin(next);
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
};

const snapshot = () => state;

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * Google sign-in, which is how customers get an account.
 *
 * `redirectTo` has to be an address Supabase is willing to send people back to
 * — add it under Authentication -> URL Configuration -> Redirect URLs, for the
 * live domain and for http://localhost:5173 while developing. The `next`
 * parameter survives the round trip so a visitor who signed in from the cart
 * lands back at the cart rather than on a login screen they no longer need.
 */
export async function signInWithGoogle(next?: string) {
  const client = requireSupabase();
  const url = new URL("/login", window.location.origin);
  if (next) url.searchParams.set("next", next);

  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: url.toString(),
      // Shared machines are normal in an office: always offer the chooser
      // rather than silently reusing whoever signed in last.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}

/** Email and password, kept for staff accounts created in the Supabase dashboard. */
export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** The name the provider gave us, or "" — never a stand-in. Forms prefill from this. */
export function fullName(user: User | undefined | null) {
  const meta = user?.user_metadata ?? {};
  return (((meta.full_name as string) || (meta.name as string) || "") as string).trim();
}

/** What to call someone on screen: their name, else their email. */
export function displayName(user: User | undefined | null) {
  if (!user) return "";
  return fullName(user) || user.email || "Signed in";
}

export function avatarUrl(user: User | undefined | null) {
  const meta = user?.user_metadata ?? {};
  return ((meta.avatar_url as string) || (meta.picture as string) || "").trim() || null;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
