import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { categories, CERT_LABEL, type CertKind } from "../data/catalogue";
import {
  emptyFilters,
  hasActiveFilters,
  materials,
  searchProducts,
  type ProductFilters,
} from "../lib/catalogueIndex";
import { cart, useCartLines } from "../lib/cart";
import { MaterialBadge } from "./icons/Badges";

const certFilters: CertKind[] = ["dishwasher", "microwave", "freezer", "tuv"];

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-ink/15 bg-white/60 text-ink-soft hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ProductFinder() {
  const [filters, setFilters] = useState<ProductFilters>(emptyFilters);
  const cartLines = useCartLines();
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchProducts(filters), [filters]);
  const active = hasActiveFilters(filters);

  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  /** Filter chips are toggles: picking the active value clears it. */
  const toggle = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));

  const reset = () => {
    setFilters(emptyFilters);
    searchRef.current?.focus();
  };

  return (
    <section id="catalogue" className="scroll-mt-24 border-t border-ink/8 bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] text-brand">Product finder</p>
            <h2 className="font-display mt-4 max-w-lg text-balance text-4xl font-medium leading-[1.08] text-ink md:text-5xl">
              Every code in the range, searchable.
            </h2>
          </div>
          <p className="max-w-sm text-balance text-ink-soft">
            Search by product code, size or description — then add what you need to
            your order and send it straight over.
          </p>
        </div>

        <div className="print-hide rounded-3xl border border-ink/10 bg-white/70 p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="relative">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60"
              >
                <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <label htmlFor="product-search" className="sr-only">
                Search products by code, size or description
              </label>
              <input
                id="product-search"
                ref={searchRef}
                type="search"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && filters.query) {
                    e.preventDefault();
                    set("query", "");
                  }
                }}
                placeholder='Try "12 x 16", "compartment" or "RT1014"'
                className="w-full rounded-2xl border border-ink/12 bg-paper-dim/60 py-3.5 pl-12 pr-4 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                Range
              </span>
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  active={filters.categoryId === c.id}
                  onClick={() => toggle("categoryId", c.id)}
                >
                  {c.shortName}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                Material
              </span>
              {materials.map((m) => (
                <FilterChip key={m} active={filters.material === m} onClick={() => toggle("material", m)}>
                  {m}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                Rated for
              </span>
              {certFilters.map((c) => (
                <FilterChip key={c} active={filters.cert === c} onClick={() => toggle("cert", c)}>
                  {CERT_LABEL[c]}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <p aria-live="polite" className="text-sm text-ink-soft">
              <strong className="font-semibold text-ink">{results.length}</strong>{" "}
              {results.length === 1 ? "product" : "products"}
              {active ? " match your filters" : " in the range"}
            </p>
            {active && (
              <button
                type="button"
                onClick={reset}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/5"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-ink/15 px-6 py-16 text-center">
            <p className="font-display text-xl text-ink">Nothing matches that.</p>
            <p className="mx-auto mt-2 max-w-sm text-balance text-sm text-ink-soft">
              Try a shorter search, or clear the filters. If you need a size or format
              that isn&apos;t listed, ask us — a lot of the range is made to order.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40"
              >
                Clear filters
              </button>
              <a
                href="#contact"
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Ask about a custom size
              </a>
            </div>
          </div>
        ) : (
          /* The table drops columns instead of carrying a min-width on phones.
             A min-width wide enough for five columns makes the document wider
             than the screen, and Chrome answers that by zooming the whole site
             out to fit — which is where the bare strip down the right side and
             the shrunken, hard-to-hit buttons came from. */
          <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/10">
            <table className="w-full border-collapse text-left text-sm sm:min-w-[560px]">
              <caption className="sr-only">
                Ruskav product codes with description, size, case pack and material
              </caption>
              <thead>
                <tr className="bg-paper-dim text-xs uppercase tracking-wide text-ink-soft">
                  <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
                    Code
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
                    Description
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Size
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                    Case pack
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                    Material
                  </th>
                  <th scope="col" className="print-hide px-3 py-3 text-right font-semibold sm:px-4">
                    Enquire
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {results.map((p) => {
                  const inCart = cartLines.some((l) => l.code === p.code);
                  return (
                    <tr key={p.code} className={inCart ? "bg-brand/[0.04]" : "bg-white/40"}>
                      <th
                        scope="row"
                        className="whitespace-nowrap px-3 py-3 text-left align-top font-mono text-[13px] font-semibold text-brand-dark sm:px-4 sm:align-middle"
                      >
                        <Link
                          to={`/shop/${encodeURIComponent(p.code)}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {p.code}
                        </Link>
                      </th>
                      <td className="px-3 py-3 align-top text-ink sm:px-4 sm:align-middle">
                        {p.description}
                        {/* The columns the phone layout drops, folded back in
                            under the description where they can wrap. */}
                        <span className="mt-0.5 block text-xs text-ink-soft sm:hidden">
                          {p.size} · {p.casePack} ea. · {p.material}
                        </span>
                        <a
                          href={`#${p.categoryId}`}
                          className="mt-0.5 block text-xs text-ink-soft underline-offset-2 hover:text-brand hover:underline"
                        >
                          {p.groupName === p.description ? p.categoryShortName : p.groupName}
                        </a>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-ink-soft sm:table-cell">
                        {p.size}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-ink-soft md:table-cell">
                        {p.casePack} ea.
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          <MaterialBadge code={p.materialCode} size={22} />
                          {p.material}
                        </span>
                      </td>
                      <td className="print-hide px-3 py-3 text-right align-top sm:px-4 sm:align-middle">
                        <button
                          type="button"
                          onClick={() => cart.add(p.code)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            inCart
                              ? "border-brand bg-brand text-white"
                              : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"
                          }`}
                        >
                          <span className="sr-only">
                            Add a case of {p.code} {p.description} to your order
                          </span>
                          <span aria-hidden="true">{inCart ? "Added ✓" : "+ Add"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
