import { useAuth } from "./auth";
import { isSupabaseConfigured } from "./supabase";

/**
 * Wholesale pricing is trade-only.
 *
 * Every price on the site runs through this gate: a visitor sees the range,
 * the specifications and the case packs, but the money appears once they have
 * an account. That is how the trade buyers we sell to expect a wholesale site
 * to behave, and it keeps our price list off the open web.
 *
 * `unlocked` is deliberately permissive when Supabase is not configured at
 * all — a local checkout with no backend should still show the shop working
 * rather than a site-wide padlock with no way past it.
 */
export type TradeAccess = {
  /** Prices may be shown. */
  unlocked: boolean;
  /** Session still resolving; show a placeholder rather than a lock that flickers. */
  loading: boolean;
  /** Signed in, as opposed to "prices are open because there is no backend". */
  signedIn: boolean;
};

export function useTradeAccess(): TradeAccess {
  const { session, loading } = useAuth();
  const signedIn = Boolean(session);
  return {
    unlocked: !isSupabaseConfigured || signedIn,
    loading: loading && !signedIn,
    signedIn,
  };
}

/**
 * Where a "sign in to see prices" link should send someone: the login page,
 * carrying the page they were on so they land back on it afterwards.
 */
export function loginHref(pathname?: string) {
  const here =
    pathname ?? (typeof window === "undefined" ? "/" : window.location.pathname + window.location.search);
  return here && here !== "/login" ? `/login?next=${encodeURIComponent(here)}` : "/login";
}
