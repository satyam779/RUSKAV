import { useEffect, useState } from "react";

/** Subscribes to a media query, SSR/first-paint safe. */
function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? initial : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)", true);

/** Chromium-only; absent elsewhere, which we read as "no objection". */
function connection() {
  if (typeof navigator === "undefined") return undefined;
  return (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
}

/**
 * Whether this visit should scrub the frame sequence at all.
 *
 * Phones get it too — the moving background is most of the character of the
 * site and cutting it there left the small screen looking like a different,
 * flatter product. What phones do not get is the full 300 frames; see
 * `frameStride`.
 *
 * Still refused where the visitor has asked for stillness or the connection
 * cannot carry it: reduced motion, Save-Data, or 2G.
 */
export function shouldLoadFrameSequence() {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const net = connection();
  if (net?.saveData) return false;
  if (net?.effectiveType && /(^|-)2g$/.test(net.effectiveType)) return false;

  return true;
}

/**
 * Take every Nth frame.
 *
 * The full sequence is ~7 MB of JPEG, which is a fair trade on a wide screen
 * and a real connection and an unfair one on a phone. Every third frame is a
 * third of the bytes, and at a phone's scroll speed the difference between 300
 * steps and 100 is not something you can see — the frames are a slow orbit
 * around a stack of trays, not a fast cut.
 */
export function frameStride() {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(max-width: 767px)").matches) return 3;

  const net = connection();
  if (net?.effectiveType === "3g") return 2;

  return 1;
}
