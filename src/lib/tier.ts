import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

/**
 * The trade band the signed-in buyer is on.
 *
 * Wholesale is not one price list. A distributor on a standing arrangement and
 * a cafeteria buying six cases do not pay the same, and this is how the site
 * knows which of them is looking: the band is set by an admin against the
 * account, and the discount rides on top of whatever discount the product
 * itself carries.
 *
 * Held once for the whole app, like the session, and for the same reason —
 * every `Price` on a forty-product grid asks this question, and a hook that
 * fetched per component would open forty requests to draw one screen.
 *
 * The bands table is admin-only; `my_tier()` is a security-definer function
 * that returns the caller's own row and nobody else's, so a Dealer C cannot
 * read what Dealer A pays.
 */
export type Tier = {
  key: string;
  label: string;
  discountPercent: number;
};

/** What an account with no band set is on. Also the signed-out answer. */
export const LIST_PRICE: Tier = { key: "regular", label: "Regular", discountPercent: 0 };

type TierState = {
  tier: Tier;
  /** Still asking. Prices should wait rather than print the list price first. */
  loading: boolean;
};

let state: TierState = { tier: LIST_PRICE, loading: false };
const listeners = new Set<() => void>();
let inFlightFor: string | null = null;

function publish(next: TierState) {
  if (next.tier === state.tier && next.loading === state.loading) return;
  state = next;
  listeners.forEach((l) => l());
}

/**
 * Called by the auth store whenever the session changes.
 *
 * Signing out has to reset the band, or a shared machine would keep showing
 * the last dealer's prices to the next person who sat down.
 */
export async function refreshTier(userId: string | null) {
  if (!supabase || !userId) {
    inFlightFor = null;
    publish({ tier: LIST_PRICE, loading: false });
    return;
  }
  if (inFlightFor === userId) return;
  inFlightFor = userId;

  publish({ tier: state.tier, loading: true });

  const { data, error } = await supabase.rpc("my_tier");

  // A different account signed in while this was in the air.
  if (inFlightFor !== userId) return;

  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    // No band, or the migration has not been run yet. List price is the safe
    // answer: quoting a discount nobody agreed to is the expensive mistake.
    publish({ tier: LIST_PRICE, loading: false });
    return;
  }

  publish({
    tier: {
      key: String(row.key),
      label: String(row.label),
      discountPercent: Number(row.discount_percent) || 0,
    },
    loading: false,
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const snapshot = () => state;

export function useTier(): TierState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** The band's multiplier: 12% off is 0.88. */
export const tierFactor = (tier: Tier) =>
  1 - Math.min(99, Math.max(0, tier.discountPercent)) / 100;

/** True when the band actually changes a number, so the UI can stay quiet at 0%. */
export const tierApplies = (tier: Tier) => tier.discountPercent > 0;
