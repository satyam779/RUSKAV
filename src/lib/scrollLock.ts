/**
 * Reference-counted scroll lock.
 *
 * Both the loader and the mobile menu want to freeze the page, and they can
 * overlap. Writing `document.body.style.overflow` directly from each one means
 * whichever releases first unlocks the page for the other too — so this keeps a
 * count and only restores the original value when the last holder releases.
 */
let holders = 0;
let previousOverflow = "";
let previousPaddingRight = "";

export function lockScroll() {
  holders += 1;
  if (holders > 1) return;

  const { body } = document;
  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;

  // Hiding the scrollbar reflows the page a few pixels wider; pad it back so
  // fixed-position chrome (header, progress bar) doesn't jump.
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  if (gutter > 0) body.style.paddingRight = `${gutter}px`;
  body.style.overflow = "hidden";
}

export function unlockScroll() {
  holders = Math.max(0, holders - 1);
  if (holders > 0) return;

  document.body.style.overflow = previousOverflow;
  document.body.style.paddingRight = previousPaddingRight;
}

/** `useEffect`-friendly: returns the matching release function. */
export function acquireScrollLock(active: boolean) {
  if (!active) return () => {};
  lockScroll();
  return unlockScroll;
}
