import { Link, useLocation } from "react-router-dom";
import { loginHref, useTradeAccess } from "../lib/trade";

/**
 * The explanation behind every padlock on the site.
 *
 * A locked price with no reason next to it reads as a site that is broken or
 * cagey. This says the quiet part out loud — the list is wholesale, the
 * account is free, and it takes one tap with Google — and gives the buyer the
 * button rather than sending them hunting for it.
 *
 * It renders nothing once someone is in: a banner that congratulates a
 * signed-in buyer on being signed in is just furniture.
 */
export function TradeGate({ compact = false }: { compact?: boolean }) {
  const { unlocked, loading } = useTradeAccess();
  const { pathname } = useLocation();

  if (unlocked || loading) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-brand/20 bg-brand-tint px-4 py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white">
          <LockGlyph />
        </span>
        <p className="flex-1 text-[13px] font-medium text-brand-dark">
          Prices are for trade accounts.
        </p>
        <Link
          to={loginHref(pathname)}
          className="rounded-full bg-brand px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink text-paper">
      {/* The oversized script R is the only place the wordmark appears at
          scale. It turns a utility banner into something that belongs to this
          brand rather than a generic paywall. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-16 select-none font-script text-[220px] leading-none text-brand/25"
      >
        R
      </span>
      <div className="absolute inset-y-0 left-0 w-1 bg-brand" />

      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
            <LockGlyph size={17} />
          </span>
          <div>
            <p className="eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] text-brand-light">
              Trade pricing
            </p>
            <h2 className="font-display mt-2.5 text-balance text-2xl font-medium leading-tight md:text-[1.75rem]">
              Sign in to see wholesale prices.
            </h2>
            <p className="mt-2 max-w-lg text-balance text-sm leading-relaxed text-paper/65">
              Case rates, per-piece costs and current offers are for account holders.
              Creating an account is free, takes one tap with Google, and keeps your
              orders and enquiries in one place.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 md:flex-col">
          <Link
            to={loginHref(pathname)}
            className="flex-1 rounded-full bg-brand px-6 py-3 text-center text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark md:flex-none"
          >
            Unlock prices
          </Link>
          <Link
            to="/contact"
            className="flex-1 rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-paper transition hover:border-white/60 md:flex-none"
          >
            Request a quote
          </Link>
        </div>
      </div>
    </div>
  );
}

function LockGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.75 6V4.4a2.25 2.25 0 0 1 4.5 0V6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
