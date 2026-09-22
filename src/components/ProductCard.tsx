import { useState } from "react";
import { Link } from "react-router-dom";
import { COLOR_HEX, COLOR_LABEL, type ColorKey } from "../data/catalogue";
import { PerPiece, Price, ProductImage } from "./ui";
import { cart, useCartLines } from "../lib/cart";
import type { ShopProduct } from "../lib/products";

/**
 * Colourways as dots.
 *
 * A wholesale buyer picks the range first and the colour second, so the card
 * shows that a line comes in eleven finishes without listing eleven words.
 * Past five the rest become a count — a row of dots that wraps stops being a
 * signal and starts being a texture.
 */
function ColorDots({ colors, max = 5 }: { colors: ColorKey[]; max?: number }) {
  if (!colors.length) return null;
  const shown = colors.slice(0, max);
  const rest = colors.length - shown.length;

  return (
    <div className="flex items-center gap-1.5">
      <ul className="flex items-center -space-x-1">
        {shown.map((c) => (
          <li
            key={c}
            title={COLOR_LABEL[c]}
            className="h-3 w-3 rounded-full ring-2 ring-paper"
            style={{
              background:
                c === "transparent"
                  ? "repeating-conic-gradient(from 0deg, #ffffff 0deg 90deg, #e7e4da 90deg 180deg)"
                  : COLOR_HEX[c],
            }}
          />
        ))}
      </ul>
      <span className="text-[10px] font-medium text-ink-soft/70">
        {rest > 0 ? `+${rest}` : colors.length === 1 ? "1 colour" : `${colors.length} colours`}
      </span>
    </div>
  );
}

export type ProductCardSize = "compact" | "full";

/**
 * One product, everywhere it appears.
 *
 * The shop grid, the home page, a category strip and the related rail all used
 * to draw their own card, which is why the same tray looked like three
 * different products depending on the page.
 *
 * The photograph does the selling, so it gets the card: full bleed, no border,
 * no panel around it. Everything a buyer has to read sits underneath in four
 * short lines — code, name, format, price — and the one thing they can *do*
 * from the grid is a single button on the image. A resting grid of these is a
 * catalogue spread; a grid of bordered boxes each with a button in it is a
 * form.
 */
export function ProductCard({
  product,
  size = "full",
  priority = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 32vw",
}: {
  product: ShopProduct;
  size?: ProductCardSize;
  /**
   * Above the fold on this page. Only the grid that opens a page should set
   * it: the home page's cards sit below a full-screen hero, where eager
   * loading competes with the hero's own frames for the connection.
   */
  priority?: boolean;
  sizes?: string;
}) {
  const lines = useCartLines();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = lines.find((l) => l.code === product.code)?.quantity ?? 0;
  const soldOut = product.stockStatus === "out_of_stock";
  const madeToOrder = product.stockStatus === "made_to_order";
  const href = `/shop/${encodeURIComponent(product.code)}`;
  const compact = size === "compact";

  const add = () => {
    cart.add(product.code, product.moq);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative">
        <Link to={href} className="block" aria-label={`${product.code} — ${product.name}`}>
          <ProductImage
            src={product.images[0]}
            hoverSrc={product.images[1]}
            alt={product.name}
            ratio="aspect-square"
            frameClassName="rounded-xl"
            sizes={sizes}
            eager={priority}
            panel={product.categoryId === "bio" ? "bio" : "studio"}
            className="group-hover/media:scale-[1.04]"
          >
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {product.discountPercent > 0 && (
                <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shadow-brand/40">
                  {Math.round(product.discountPercent)}% off
                </span>
              )}
              {soldOut && (
                <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-paper">
                  Out of stock
                </span>
              )}
              {madeToOrder && !soldOut && (
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft backdrop-blur-sm">
                  Made to order
                </span>
              )}
            </div>

            {/* Hover only, and never on a touch screen — where tapping the
                image already opens the product, and a permanent scrim would
                only dim every photograph in the grid. */}
            <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-ink/25 opacity-0 transition-opacity duration-300 group-hover/media:opacity-100 [@media(hover:hover)]:flex">
              <span className="bg-ink px-6 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-paper shadow-lg">
                View details
              </span>
            </span>
          </ProductImage>
        </Link>

        {!compact && !soldOut && (
          <button
            type="button"
            onClick={add}
            className={`absolute bottom-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full shadow-lg shadow-ink/25 transition duration-300 hover:scale-110 ${
              justAdded ? "bg-ink text-paper" : "bg-white text-brand hover:bg-brand hover:text-white"
            }`}
          >
            <span className="sr-only">
              {justAdded
                ? `${product.code} added to your order`
                : `Add ${product.code} to your order`}
            </span>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {justAdded ? (
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              )}
            </svg>
          </button>
        )}

        {inCart > 0 && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white shadow-sm">
            {inCart}
            <span className="sr-only"> cases on your order</span>
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "gap-1 pt-3" : "gap-1.5 pt-4"}`}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft/70">
          SKU: {product.code}
        </p>

        <h3
          className={`font-display font-medium leading-snug text-ink ${
            compact ? "text-sm" : "text-base sm:text-lg"
          }`}
        >
          <Link to={href} className="transition hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <p className="text-xs leading-relaxed text-ink-soft">
          {[product.size, `Case of ${product.casePack}`, compact ? null : product.material]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {!compact && product.colors.length > 0 && <ColorDots colors={product.colors} />}

        <div className={`mt-auto ${compact ? "pt-2" : "pt-3"}`}>
          <Price product={product} size={compact ? "sm" : "md"} />
          <PerPiece product={product} className="mt-1 text-[11px] text-ink-soft" />
          {!compact && product.moq > 1 && (
            <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-soft/60">
              Min. {product.moq} cases
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
