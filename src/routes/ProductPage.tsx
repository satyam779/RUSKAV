import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categories, CERT_LABEL, COLOR_HEX, COLOR_LABEL } from "../data/catalogue";
import { CertBadge, MaterialBadge } from "../components/icons/Badges";
import {
  Badge,
  KeyFacts,
  Notice,
  PerPiece,
  Price,
  ProductImage,
  Section,
  SpecSheet,
  Spinner,
  STOCK_LABEL,
  buttonClass,
  type SpecItem,
} from "../components/ui";
import { NotFoundPage } from "./NotFoundPage";
import { cart, useCartLines } from "../lib/cart";
import { effectivePrice, hasPrice, useProducts } from "../lib/products";
import { useProductSeo } from "../lib/seo";

/** Gross case weight, trimmed of the trailing zeros a numeric column carries. */
function formatWeight(kg: number | null) {
  if (kg === null || kg <= 0) return null;
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(kg)} kg gross`;
}

export function ProductPage() {
  const { code } = useParams<{ code: string }>();
  const { products, loading } = useProducts();
  const lines = useCartLines();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.code === code);
  const category = categories.find((c) => c.id === product?.categoryId);

  useEffect(() => {
    if (product) document.title = `${product.code} — ${product.name} | Ruskav`;
  }, [product]);

  useProductSeo(product, category?.name);

  // A deep link arrives before the product list does; only a finished load
  // with no match is actually a 404.
  useEffect(() => {
    setActiveImage(0);
    setQuantity(product?.moq ?? 1);
  }, [product?.code, product?.moq]);

  if (loading && !product) return <Spinner label="Loading product" />;
  if (!product) return <NotFoundPage />;

  const inCart = lines.find((l) => l.code === product.code)?.quantity ?? 0;
  const stock = STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock;
  const soldOut = product.stockStatus === "out_of_stock";
  const unit = effectivePrice(product);
  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.code !== product.code)
    .slice(0, 4);

  /**
   * The full sheet, in the order a buyer reads one: what it is, how it is
   * packed, what it is made of, then the commercial and dispatch detail, then
   * the tested figures off the print catalogue. `SpecSheet` drops the rows
   * that are not filled in, so a thin product still reads as a finished page.
   */
  const specItems: SpecItem[] = [
    { label: "Product code", value: product.code },
    { label: "Range", value: category?.name },
    { label: "Product line", value: product.groupName },
    { label: "Size", value: product.size },
    { label: "Pieces per case", value: `${product.casePack} ea.` },
    { label: "Material", value: product.material },
    {
      label: "Recycling code",
      value: product.materialCode ? (
        <span className="inline-flex items-center gap-1.5">
          <MaterialBadge code={product.materialCode} size={20} />
          {product.materialCode}
        </span>
      ) : null,
    },
    { label: "Surface", value: product.surface },
    {
      label: "Colourways",
      value: product.colors.length ? product.colors.map((c) => COLOR_LABEL[c]).join(", ") : null,
    },
    { label: "Minimum order", value: `${product.moq} ${product.moq === 1 ? "case" : "cases"}` },
    { label: "HSN code", value: product.hsnCode },
    { label: "GST", value: `${product.taxPercent}%` },
    { label: "Lead time", value: product.leadTime },
    { label: "Case weight", value: formatWeight(product.caseWeightKg) },
    { label: "Carton", value: product.cartonSize },
    { label: "Availability", value: stock.label },
    {
      label: "Rated for",
      value: product.certs.length ? product.certs.map((c) => CERT_LABEL[c]).join(", ") : null,
    },
    ...product.specs.map((row) => ({ label: row.label, value: row.value })),
  ];

  return (
    <>
      <div className="bg-paper pt-24 md:pt-32">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-6">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <li>
              <Link to="/shop" className="hover:text-brand">
                Shop
              </Link>
            </li>
            {category && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to={`/products/${category.id}`} className="hover:text-brand">
                    {category.shortName}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink">{product.code}</li>
          </ol>
        </nav>
      </div>

      <Section className="bg-paper pt-10 md:pt-12">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <ProductImage
              src={product.images[activeImage] ?? product.images[0]}
              alt={product.name}
              ratio="aspect-square"
              className="rounded-[2rem]"
              sizes="(max-width: 768px) 92vw, 46vw"
            />
            {product.images.length > 1 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {product.images.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-pressed={i === activeImage}
                      className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                        i === activeImage ? "border-brand" : "border-transparent hover:border-ink/20"
                      }`}
                    >
                      <span className="sr-only">Show image {i + 1}</span>
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full bg-studio object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm font-semibold text-brand-dark">{product.code}</p>
              <Badge tone={stock.tone}>{stock.label}</Badge>
              {product.discountPercent > 0 && (
                <Badge tone="brand">{Math.round(product.discountPercent)}% off</Badge>
              )}
              {product.leadTime && <Badge>{product.leadTime}</Badge>}
            </div>

            <h1 className="font-display mt-3 text-balance text-3xl font-medium leading-[1.1] text-ink md:text-4xl">
              {product.name}
            </h1>
            {product.groupName && product.groupName !== product.name && (
              <p className="mt-2 text-sm text-ink-soft">{product.groupName}</p>
            )}
            {product.description && (
              <p className="mt-5 text-balance leading-relaxed text-ink-soft">
                {product.description}
              </p>
            )}

            <KeyFacts
              className="mt-6 border-y border-ink/10 py-4"
              items={[
                { label: "Size", value: product.size },
                { label: "Case pack", value: `${product.casePack} ea.` },
                { label: "Material", value: product.material },
                {
                  label: "Min. order",
                  value: `${product.moq} ${product.moq === 1 ? "case" : "cases"}`,
                },
              ]}
            />

            <div className="mt-7 rounded-3xl border border-ink/10 bg-white/70 p-6">
              <Price product={product} size="lg" />
              <PerPiece product={product} className="mt-2 text-sm text-ink-soft" />
              {unit !== null && (
                <p className="mt-1 text-xs text-ink-soft">
                  {product.taxPercent}% GST added at checkout
                  {product.hsnCode ? ` · HSN ${product.hsnCode}` : ""}
                </p>
              )}
              {!hasPrice(product) && (
                <p className="mt-2 text-xs text-ink-soft">
                  Add it to your order and we&apos;ll come back with pricing and MOQ.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
                  Cases
                  <div className="flex items-center overflow-hidden rounded-full border border-ink/15">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(product.moq, q - 1))}
                      className="grid h-10 w-10 place-items-center text-ink transition hover:bg-ink/5"
                    >
                      <span className="sr-only">Decrease quantity</span>
                      <span aria-hidden="true">−</span>
                    </button>
                    <input
                      type="number"
                      min={product.moq}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(product.moq, Number.parseInt(e.target.value, 10) || product.moq))
                      }
                      className="w-14 border-0 bg-transparent py-2 text-center text-sm font-semibold text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Number of cases"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="grid h-10 w-10 place-items-center text-ink transition hover:bg-ink/5"
                    >
                      <span className="sr-only">Increase quantity</span>
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                </label>

                <button
                  type="button"
                  disabled={soldOut}
                  onClick={() => cart.add(product.code, quantity)}
                  className={buttonClass("primary", "h-10 flex-1 !px-6")}
                >
                  {soldOut ? "Out of stock" : "Add to order"}
                </button>
              </div>

              {(product.moq > 1 || product.leadTime) && (
                <p className="mt-3 text-xs text-ink-soft">
                  {[
                    product.moq > 1 ? `Minimum order ${product.moq} cases` : null,
                    product.leadTime,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  .
                </p>
              )}

              {inCart > 0 && (
                <div className="mt-4">
                  <Notice>
                    {inCart} {inCart === 1 ? "case" : "cases"} already on your order.{" "}
                    <Link to="/cart" className="font-semibold text-brand hover:underline">
                      Review order
                    </Link>
                  </Notice>
                </div>
              )}
            </div>

            {product.colors.length > 0 && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-wider text-ink-soft/70">
                  Available colourways
                </p>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {product.colors.map((c) => (
                    <li key={c} className="flex flex-col items-center gap-1.5">
                      {c === "transparent" ? (
                        <span
                          className="block h-8 w-8 rounded-full border border-ink/15"
                          style={{
                            background:
                              "repeating-conic-gradient(from 0deg, #ffffff 0deg 90deg, #e7e4da 90deg 180deg)",
                          }}
                        />
                      ) : (
                        <span
                          className="block h-8 w-8 rounded-full border border-ink/10 shadow-sm"
                          style={{ background: COLOR_HEX[c] }}
                        />
                      )}
                      <span className="text-[10px] text-ink-soft">{COLOR_LABEL[c]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.certs.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {product.certs.map((c) => (
                  <CertBadge key={c} kind={c} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-medium text-ink">
                Technical specification
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
                Everything on file for {product.code}. Quote the code when you order, ask for a
                sample, or send it to us with the size you need instead.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className={buttonClass("outline", "print-hide")}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M6 7V3.5h8V7M6 14.5H4.5A1.5 1.5 0 0 1 3 13V9a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 17 9v4a1.5 1.5 0 0 1-1.5 1.5H14"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <rect x="6" y="12" width="8" height="4.5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              Print spec sheet
            </button>
          </div>

          <SpecSheet items={specItems} className="mt-6" />

          {product.qualityNotes && (
            <div className="mt-8 rounded-2xl border border-ink/10 bg-paper-dim/50 p-6">
              <h3 className="font-display text-lg font-medium text-ink">Quality notes</h3>
              <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed text-ink-soft">
                {product.qualityNotes}
              </p>
            </div>
          )}
        </div>

      </Section>

      {related.length > 0 && (
        <Section className="bg-paper-dim">
          <h2 className="font-display mb-8 text-2xl font-medium text-ink">
            More from {category?.shortName ?? "this range"}
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <Link
                key={p.code}
                to={`/shop/${encodeURIComponent(p.code)}`}
                className="group flex flex-col gap-3 rounded-3xl border border-ink/10 bg-white/70 p-4 transition hover:border-brand/40"
              >
                <ProductImage
                  src={p.images[0]}
                  alt={p.name}
                  className="transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 45vw, 22vw"
                />
                <div>
                  <p className="font-mono text-[11px] font-semibold text-brand-dark">{p.code}</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{p.name}</p>
                  <div className="mt-2">
                    <Price product={p} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
