import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { cart, priceCart, useCartLines } from "../lib/cart";
import { useProducts, formatMoney } from "../lib/products";

/** The routes where the floating bar would cover the thing it summarises. */
const HIDDEN_ON = (pathname: string) =>
  pathname === "/cart" || pathname.startsWith("/admin") || pathname === "/login";

/**
 * Whether the floating bar is on screen, for the footer to pad itself past it.
 *
 * Deliberately lighter than the bar's own test: this reads the cart lines
 * alone, where the bar also prices them. Calling `useProducts` here would put
 * a second catalogue request on every page for the sake of some padding, and
 * the one case the two disagree — a saved code that no longer exists — costs
 * an unused inch of footer, not a covered button.
 */
export function useCartBarVisible() {
  const lines = useCartLines();
  const { pathname } = useLocation();
  return lines.length > 0 && !HIDDEN_ON(pathname);
}

/**
 * Floating cart summary.
 *
 * Hidden on the cart page itself and while an admin is working, since in both
 * places it would only cover the thing it summarises.
 */
export function CartBar() {
  const lines = useCartLines();
  const { products } = useProducts();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  const totals = priceCart(lines, products);
  const visible = totals.itemCount > 0 && !HIDDEN_ON(pathname);
  // Derived rather than reset in an effect: while the bar is hidden its
  // expanded state is irrelevant, and it should come back collapsed.
  const showList = expanded && visible;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="print-hide fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md md:inset-x-auto md:bottom-6 md:right-6"
        >
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper/95 shadow-2xl shadow-ink/20 backdrop-blur-md">
            <AnimatePresence initial={false}>
              {showList && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="max-h-64 divide-y divide-ink/8 overflow-y-auto px-4 py-2">
                    {totals.lines.map((l) => (
                      <li key={l.product.code} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-semibold text-brand-dark">
                            {l.product.code}
                          </p>
                          <p className="truncate text-xs text-ink-soft">
                            {l.quantity} × {l.product.name}
                            {l.unitPrice !== null
                              ? ` · ${formatMoney(l.lineTotal, l.product.currency)}`
                              : " · price on request"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cart.remove(l.product.code)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-brand"
                        >
                          <span className="sr-only">Remove {l.product.code} from your order</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                            <path
                              d="M2 2l8 8M10 2l-8 8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 pb-2">
                    <button
                      type="button"
                      onClick={() => cart.clear()}
                      className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft transition hover:text-brand"
                    >
                      Clear order
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 border-t border-ink/8 px-4 py-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={showList}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                  {totals.caseCount}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {totals.subtotal > 0
                      ? formatMoney(totals.subtotal, totals.currency)
                      : "Ready to quote"}
                  </span>
                  <span className="block truncate text-[11px] text-ink-soft">
                    {totals.itemCount} {totals.itemCount === 1 ? "product" : "products"} in your order
                  </span>
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className={`shrink-0 text-ink-soft transition-transform ${showList ? "" : "rotate-180"}`}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <Link
                to="/cart"
                className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
              >
                Review
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
