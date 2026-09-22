import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cookie consent.
 *
 * This site sets exactly two things in the browser: the cart (a list of
 * product codes, in localStorage) and the sign-in session Supabase keeps for
 * an account holder. Both are strictly necessary — there is no analytics tag,
 * no advertising pixel and nothing shared with a third party — so the banner
 * asks once, explains plainly what is stored, and never comes back.
 *
 * The choice is recorded rather than assumed: a visitor who declines keeps a
 * working cart for the session but nothing is written to disk beyond this
 * flag.
 */
const STORAGE_KEY = "ruskav:cookie-consent";

type Consent = "accepted" | "declined" | null;

function read(): Consent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "accepted" || raw === "declined" ? raw : null;
  } catch {
    // Private browsing with storage blocked: there is nothing to consent to,
    // so treat it as answered rather than nagging on every page.
    return "declined";
  }
}

let consent: Consent = read();
const listeners = new Set<() => void>();

function set(next: Exclude<Consent, null>) {
  consent = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Nothing to persist to; the answer still holds for this session.
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const snapshot = () => consent;

/**
 * True while the banner is on screen, so the floating cart bar can stand down
 * rather than stack two panels in the same corner of a phone.
 */
export function useConsentPending() {
  return useSyncExternalStore(subscribe, snapshot, () => null) === null;
}

export function CookieBanner() {
  const pending = useConsentPending();

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          role="dialog"
          aria-label="Cookie notice"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="print-hide fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md md:inset-x-auto md:left-6 md:bottom-6 md:mx-0"
        >
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper/97 shadow-2xl shadow-ink/25 backdrop-blur-md">
            <div className="h-1 w-full bg-brand" />
            <div className="p-5">
              <p className="font-display text-base font-medium text-ink">
                We keep this simple.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                We store only what the site needs to work — your order list and, if you
                sign in, your session. No tracking, no advertising, nothing sold on.{" "}
                <Link to="/contact" className="font-semibold text-brand hover:underline">
                  Questions?
                </Link>
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set("accepted")}
                  className="flex-1 rounded-full bg-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => set("declined")}
                  className="rounded-full border border-ink/15 px-4 py-2.5 text-[13px] font-semibold text-ink-soft transition hover:border-ink/40 hover:text-ink"
                >
                  Essential only
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
