import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTradeAccess } from "../lib/trade";

const STORAGE_KEY = "ruskav:announcement-dismissed";

/**
 * The red strip across the top of every page.
 *
 * It does two jobs. It puts the brand's one colour at the top of every screen,
 * which a cream-and-ink page badly needs. And it states the deal a wholesale
 * visitor has to understand within a second of arriving: the prices are here,
 * behind an account, and the account is free.
 *
 * No carousel and no timer — three facts, laid out, so nothing on the page
 * moves while someone is reading it.
 */
export function AnnouncementBar() {
  const { unlocked } = useTradeAccess();
  const [dismissed, setDismissed] = useState(true);

  // Read on the client only; rendering the bar and then hiding it would push
  // the whole page down and back on every load.
  useEffect(() => {
    let hidden = false;
    try {
      hidden = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      hidden = false;
    }
    setDismissed(hidden);
    // Everything that has to clear the fixed header reads `--header-h`, and
    // that height changes the moment this strip goes away.
    document.documentElement.dataset.announcement = hidden ? "hidden" : "shown";
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    document.documentElement.dataset.announcement = "hidden";
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to persist to; it stays hidden for this session.
    }
  };

  return (
    <div className="relative bg-ink text-paper/85">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-6 px-10 md:h-10 md:px-8">
        <p className="flex items-center gap-6 truncate text-[11px] font-semibold uppercase tracking-[0.16em] md:tracking-[0.2em]">
          {unlocked ? (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-light shadow-[0_0_0_3px_rgba(232,112,95,0.25)]"
              />
              Trade pricing unlocked
            </span>
          ) : (
            <Link to="/login" className="font-bold text-brand-light underline-offset-4 hover:underline">
              Sign in to unlock wholesale pricing
            </Link>
          )}
          <span aria-hidden="true" className="hidden text-brand-light/60 sm:inline">
            ✦
          </span>
          <span className="hidden sm:inline">Made in India · FDA-approved materials</span>
          <span aria-hidden="true" className="hidden text-brand-light/60 lg:inline">
            ✦
          </span>
          <span className="hidden lg:inline">Distributor &amp; dealer enquiries welcome</span>
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-paper/60 transition hover:bg-white/15 hover:text-white md:right-4"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

    </div>
  );
}
