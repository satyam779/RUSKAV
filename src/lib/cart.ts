import { useSyncExternalStore } from "react";
import {
  effectivePrice,
  hasPrice,
  round2,
  type ShopProduct,
} from "./products";

/**
 * The shopping cart: product code → number of cases.
 *
 * Only codes and quantities are stored. Prices are always re-read from the
 * live product list at render time, so a cart left open in a tab cannot lock
 * in yesterday's price, and an admin price change is reflected immediately.
 */
const STORAGE_KEY = "ruskav:cart";

export type CartLine = { code: string; quantity: number };

let lines: CartLine[] = load();
const listeners = new Set<() => void>();

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { code, quantity } = entry as Partial<CartLine>;
      if (typeof code !== "string" || typeof quantity !== "number") return [];
      const q = Math.floor(quantity);
      return q > 0 ? [{ code, quantity: q }] : [];
    });
  } catch {
    return [];
  }
}

function commit(next: CartLine[]) {
  lines = next.filter((l) => l.quantity > 0);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Private browsing or a full quota — the cart still works for this session.
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const cart = {
  add(code: string, quantity = 1) {
    const existing = lines.find((l) => l.code === code);
    commit(
      existing
        ? lines.map((l) => (l.code === code ? { ...l, quantity: l.quantity + quantity } : l))
        : [...lines, { code, quantity }]
    );
  },
  setQuantity(code: string, quantity: number) {
    const q = Math.max(0, Math.floor(quantity));
    commit(
      q === 0
        ? lines.filter((l) => l.code !== code)
        : lines.map((l) => (l.code === code ? { ...l, quantity: q } : l))
    );
  },
  remove(code: string) {
    commit(lines.filter((l) => l.code !== code));
  },
  clear() {
    commit([]);
  },
};

export function useCartLines() {
  return useSyncExternalStore(
    subscribe,
    () => lines,
    () => lines
  );
}

export type PricedLine = {
  product: ShopProduct;
  quantity: number;
  /** Per case, after discount. Null when the product is price-on-request. */
  unitPrice: number | null;
  lineTotal: number;
  /** Money saved on this line by the discount, for the "you save" figure. */
  savings: number;
};

export type CartTotals = {
  lines: PricedLine[];
  /** Lines with no price yet — they can be quoted but not paid for. */
  quoteOnly: PricedLine[];
  itemCount: number;
  caseCount: number;
  /** Individual pieces across every line — cases multiplied out. */
  pieceCount: number;
  /**
   * Gross weight of the order in kg, for the freight quote. Null when no line
   * carries a weight; `weightPartial` marks a figure that is missing some
   * lines, so it is never presented as the whole shipment.
   */
  weightKg: number | null;
  weightPartial: boolean;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  /** True when every line has a price, so online payment is possible. */
  payable: boolean;
};

/** Joins the stored cart against the live product list and totals it up. */
export function priceCart(cartLines: CartLine[], products: ShopProduct[]): CartTotals {
  const byCode = new Map(products.map((p) => [p.code, p]));

  const priced: PricedLine[] = cartLines.flatMap((line) => {
    const product = byCode.get(line.code);
    if (!product) return [];
    const unitPrice = effectivePrice(product);
    const lineTotal = unitPrice === null ? 0 : round2(unitPrice * line.quantity);
    const savings =
      unitPrice === null || product.price === null
        ? 0
        : round2((product.price - unitPrice) * line.quantity);
    return [{ product, quantity: line.quantity, unitPrice, lineTotal, savings }];
  });

  const payableLines = priced.filter((l) => l.unitPrice !== null);
  const subtotal = round2(payableLines.reduce((s, l) => s + l.lineTotal, 0));
  const discountTotal = round2(priced.reduce((s, l) => s + l.savings, 0));
  const taxTotal = round2(
    payableLines.reduce((s, l) => s + (l.lineTotal * l.product.taxPercent) / 100, 0)
  );

  const weighed = priced.filter((l) => (l.product.caseWeightKg ?? 0) > 0);
  const weightKg = weighed.length
    ? round2(weighed.reduce((s, l) => s + (l.product.caseWeightKg ?? 0) * l.quantity, 0))
    : null;

  return {
    lines: priced,
    quoteOnly: priced.filter((l) => l.unitPrice === null),
    itemCount: priced.length,
    caseCount: priced.reduce((s, l) => s + l.quantity, 0),
    pieceCount: priced.reduce((s, l) => s + l.quantity * Math.max(1, l.product.casePack), 0),
    weightKg,
    weightPartial: weighed.length > 0 && weighed.length < priced.length,
    subtotal,
    discountTotal,
    taxTotal,
    total: round2(subtotal + taxTotal),
    currency: priced[0]?.product.currency ?? "INR",
    payable: priced.length > 0 && priced.every((l) => hasPrice(l.product)),
  };
}
