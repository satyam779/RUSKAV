import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductGroup } from "../data/catalogue";
import { ColorSwatches } from "./ColorSwatches";
import { CertBadge, MaterialBadge } from "./icons/Badges";
import { cart, useCartLines } from "../lib/cart";

export function ProductGroupCard({ group, defaultOpen = false }: { group: ProductGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cartLines = useCartLines();

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3.5">
          <MaterialBadge code={group.materialCode} />
          <div>
            <h4 className="font-display text-lg font-medium text-ink">{group.name}</h4>
            <p className="text-xs text-ink-soft">
              {group.material}
              {group.surface ? ` · ${group.surface} surface` : ""}
            </p>
          </div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          className={`shrink-0 text-ink-soft transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-6 border-t border-ink/10 px-5 pb-6 pt-5">
              {group.highlight && (
                <p className="rounded-xl bg-brand/5 px-4 py-3 text-sm leading-relaxed text-brand-dark">
                  {group.highlight}
                </p>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">Colourways</p>
                  <ColorSwatches colors={group.colors} />
                </div>
                {group.specs && group.specs.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">Specifications</p>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                      {group.specs.map((s) => (
                        <div key={s.label} className="contents">
                          <dt className="text-ink-soft">{s.label}</dt>
                          <dd className="text-right font-medium text-ink">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">Product codes</p>
                {/* Columns drop away on phones rather than the table carrying a
                    min-width: a table wider than the screen makes the whole
                    document wider than the screen, and Chrome zooms the site
                    out to fit it. */}
                <div className="overflow-x-auto rounded-xl border border-ink/10">
                  <table className="w-full text-left text-sm sm:min-w-[420px]">
                    <thead>
                      <tr className="bg-paper-dim text-xs uppercase tracking-wide text-ink-soft">
                        <th className="px-3 py-2.5 font-semibold sm:px-3.5">Code</th>
                        <th className="px-3 py-2.5 font-semibold sm:px-3.5">Description</th>
                        <th className="hidden px-3.5 py-2.5 font-semibold sm:table-cell">Size</th>
                        <th className="hidden px-3.5 py-2.5 font-semibold sm:table-cell">Case pack</th>
                        <th className="px-3 py-2.5 text-right font-semibold print-hide sm:px-3.5">
                          <span className="sr-only">Add to enquiry</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/8">
                      {group.products.map((p) => {
                        const inCart = cartLines.some((l) => l.code === p.code);
                        return (
                          <tr key={p.code} className={inCart ? "bg-brand/[0.04]" : undefined}>
                            <td className="whitespace-nowrap px-3 py-2.5 align-top font-mono text-[13px] font-semibold text-brand-dark sm:px-3.5 sm:align-middle">
                              <Link
                                to={`/shop/${encodeURIComponent(p.code)}`}
                                className="underline-offset-2 hover:underline"
                              >
                                {p.code}
                              </Link>
                            </td>
                            <td className="px-3 py-2.5 align-top text-ink-soft sm:px-3.5 sm:align-middle">
                              {p.description}
                              <span className="mt-0.5 block text-xs text-ink-soft/80 sm:hidden">
                                {p.size} · {p.casePack} ea.
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-3.5 py-2.5 text-ink-soft sm:table-cell">
                              {p.size}
                            </td>
                            <td className="hidden whitespace-nowrap px-3.5 py-2.5 text-ink-soft sm:table-cell">
                              {p.casePack} ea.
                            </td>
                            <td className="px-3 py-2.5 text-right align-top print-hide sm:px-3.5 sm:align-middle">
                              <button
                                type="button"
                                onClick={() => cart.add(p.code)}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                  inCart
                                    ? "border-brand bg-brand text-white"
                                    : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"
                                }`}
                              >
                                <span className="sr-only">
                                  Add a case of {p.code} {p.description} to your order
                                </span>
                                <span aria-hidden="true">{inCart ? "✓" : "+"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {group.note && <p className="mt-2 text-xs italic text-ink-soft/70">{group.note}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                {group.certs.map((c) => (
                  <CertBadge key={c} kind={c} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
