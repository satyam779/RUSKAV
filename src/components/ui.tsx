import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { loginHref, useTradeAccess } from "../lib/trade";
import { tierApplies, useTier } from "../lib/tier";
import {
  compareAtPrice,
  effectivePrice,
  formatMoney,
  piecesPerUnit,
  tieredPrice,
  tieredPricePerPiece,
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

  // The scrim and the photograph are one CSS background rather than a stack of
  // absolutely-positioned elements. Inside a flex header those were sizing
  // themselves against the content instead of the header, which left a bare
  // strip of paper down one side on narrow screens.
  const backdropStyle = backdrop
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(250,248,244,0.72), rgba(250,248,244,0.80) 55%, rgb(250,248,244)), url("${
          typeof backdrop === "string" ? backdrop : HERO_STILL
        }")`,
      }
    : undefined;
  return (
    <header
      className={`relative overflow-hidden bg-cover bg-center ${tones[tone]} ${
        backdrop
          ? "flex min-h-[78svh] items-center pb-16 pt-[calc(var(--header-h)+3rem)] md:min-h-[100svh] md:pb-20 md:pt-[calc(var(--header-h)+5rem)]"
          : "pb-14 pt-[calc(var(--header-h)+3rem)] md:pb-20 md:pt-[calc(var(--header-h)+4.5rem)]"
      }`}
      style={backdropStyle}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <p
          className={`eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] ${
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
    <section
      id={id}
      className={`scroll-mt-[calc(var(--header-h)+1rem)] py-14 sm:py-20 md:py-28 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}

/**
 * The small red label above a heading. It carries the brand's one colour onto
 * every section of the site, which is most of what stops a cream-and-ink page
 * reading as a template.
 */
export function Eyebrow({
  children,
  tone = "brand",
  className = "",
}: {
  children: ReactNode;
  tone?: "brand" | "light" | "muted";
  className?: string;
}) {
  const tones = {
    brand: "text-brand",
    light: "text-brand-light",
    muted: "text-ink-soft/70",
  };
  return (
    <p
      className={`eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  kicker,
  title,
  intro,
  tone = "paper",
  action,
}: {
  kicker?: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "paper" | "ink";
  action?: ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
      <div className="max-w-2xl">
        {kicker && <Eyebrow tone={tone === "ink" ? "light" : "brand"}>{kicker}</Eyebrow>}
        <h2
          className={`font-display mt-4 max-w-xl text-balance text-3xl font-medium leading-[1.08] md:text-[2.6rem] ${
            tone === "ink" ? "text-paper" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-4 md:max-w-sm md:items-end">
        {intro && (
          <p
            className={`text-balance text-sm leading-relaxed md:text-right ${
              tone === "ink" ? "text-paper/65" : "text-ink-soft"
            }`}
          >
            {intro}
          </p>
        )}
        {action}
      </div>
    </div>
  );
}

/** Consistent button surfaces, so "primary action" looks the same everywhere. */
const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/30",
  ink: "bg-ink text-paper hover:bg-brand",
  outline: "border border-ink/20 text-ink hover:border-brand hover:text-brand",
  soft: "border border-brand/25 bg-brand-tint text-brand-dark hover:border-brand/60 hover:bg-brand/10",
  quiet: "text-ink-soft hover:text-ink",
} as const;

export type ButtonVariant = keyof typeof variants;

export const buttonClass = (variant: ButtonVariant = "primary", extra = "") =>
  `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${extra}`;

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.75 6V4.4a2.25 2.25 0 0 1 4.5 0V6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * The stand-in a signed-out visitor sees wherever a price would be.
 *
 * It is a link, not a notice: the one thing someone who just found a price
 * they cannot read wants is the way to read it, and making them hunt for the
 * sign-in button in the header loses them.
 */
export function PriceLock({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  // The label shortens with the frame. A two-up grid on a phone gives a card
  // about 130px of inner width, and "Sign in to unlock price" set in caps does
  // not fit in it — a pill that wraps to three lines is worse than a short one.
  const { pad, label, icon } = {
    sm: { pad: "px-2.5 py-1 text-[10px]", label: "Unlock price", icon: 11 },
    md: { pad: "px-2.5 py-1.5 text-[10px]", label: "Unlock price", icon: 11 },
    lg: { pad: "px-4 py-2.5 text-xs", label: "Sign in to unlock price", icon: 14 },
  }[size];

  return (
    <Link
      to={loginHref()}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-tint font-bold uppercase tracking-[0.06em] text-brand-dark transition hover:border-brand hover:bg-brand hover:text-white ${pad}`}
    >
      <LockIcon size={icon} />
      {label}
    </Link>
  );
}

/**
 * A product's price.
 *
 * Five states and each has to be unmistakable: still resolving, locked (a
 * trade visitor who is not signed in — the default on a wholesale site), a
 * plain price, a discounted one with the original struck through so the saving
 * is visible rather than implied, and no price at all — which is "on request",
 * never "free" or a blank space.
 *
 * A buyer on a trade band sees their own number, with the list price struck
 * beside it and the band named underneath. Quoting a dealer the list price
 * because their band had not loaded yet is worse than a moment of nothing, so
 * this waits.
 */
export function Price({
  product,
  size = "md",
}: {
  product: ShopProduct;
  size?: "sm" | "md" | "lg";
}) {
  const { unlocked, loading } = useTradeAccess();
  const { tier, loading: tierLoading } = useTier();

  const scale = {
    sm: { now: "text-base", was: "text-xs", unit: "text-[11px]" },
    md: { now: "text-xl", was: "text-sm", unit: "text-xs" },
    lg: { now: "text-3xl", was: "text-base", unit: "text-sm" },
  }[size];

  if (loading || (unlocked && tierLoading)) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block animate-sheen rounded-full bg-ink/8 ${
          size === "lg" ? "h-8 w-40" : "h-5 w-28"
        }`}
      />
    );
  }

  const listPrice = effectivePrice(product);

  // A line with no price is "on request" whether or not anyone is signed in —
  // there is nothing behind the lock to unlock.
  if (listPrice === null) {
    return (
      <span className={`font-display ${scale.now} font-medium text-ink-soft`}>
        Price on request
      </span>
    );
  }

  if (!unlocked) return <PriceLock size={size} />;

  const banded = tierApplies(tier);
  const now = tieredPrice(product, tier.discountPercent) ?? listPrice;
  // Strike the highest honest reference: the MRP if there is one, otherwise
  // the number a Regular account would be paying.
  const was = compareAtPrice(product) ?? (banded ? listPrice : null);
  const saved = was !== null && was > now ? Math.round(((was - now) / was) * 100) : 0;

  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`font-display ${scale.now} font-semibold text-ink`}>
          {formatMoney(now, product.currency)}
        </span>
        {saved > 0 && was !== null && (
          <>
            <s className={`${scale.was} text-ink-soft/70`}>{formatMoney(was, product.currency)}</s>
            <span className={`rounded-full bg-brand px-2 py-0.5 ${scale.unit} font-bold text-white`}>
              {saved}% off
            </span>
          </>
        )}
        <span className={`${scale.unit} text-ink-soft`}>per {product.priceUnit}</span>
      </span>
      {banded && (
        <span className={`${scale.unit} font-semibold text-brand-dark`}>
          {tier.label} price · {tier.discountPercent}% trade discount applied
        </span>
      )}
    </span>
  );
}

/**
 * The per-piece figure under a case price.
 *
 * Trays are bought by the case and compared by the piece, and a buyer who has
 * to divide 1,250 by 50 in their head to check a quote is being made to work.
 * Behind the same gate as the price itself: quoting a per-piece rate to a
 * signed-out visitor would publish the case price by multiplication.
 */
export function PerPiece({
  product,
  className = "text-xs text-ink-soft",
}: {
  product: ShopProduct;
  className?: string;
}) {
  const { unlocked } = useTradeAccess();
  const { tier } = useTier();
  const piece = tieredPricePerPiece(product, tier.discountPercent);
  const pieces = piecesPerUnit(product);
  if (piece === null || pieces <= 1) return null;

  if (!unlocked) {
    return (
      <p className={className}>
        {pieces} pieces in a {product.priceUnit}
      </p>
    );
  }

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
          className="flex items-baseline justify-between gap-3 border-b border-ink/8 px-4 py-3 last:border-b-0 sm:gap-6 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
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
 * lit studio panel — without it the product's white edge disappears into a
 * cream page and the silhouette goes with it. One panel under every frame is
 * what makes a grid of mixed photography read as a single shoot.
 *
 * Pass `hoverSrc` and the frame cross-fades to a second angle on hover, which
 * is how a buyer scanning a grid gets a second look without opening anything.
 */
export function ProductImage({
  src,
  hoverSrc,
  alt,
  className = "",
  frameClassName = "",
  ratio = "aspect-square",
  sizes,
  panel = "studio",
  eager = false,
  children,
}: {
  src: string | undefined;
  hoverSrc?: string;
  alt: string;
  /** Applied to the image, for per-card zoom. */
  className?: string;
  /** Applied to the panel, for radius and ring overrides. */
  frameClassName?: string;
  ratio?: string;
  sizes?: string;
  panel?: "studio" | "bio" | "ink";
  eager?: boolean;
  /** Overlays — badges, a quick-add button — positioned against the frame. */
  children?: ReactNode;
}) {
  const panels = {
    studio: "media-panel",
    bio: "media-panel-bio",
    ink: "media-panel-ink",
  };

  return (
    <div
      className={`group/media relative ${ratio} overflow-hidden rounded-2xl ${panels[panel]} ${frameClassName}`}
    >
      {src ? (
        <>
          <img
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            decoding="async"
            sizes={sizes}
            className={`h-full w-full object-cover transition-[opacity,transform,scale] duration-700 ease-out ${
              hoverSrc ? "group-hover/media:opacity-0" : ""
            } ${className}`}
          />
          {hoverSrc && (
            <img
              src={hoverSrc}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              sizes={sizes}
              className={`absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform,scale] duration-700 ease-out group-hover/media:opacity-100 ${className}`}
            />
          )}
        </>
      ) : (
        <div className="grid h-full w-full place-items-center text-ink-soft/40">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="m4 16 4.5-4.5 3 3L15 11l5 5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </div>
      )}

      {/* A hairline inside the radius. A border would sit outside the image and
          fight the card's own edge; an inset ring reads as the panel's lip. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-ink/[0.07]"
      />
      {children}
    </div>
  );
}
