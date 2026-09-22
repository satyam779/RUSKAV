import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categories, CERT_LABEL, type CertKind } from "../data/catalogue";
import { ProductCard } from "../components/ProductCard";
import { TradeGate } from "../components/TradeGate";
import {
  EmptyState,
  Notice,
  PageHeader,
  Section,
  Spinner,
  buttonClass,
} from "../components/ui";
import { effectivePrice, useProducts } from "../lib/products";
import { useAuth } from "../lib/auth";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const sorts: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name A–Z" },
];

const certFilters: CertKind[] = ["dishwasher", "microwave", "freezer", "tuv"];

function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-brand bg-brand text-white shadow-sm shadow-brand/25"
          : "border-ink/12 bg-white text-ink-soft hover:border-brand/40 hover:text-brand"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-[10px] font-bold ${active ? "text-white/70" : "text-ink-soft/50"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export function ShopPage() {
  const { products, loading, usingFallback } = useProducts();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cert, setCert] = useState<CertKind | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** How many codes sit in each range, so the filter pills carry a number. */
  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (!p.categoryId) continue;
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const filtered = products.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false;
      if (cert && !p.certs.includes(cert)) return false;
      if (discountOnly && p.discountPercent <= 0) return false;
      if (!terms.length) return true;
      const haystack = [p.code, p.name, p.size, p.material, p.groupName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-asc" || sort === "price-desc") {
        const pa = effectivePrice(a);
        const pb = effectivePrice(b);
        // Price-on-request rows always sort last, whichever direction is
        // chosen — they are not "cheapest", they are simply unknown.
        if (pa === null && pb === null) return a.sortOrder - b.sortOrder;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return sort === "price-asc" ? pa - pb : pb - pa;
      }
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
    return sorted;
  }, [products, query, categoryId, cert, discountOnly, sort]);

  const reset = () => {
    setQuery("");
    setCategoryId(null);
    setCert(null);
    setDiscountOnly(false);
  };
  const filtersActive = Boolean(query.trim() || categoryId || cert || discountOnly);
  /** What the badge on the Filters button counts — the search box speaks for itself. */
  const activeCount = [categoryId, cert, discountOnly || null].filter(Boolean).length;

  return (
    <>
      <PageHeader
        kicker="Wholesale shop"
        title="Order by the case."
        intro="Case packs, colourways and current trade pricing across the range. Build the order here, then send it as an enquiry or pay online."
        tone="dim"
      />

      <Section className="bg-paper pt-8 md:pt-10">
        <div className="mb-8">
          <TradeGate />
        </div>

        {usingFallback && (
          <div className="mb-8">
            <Notice tone="warn">
              <strong className="font-semibold">Showing the print catalogue.</strong> Live
              pricing isn&apos;t reachable right now, so these lines are listed as
              price-on-request. You can still build an order and send it to us as an
              enquiry.
            </Notice>
          </div>
        )}

        {products.length > 0 && (
          <>
        {/* One row when it is stuck to the top, because a filter panel that
            covers the products it is filtering is not helping. The chips are
            a tap away and stay open once opened. */}
        <div className="print-hide z-30 md:sticky md:top-[calc(var(--header-h)+0.5rem)]">
          <div className="rounded-2xl border border-ink/8 bg-white/95 p-2.5 shadow-[0_10px_30px_-22px_rgba(23,20,15,0.5)] backdrop-blur-md sm:p-3">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/60"
                >
                  <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="m13.5 13.5 3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <label htmlFor="shop-search" className="sr-only">
                  Search the shop by code, size or description
                </label>
                <input
                  id="shop-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && query) {
                      e.preventDefault();
                      setQuery("");
                    }
                  }}
                  placeholder="Search a code, size or name"
                  className="w-full rounded-xl border border-ink/12 bg-paper-dim/50 py-2.5 pl-10 pr-3 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand"
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-controls="shop-filters"
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                  filtersOpen || activeCount > 0
                    ? "border-brand bg-brand text-white"
                    : "border-ink/12 text-ink-soft hover:border-brand hover:text-brand"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M2 4h12M4 8h8M6.5 12h3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="hidden sm:inline">Filters</span>
                {activeCount > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/25 px-1 text-[10px]">
                    {activeCount}
                  </span>
                )}
              </button>

              <label className="shrink-0">
                <span className="sr-only">Sort products</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-ink/12 bg-paper-dim/50 px-2.5 py-2.5 text-xs font-medium text-ink transition focus:border-brand"
                >
                  {sorts.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filtersOpen && (
              <div id="shop-filters" className="mt-3 flex flex-col gap-3 border-t border-ink/8 pt-3">
                {/* The pills scroll sideways rather than wrapping to four lines
                    on a phone, which would push the grid off the screen. */}
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
                  <Chip active={!categoryId} onClick={() => setCategoryId(null)}>
                    All ranges
                  </Chip>
                  {categories.map((c) => (
                    <Chip
                      key={c.id}
                      active={categoryId === c.id}
                      count={countsByCategory.get(c.id)}
                      onClick={() => setCategoryId((v) => (v === c.id ? null : c.id))}
                    >
                      {c.shortName}
                    </Chip>
                  ))}
                </div>

                <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
                  <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft/50">
                    Rated for
                  </span>
                  {certFilters.map((c) => (
                    <Chip
                      key={c}
                      active={cert === c}
                      onClick={() => setCert((v) => (v === c ? null : c))}
                    >
                      {CERT_LABEL[c]}
                    </Chip>
                  ))}
                  <Chip active={discountOnly} onClick={() => setDiscountOnly((v) => !v)}>
                    On offer
                  </Chip>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outside the sticky card: a count that follows you down the page is
            noise, and it is the one line that can be read once and forgotten. */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-xs text-ink-soft">
            <strong className="font-bold text-ink">{results.length}</strong>{" "}
            {results.length === 1 ? "product" : "products"}
            {filtersActive ? " match your filters" : " in the range"}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-ink/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand transition hover:border-brand hover:bg-brand/5"
            >
              Clear filters
            </button>
          )}
        </div>
          </>
        )}

        {loading ? (
          <Spinner label="Loading the range" />
        ) : products.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="The shop is being stocked."
              body={
                isAdmin
                  ? "There are no published products yet. Add them on the dashboard and they appear here straight away."
                  : "We're putting the priced range online. In the meantime, browse the full catalogue and tell us what you need — we'll quote it."
              }
            >
              {isAdmin ? (
                <Link to="/admin" className={buttonClass("primary")}>
                  Add products
                </Link>
              ) : (
                <Link to="/contact" className={buttonClass("primary")}>
                  Request a quote
                </Link>
              )}
              <Link to="/products" className={buttonClass("outline")}>
                Browse the full range
              </Link>
            </EmptyState>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Nothing matches that."
              body="Try a shorter search or clear the filters. If you need a size that isn't listed, ask us — much of the range is made to order."
            >
              <button type="button" onClick={reset} className={buttonClass("outline")}>
                Clear filters
              </button>
              <Link to="/contact" className={buttonClass("primary")}>
                Ask about a custom size
              </Link>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-7 md:gap-y-14">
            {results.map((p, i) => (
              <ProductCard
                key={p.code}
                product={p}
                priority={i < 3}
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 45vw, 32vw"
              />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
