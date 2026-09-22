import { requireSupabase } from "./supabase";

/**
 * The trade bands, as the dashboard sees them.
 *
 * Kept apart from `tier.ts` on purpose. That module answers "what do *I* pay",
 * through a security-definer function, and is loaded on every page of the
 * public site. This one reads the whole table, which only an admin can do, and
 * is only ever imported by the dashboard chunk.
 */
export type TierRow = {
  key: string;
  label: string;
  discount_percent: number | string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type TierOption = {
  key: string;
  label: string;
  discountPercent: number;
  description: string | null;
};

/**
 * The bands to offer in a picker, when the table cannot be read.
 *
 * A dashboard whose customer list has an empty dropdown is broken; falling
 * back to the seeded bands at least names them, and the save will fail loudly
 * with the real reason if the migration has not been run.
 */
export const FALLBACK_TIERS: TierOption[] = [
  { key: "regular", label: "Regular", discountPercent: 0, description: "List price." },
  { key: "dealer_c", label: "Dealer C", discountPercent: 4, description: null },
  { key: "dealer_b", label: "Dealer B", discountPercent: 8, description: null },
  { key: "dealer_a", label: "Dealer A", discountPercent: 12, description: null },
];

export function toOption(row: TierRow): TierOption {
  return {
    key: row.key,
    label: row.label,
    discountPercent: Number(row.discount_percent) || 0,
    description: row.description,
  };
}

export async function fetchTiers(): Promise<TierRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("customer_tiers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TierRow[];
}

export async function saveTier(row: TierRow) {
  const client = requireSupabase();
  const { error } = await client
    .from("customer_tiers")
    .update({
      label: row.label.trim(),
      discount_percent: Number(row.discount_percent) || 0,
      description: row.description?.trim() || null,
      is_active: row.is_active,
    })
    .eq("key", row.key);
  if (error) throw error;
}

/** Move one account onto a band, with the reason it moved. */
export async function setCustomerTier(userId: string, tier: string, note: string | null) {
  const client = requireSupabase();
  const { error } = await client
    .from("profiles")
    .update({ tier, tier_note: note?.trim() || null })
    .eq("id", userId);
  if (error) throw error;
}
