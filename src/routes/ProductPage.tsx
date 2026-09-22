import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  categories,
  CERT_LABEL,
  COLOR_HEX,
  COLOR_LABEL,
  type ColorKey,
} from "../data/catalogue";
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
import { ProductCard } from "../components/ProductCard";
import { TradeGate } from "../components/TradeGate";
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

  /**
   * Everything there is to look at, in one list: the gallery shots first, then
   * a frame per photographed colourway.
   *
   * One list rather than two pieces of state, because the thumbnail strip and
   * the colour swatches are two ways of asking for the same thing — and two
   * selections that can disagree is how you end up showing the green tray with
   * "Red" highlighted.
   */
  const frames: { src: string; label: string; color?: ColorKey }[] = [];
  const seen = new Set<string>();
  for (const src of product.images) {
    if (src && !seen.has(src)) {
      seen.add(src);
      frames.push({ src, label: `View ${frames.length + 1}` });
    }
  }
  for (const color of product.colors) {
    const src = product.colorImages[color];
    if (src && !seen.has(src)) {
      seen.add(src);
      frames.push({ src, label: COLOR_LABEL[color], color });
    }
  }
  if (!frames.length) frames.push({ src: "", label: "No photograph yet" });

  const current = frames[Math.min(activeImage, frames.length - 1)];
  const photographedColors = frames.filter((f) => f.color).length;
  const frameForColor = (color: ColorKey) => frames.findIndex((f) => f.color === color);

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
              src={current.src || undefined}
              alt={current.color ? `${product.name} in ${current.label}` : product.name}
              ratio="aspect-square"
              frameClassName="rounded-[2rem]"
              panel={product.categoryId === "bio" ? "bio" : "studio"}
              eager
              sizes="(max-width: 768px) 92vw, 46vw"
            >
              {product.discountPercent > 0 && (
                <span className="absolute left-5 top-5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-brand/40">
                  {Math.round(product.discountPercent)}% off
                </span>
              )}
            </ProductImage>
            {frames.length > 1 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {frames.map((frame, i) => (
                  <li key={frame.src}>
                    <button
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-pressed={i === activeImage}
                      className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                        i === activeImage ? "border-brand" : "border-transparent hover:border-ink/20"
                      }`}
                    >
                      <span className="sr-only">Show {frame.label}</span>
                      <img
                        src={frame.src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="media-panel h-full w-full object-cover"
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

            <div className="mt-7 overflow-hidden rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_16px_40px_-30px_rgba(23,20,15,0.6)]">
              {hasPrice(product) && (
                <div className="mb-5">
                  <TradeGate compact />
                </div>
              )}
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
                  {photographedColors > 0
                    ? "Colourways — press one to see it"
                    : "Available colourways"}
                </p>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {product.colors.map((c) => {
                    const frameIndex = frameForColor(c);
                    const hasPhoto = frameIndex >= 0;
                    const selected = hasPhoto && frameIndex === activeImage;

                    const dot = (
                      <span
                        className={`block h-8 w-8 rounded-full border shadow-sm transition ${
                          selected
                            ? "border-brand ring-2 ring-brand ring-offset-2"
                            : "border-ink/12"
                        }`}
                        style={{
                          background:
                            c === "transparent"
                              ? "repeating-conic-gradient(from 0deg, #ffffff 0deg 90deg, #e7e4da 90deg 180deg)"
                              : COLOR_HEX[c],
                        }}
                      />
                    );

                    return (
                      <li key={c} className="flex flex-col items-center gap-1.5">
                        {hasPhoto ? (
                          <button
                            type="button"
                            onClick={() => setActiveImage(frameIndex)}
                            aria-pressed={selected}
                            className="group/swatch flex flex-col items-center gap-1.5"
                          >
                            <span className="relative block transition group-hover/swatch:scale-110">
                              {dot}
                              {/* A colour you can press has to look different
                                  from one you cannot, or every swatch reads as
                                  broken until you try them all. */}
                              <span
                                aria-hidden="true"
                                className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-brand text-[7px] font-bold text-white"
                              >
                                ●
                              </span>
                            </span>
                            <span
                              className={`text-[10px] ${
                                selected ? "font-semibold text-brand" : "text-ink-soft"
                              }`}
                            >
                              {COLOR_LABEL[c]}
                            </span>
                          </button>
                        ) : (
                          <>
                            <span title={`${COLOR_LABEL[c]} — available to order`}>{dot}</span>
                            <span className="text-[10px] text-ink-soft">{COLOR_LABEL[c]}</span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {photographedColors > 0 && photographedColors < product.colors.length && (
                  <p className="mt-3 text-[11px] text-ink-soft/80">
                    Colours marked with a dot are photographed. The rest are made to order
                    in the same finish — ask us for a sample.
                  </p>
                )}
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <ProductCard
                key={p.code}
                product={p}
                size="compact"
                sizes="(max-width: 640px) 46vw, 23vw"
              />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
