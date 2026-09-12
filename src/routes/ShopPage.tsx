import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categories, CERT_LABEL, type CertKind } from "../data/catalogue";
import {
  Badge,
  EmptyState,
  KeyFacts,
  Notice,
  PageHeader,
  PerPiece,
  Price,
  ProductImage,
  Section,
  Spinner,
  STOCK_LABEL,
  buttonClass,
} from "../components/ui";
import { cart, useCartLines } from "../lib/cart";
import { effectivePrice, hasPrice, useProducts, type ShopProduct } from "../lib/products";

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
          : "border-ink/15 bg-white/70 text-ink-soft hover:border-ink/35 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({ product }: { product: ShopProduct }) {
  const lines = useCartLines();
  const inCart = lines.find((l) => l.code === product.code)?.quantity ?? 0;
  const stock = STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock;
  const soldOut = product.stockStatus === "out_of_stock";

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white/70 transition hover:border-brand/35 hover:shadow-lg hover:shadow-ink/5">
      <Link to={`/shop/${encodeURIComponent(product.code)}`} className="group block p-4 pb-0">
        <div className="relative">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
          />
          {product.discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              {Math.round(product.discountPercent)}% off
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] font-semibold text-brand-dark">{product.code}</p>
          <Badge tone={stock.tone}>{stock.label}</Badge>
        </div>

        <h3 className="font-display text-lg font-medium leading-snug text-ink">
          <Link to={`/shop/${encodeURIComponent(product.code)}`} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <KeyFacts
          className="mt-1"
          items={[
            { label: "Size", value: product.size },
            { label: "Case pack", value: `${product.casePack} ea.` },
            { label: "Material", value: product.material },
          ]}
        />

        <div className="mt-auto pt-4">
          <Price product={product} />
          <PerPiece product={product} className="mt-1 text-xs text-ink-soft" />
          {(product.moq > 1 || product.leadTime) && (
            <p className="mt-1.5 text-[11px] text-ink-soft/90">
              {[product.moq > 1 ? `Min. ${product.moq} cases` : null, product.leadTime]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={soldOut}
              onClick={() => cart.add(product.code, product.moq)}
              className={buttonClass("primary", "flex-1")}
            >
              {soldOut ? "Out of stock" : inCart > 0 ? `Add another case` : "Add to order"}
            </button>
            {inCart > 0 && (
              <span className="rounded-full bg-brand/10 px-3 py-2 text-xs font-bold text-brand">
                {inCart}
              </span>
            )}
          </div>
          {!hasPrice(product) && (
            <p className="mt-2 text-[11px] text-ink-soft">
              Added as a quote request — we&apos;ll price it and come back to you.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ShopPage() {
  const { products, loading, usingFallback } = useProducts();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cert, setCert] = useState<CertKind | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");
  const [discountOnly, setDiscountOnly] = useState(false);

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

  return (
    <>
      <PageHeader
        kicker="Shop"
        title="Order by the case."
        intro="Live pricing, case packs and current discounts across the range. Add what you need, then send it as an enquiry or pay online."
      />

      <Section className="bg-paper pt-10 md:pt-14">
        {usingFallback && (
          <div className="mb-8">
            <Notice tone="warn">
              <strong className="font-semibold">Showing the print catalogue.</strong> Live
              pricing isn&apos;t connected yet, so these lines are listed as price-on-request.
              You can still build an order and send it to us as an enquiry.
            </Notice>
          </div>
        )}

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
                placeholder='Search "tray", "12 x 16" or "RT1014"'
                className="w-full rounded-2xl border border-ink/12 bg-paper-dim/60 py-3.5 pl-12 pr-4 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                Range
              </span>
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId((v) => (v === c.id ? null : c.id))}
                >
                  {c.shortName}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                Rated for
              </span>
              {certFilters.map((c) => (
                <Chip key={c} active={cert === c} onClick={() => setCert((v) => (v === c ? null : c))}>
                  {CERT_LABEL[c]}
                </Chip>
              ))}
              <Chip active={discountOnly} onClick={() => setDiscountOnly((v) => !v)}>
                On offer
              </Chip>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <p aria-live="polite" className="text-sm text-ink-soft">
              <strong className="font-semibold text-ink">{results.length}</strong>{" "}
              {results.length === 1 ? "product" : "products"}
              {filtersActive ? " match your filters" : " in the range"}
            </p>
            <div className="flex items-center gap-3">
              {filtersActive && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/5"
                >
                  Clear filters
                </button>
              )}
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-ink/12 bg-paper-dim/60 px-3 py-2 text-xs font-medium text-ink transition focus:border-brand"
                >
                  {sorts.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading prices" />
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => (
              <ProductCard key={p.code} product={p} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
