import type { ReactNode } from "react";
import {
  compareAtPrice,
  effectivePrice,
  formatMoney,
  piecesPerUnit,
  pricePerPiece,
  type ShopProduct,
} from "../lib/products";

/** The frame the home hero settles on, reused as masthead scenery. */
const HERO_STILL = "/Products%20Images/ezgif-frame-295.jpg?v=3";

/**
 * Shared page furniture. Every route outside the home page opens with the same
 * masthead, so the pages read as one site rather than a set of templates.
 */
export function PageHeader({
  kicker,
  title,
  intro,
  children,
  tone = "paper",
  backdrop = false,
}: {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  tone?: "paper" | "dim" | "ink";
  /**
   * Scenery behind this masthead: `true` for the hero's tray stack, or an
   * image path for a range that should show its own product instead. A
   * masthead with one fills the screen — a backdrop cropped to a strip reads
   * as a banner rather than a setting.
   */
  backdrop?: boolean | string;
}) {
  const tones = {
    paper: "bg-paper text-ink",
    dim: "bg-paper-dim text-ink",
    ink: "bg-ink text-paper",
  };
  return (
    <header
      className={`relative overflow-hidden ${tones[tone]} ${
        backdrop
          ? "flex min-h-[100svh] items-center pt-28 pb-20 md:pt-36"
          : "pt-28 pb-14 md:pt-36 md:pb-20"
      }`}
    >
      {backdrop && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {/* One still from the home page's sequence, not the sequence itself:
              the masthead wants a setting, not a second animation competing
              with the page under it. */}
          <img
            src={typeof backdrop === "string" ? backdrop : HERO_STILL}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/78 to-paper" />
        </div>
      )}
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.35em] ${
            tone === "ink" ? "text-brand-light" : "text-brand"
          }`}
        >
          {kicker}
        </p>
        <h1 className="font-display mt-4 max-w-3xl text-balance text-4xl font-medium leading-[1.06] md:text-6xl">
          {title}
        </h1>
        {intro && (
          <p
            className={`mt-6 max-w-2xl text-balance text-lg leading-relaxed ${
              tone === "ink" ? "text-paper/70" : "text-ink-soft"
            }`}
          >
            {intro}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 md:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  intro,
}: {
  kicker?: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">{kicker}</p>
        )}
        <h2 className="font-display mt-4 max-w-xl text-balance text-3xl font-medium leading-[1.1] text-ink md:text-4xl">
          {title}
        </h2>
      </div>
      {intro && <p className="max-w-sm text-balance text-ink-soft">{intro}</p>}
    </div>
  );
}

/** Consistent button surfaces, so "primary action" looks the same everywhere. */
const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/30",
  ink: "bg-ink text-paper hover:bg-brand",
  outline: "border border-ink/20 text-ink hover:border-ink/45",
  quiet: "text-ink-soft hover:text-ink",
} as const;

export type ButtonVariant = keyof typeof variants;

export const buttonClass = (variant: ButtonVariant = "primary", extra = "") =>
  `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${extra}`;

/**
 * A product's price.
 *
 * Three states matter and each has to be unmistakable: a plain price, a
 * discounted price (struck-through original beside it, so the saving is
 * visible rather than implied), and no price at all — which is "on request",
 * never "free" or a blank space.
 */
export function Price({
  product,
  size = "md",
}: {
  product: ShopProduct;
  size?: "sm" | "md" | "lg";
}) {
  const now = effectivePrice(product);
  const was = compareAtPrice(product);

  const scale = {
    sm: { now: "text-base", was: "text-xs", unit: "text-[11px]" },
    md: { now: "text-xl", was: "text-sm", unit: "text-xs" },
    lg: { now: "text-3xl", was: "text-base", unit: "text-sm" },
  }[size];

  if (now === null) {
    return (
      <span className={`font-display ${scale.now} font-medium text-ink-soft`}>
        Price on request
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-display ${scale.now} font-semibold text-ink`}>
        {formatMoney(now, product.currency)}
      </span>
      {was !== null && was > now && (
        <>
          <s className={`${scale.was} text-ink-soft/70`}>{formatMoney(was, product.currency)}</s>
          <span
            className={`rounded-full bg-brand/10 px-2 py-0.5 ${scale.unit} font-bold text-brand`}
          >
            {Math.round(((was - now) / was) * 100)}% off
          </span>
        </>
      )}
      <span className={`${scale.unit} text-ink-soft`}>per {product.priceUnit}</span>
    </span>
  );
}

/**
 * The per-piece figure under a case price.
 *
 * Trays are bought by the case and compared by the piece, and a buyer who has
 * to divide 1,250 by 50 in their head to check a quote is being made to work.
 */
export function PerPiece({
  product,
  className = "text-xs text-ink-soft",
}: {
  product: ShopProduct;
  className?: string;
}) {
  const piece = pricePerPiece(product);
  const pieces = piecesPerUnit(product);
  if (piece === null || pieces <= 1) return null;

  return (
    <p className={className}>
      <strong className="font-semibold text-ink">
        {formatMoney(piece, product.currency)}
      </strong>{" "}
      per piece · {pieces} in a {product.priceUnit}
    </p>
  );
}

export type SpecItem = { label: string; value: ReactNode };

/**
 * A specification sheet.
 *
 * Rows with nothing in them are dropped rather than printed empty: a blank
 * "Lead time —" reads as a company that does not know its own lead time,
 * where an absent row simply is not part of this product's sheet.
 */
export function SpecSheet({ items, className = "" }: { items: SpecItem[]; className?: string }) {
  const rows = items.filter(
    (i) => i.value !== null && i.value !== undefined && i.value !== "" && i.value !== false
  );
  if (rows.length === 0) return null;

  return (
    <dl
      className={`grid overflow-hidden rounded-2xl border border-ink/10 bg-white/60 sm:grid-cols-2 ${className}`}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-6 border-b border-ink/8 px-4 py-3 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
        >
          <dt className="shrink-0 text-xs uppercase tracking-wider text-ink-soft/80">
            {row.label}
          </dt>
          <dd className="text-right text-sm font-medium text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The three or four facts that decide whether a buyer reads any further. */
export function KeyFacts({ items, className = "" }: { items: SpecItem[]; className?: string }) {
  const rows = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  if (rows.length === 0) return null;

  return (
    <dl className={`flex flex-wrap gap-x-6 gap-y-2 ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col">
          <dt className="text-[10px] uppercase tracking-wider text-ink-soft/70">{row.label}</dt>
          <dd className="text-sm font-medium text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "good" | "warn";
}) {
  const tones = {
    neutral: "border-ink/12 bg-white/70 text-ink-soft",
    brand: "border-brand/25 bg-brand/8 text-brand-dark",
    good: "border-emerald-600/25 bg-emerald-600/8 text-emerald-800",
    warn: "border-amber-600/30 bg-amber-500/10 text-amber-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export const STOCK_LABEL: Record<string, { label: string; tone: "good" | "warn" | "neutral" }> = {
  in_stock: { label: "In stock", tone: "good" },
  made_to_order: { label: "Made to order", tone: "warn" },
  out_of_stock: { label: "Out of stock", tone: "neutral" },
};

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-20 text-ink-soft">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-brand" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 px-6 py-16 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-balance text-sm text-ink-soft">{body}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error";
  children: ReactNode;
}) {
  const tones = {
    info: "border-ink/12 bg-white/70 text-ink-soft",
    warn: "border-amber-500/30 bg-amber-500/8 text-amber-900",
    error: "border-brand/30 bg-brand/6 text-brand-dark",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}

/**
 * Product imagery.
 *
 * The catalogue photographs are cut-outs on transparency, so each sits on a
 * tinted panel — without it the product's white edge disappears into a cream
 * page and the silhouette goes with it.
 *
 * They fill the frame. Containing them kept every millimetre of a wide tray
 * but left thick bands of tint above and below it, which read as a broken
 * image rather than a considered one.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  ratio = "aspect-square",
  sizes,
}: {
  src: string | undefined;
  alt: string;
  className?: string;
  ratio?: string;
  sizes?: string;
}) {
  return (
    <div className={`${ratio} overflow-hidden rounded-2xl bg-studio ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-ink-soft/40">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="m4 16 4.5-4.5 3 3L15 11l5 5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </div>
      )}
    </div>
  );
}
