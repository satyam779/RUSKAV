import { LabelIcon } from "./icons/LabelIcon";
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
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-6 px-9 md:h-10 md:px-8">
        <p className="flex items-center gap-6 self-stretch truncate text-[12.5px] font-medium">
          {unlocked ? (
            <span className="flex items-center gap-2">
              <LabelIcon label="Trade pricing unlocked" className="text-brand-light" />
              Trade pricing unlocked
            </span>
          ) : (
            <Link to="/login" className="flex items-center self-stretch font-bold text-brand-light underline-offset-4 hover:underline">
              <LabelIcon label="Trade prices" className="mr-1.5" />
              <span className="sm:hidden">Sign in for trade prices</span>
              <span className="hidden sm:inline">Sign in to unlock wholesale pricing</span>
            </Link>
          )}
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <LabelIcon label="Made in India" className="text-brand-light" />
            Made in India · FDA-approved materials
          </span>
          <span className="hidden items-center gap-1.5 lg:inline-flex">
            <LabelIcon label="Distributor enquiries" className="text-brand-light" />
            Distributor &amp; dealer enquiries welcome
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-paper/60 transition hover:bg-white/15 hover:text-white md:right-3 md:h-10 md:w-10"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

    </div>
  );
}
