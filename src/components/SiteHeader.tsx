import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import { categories, bioCategory } from "../data/catalogue";
import { AnnouncementBar } from "./AnnouncementBar";
import { acquireScrollLock } from "../lib/scrollLock";
import { useCartLines } from "../lib/cart";
import { avatarUrl, displayName, useAuth } from "../lib/auth";
import { loginHref } from "../lib/trade";
import { LabelIcon } from "./icons/LabelIcon";

/** Quick links beside the range tiles in the products menu. */
const menuLinks = [
  { to: "/products", label: "All products", icon: "range" },
  { to: "/quality", label: "Quality & testing", icon: "quality" },
  { to: "/contact", label: "Request a quote", icon: "contact" },
];

/** Every range, with its thumbnail, for the mega menu and the mobile drawer. */
const ranges = [
  ...categories.map((c) => ({
    to: `/products/${c.id}`,
    label: c.shortName,
    name: c.name,
    tagline: c.tagline,
    thumb: c.thumb,
    codes: c.groups.reduce((n, g) => n + g.products.length, 0),
  })),
  {
    to: `/products/${bioCategory.id}`,
    label: bioCategory.shortName,
    name: bioCategory.name,
    tagline: bioCategory.tagline,
    thumb: bioCategory.thumb,
    codes: 0,
  },
];


const mainLinks = [
  { to: "/about", label: "About" },
  { to: "/quality", label: "Quality" },
  { to: "/contact", label: "Contact" },
];

/** The header sits over the home hero, so it only gains a surface once scrolled. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/**
 * Whether the announcement strip should slide away: hidden while the reader
 * scrolls down the page, back as soon as they scroll up or reach the top.
 */
function useStripHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const y = window.scrollY;
        if (y < 80) setHidden(false);
        else if (y > last + 6) setHidden(true);
        else if (y < last - 6) setHidden(false);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let queued = false;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      el.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return ref;
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l1.6 8.4A1.5 1.5 0 0 0 8.1 13.6h6.5a1.5 1.5 0 0 0 1.5-1.2L17.5 6H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="16.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader() {
  const scrolled = useScrolled();
  const progressRef = useScrollProgress();
  const stripHidden = useStripHidden();
  const location = useLocation();
  const lines = useCartLines();
  const { session, isAdmin } = useAuth();
  const avatar = avatarUrl(session?.user);

  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  // The drawer's list keeps its own state: the desktop panel's outside-tap
  // handler only knows about the desktop panel, so on a phone every tap in the
  // list counted as "outside" and collapsed it before the link could fire.
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const productsButtonRef = useRef<HTMLButtonElement>(null);
  // The products menu opens on hover for a mouse. Leaving starts a short
  // timer rather than closing at once, so the pointer can cross the gap
  // between the button and the panel.
  const hoverTimer = useRef<number | undefined>(undefined);
  const lastPointer = useRef("");
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  useEffect(() => acquireScrollLock(menuOpen), [menuOpen]);

  // Any navigation closes both layers.
  useEffect(() => {
    setMenuOpen(false);
    setProductsOpen(false);
    setMobileProductsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen && !productsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (productsOpen) {
        setProductsOpen(false);
        productsButtonRef.current?.focus();
      } else {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, productsOpen]);

  useEffect(() => {
    if (!productsOpen) return;
    const onOutside = (e: Event) => {
      if (!productsRef.current?.contains(e.target as Node)) setProductsOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [productsOpen]);

  // Active is a red dot beside the label, like a selected swatch.
  const activeDot = "text-ink before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand before:content-['']";
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
      isActive ? activeDot : "text-ink/65 hover:bg-paper-dim hover:text-ink"
    }`;

  const productsActive = location.pathname.startsWith("/products");

  return (
    <header
      className="print-hide fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out"
      style={stripHidden && !menuOpen ? { transform: "translateY(calc(var(--bar-h) * -1))" } : undefined}
    >
      <AnnouncementBar />

      {/* A floating white bar: the red moves to the wordmark, the active dot
          and the main button, instead of filling a slab across the top. The
          heights still add up to --nav-h (4rem, 4.5rem from md). */}
      <div className="px-3 pt-2 md:px-6 md:pt-3">
        <div
          className={`relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 rounded-2xl border border-ink/[0.07] bg-white/90 pl-4 pr-2 backdrop-blur-md transition-shadow duration-300 md:h-[60px] md:pl-6 md:pr-2.5 ${
            scrolled
              ? "shadow-[0_14px_34px_-14px_rgba(15,27,51,0.4)]"
              : "shadow-[0_6px_20px_-14px_rgba(15,27,51,0.3)]"
          }`}
        >
          <Link to="/" className="flex shrink-0 items-baseline gap-1.5 py-2 transition-opacity hover:opacity-80">
            <span className="font-script text-2xl leading-none text-brand md:text-[28px]">
              RUSKAV
            </span>
            <span className="text-[9px] font-semibold leading-none text-brand/60 md:text-[10px]">
              ®
            </span>
            <span className="sr-only">Ruskav Food Service Products, home</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>

            {/* Not positioned: the menu centres under the whole bar, not under
                this button, so a wide panel cannot run off a laptop's edge. */}
            <div
              ref={productsRef}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                window.clearTimeout(hoverTimer.current);
                setProductsOpen(true);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== "mouse") return;
                window.clearTimeout(hoverTimer.current);
                hoverTimer.current = window.setTimeout(() => setProductsOpen(false), 200);
              }}
            >
              <button
                ref={productsButtonRef}
                type="button"
                aria-expanded={productsOpen}
                aria-controls="products-menu"
                onPointerDown={(e) => {
                  lastPointer.current = e.pointerType;
                }}
                onClick={() => {
                  // A mouse has already opened it by hovering, so its click
                  // must not shut it again. Touch and keyboard still toggle.
                  if (lastPointer.current === "mouse") setProductsOpen(true);
                  else setProductsOpen((v) => !v);
                  lastPointer.current = "";
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  productsActive || productsOpen ? activeDot : "text-ink/65 hover:bg-paper-dim hover:text-ink"
                }`}
              >
                Products
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className={`mt-px transition-transform ${productsOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                id="products-menu"
                hidden={!productsOpen}
                className="absolute left-1/2 top-full w-[min(calc(100vw-2rem),960px)] -translate-x-1/2 pt-3"
              >
                <div className="grid grid-cols-[1fr_14rem] gap-3 rounded-3xl border border-ink/[0.07] bg-white p-3 shadow-[0_30px_60px_-24px_rgba(15,27,51,0.45)]">
                  {/* The range as on the home page: the lead range tall, the
                      other four beside it, every tile a photograph. */}
                  <div className="grid grid-cols-3 grid-rows-2 gap-2.5">
                    {ranges.map((r, i) => (
                      <Link
                        key={r.to}
                        to={r.to}
                        className={`group/tile media-panel relative isolate overflow-hidden rounded-2xl ${
                          i === 0 ? "row-span-2" : "aspect-[4/3]"
                        }`}
                      >
                        <img
                          src={r.thumb}
                          alt=""
                          width={400}
                          height={400}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover/tile:scale-105"
                        />
                        <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 backdrop-blur">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">{r.label}</span>
                            <span className="block truncate text-[11px] text-ink-soft">
                              {r.codes > 0 ? `${r.codes} codes` : "Made to order"}
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-white transition group-hover/tile:bg-brand"
                          >
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                              <path d="M4 12 12 4M12 4H6M12 4v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1 rounded-2xl bg-paper-dim p-2">
                    {menuLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand shadow-sm">
                          <LabelIcon label={l.icon} />
                        </span>
                        {l.label}
                      </Link>
                    ))}
                    <Link
                      to="/shop"
                      className="mt-auto rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
                    >
                      Shop with prices
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <NavLink to="/shop" className={navClass}>
              Shop
            </NavLink>
            {mainLinks.slice(1).map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-paper-dim text-ink transition hover:bg-ink/10"
            >
              <CartIcon />
              <span className="sr-only">
                Cart{cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ", empty"}
              </span>
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {session && !isAdmin ? (
              <Link
                to="/account"
                title={displayName(session.user)}
                className="hidden h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink/10 bg-paper-dim transition hover:border-brand sm:grid"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    width={40}
                    height={40}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-ink">
                    {displayName(session.user).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="sr-only">Your account</span>
              </Link>
            ) : (
              // On a wholesale site the sign-in link is not housekeeping — it is
              // the thing standing between a buyer and the price list, so it
              // says what it unlocks.
              <Link
                to={isAdmin ? "/admin" : loginHref(location.pathname)}
                className="hidden items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40 sm:inline-flex"
              >
                {!isAdmin && (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4.75 6V4.4a2.25 2.25 0 0 1 4.5 0V6" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                )}
                {isAdmin ? "Dashboard" : "Trade login"}
              </Link>
            )}

            <Link
              to="/contact"
              className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark md:inline-block"
            >
              Enquire now
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid h-10 w-10 place-items-center rounded-full bg-paper-dim text-ink lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                {menuOpen ? (
                  <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                ) : (
                  <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 bottom-0 h-[2px] overflow-hidden rounded-full"
          >
            <div ref={progressRef} className="h-full origin-left scale-x-0 bg-brand" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="mx-3 mt-2 overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-[0_24px_48px_-20px_rgba(15,27,51,0.45)] lg:hidden"
          >
            <nav
              aria-label="Mobile"
              className="max-h-[calc(100svh-var(--header-h)-1.5rem)] space-y-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-3"
            >
              <Link
                to="/shop"
                className="mb-1 block rounded-xl bg-brand px-3 py-3 text-base font-bold text-white"
              >
                Shop with prices
              </Link>
              <Link to="/about" className="block rounded-lg px-2 py-3 text-base font-medium text-ink/80 hover:bg-paper-dim">
                About
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2 py-3 text-base font-medium text-ink/80 hover:bg-paper-dim"
                aria-expanded={mobileProductsOpen}
                aria-controls="mobile-products"
                onClick={() => setMobileProductsOpen((v) => !v)}
              >
                Products
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className={`transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {mobileProductsOpen && (
                  <motion.div
                    id="mobile-products"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-3"
                  >
                    <Link
                      to="/products"
                      className="block rounded-lg px-2 py-2.5 text-sm font-semibold text-ink"
                    >
                      All products
                    </Link>
                    {ranges.map((r) => (
                      <Link
                        key={r.to}
                        to={r.to}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-ink/75 hover:bg-paper-dim"
                      >
                        <span className="media-panel h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={r.thumb}
                            alt=""
                            width={72}
                            height={72}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </span>
                        {r.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <Link to="/quality" className="block rounded-lg px-2 py-3 text-base font-medium text-ink/80 hover:bg-paper-dim">
                Quality
              </Link>
              <Link to="/contact" className="block rounded-lg px-2 py-3 text-base font-medium text-ink/80 hover:bg-paper-dim">
                Contact
              </Link>
              <Link
                to={isAdmin ? "/admin" : session ? "/account" : loginHref(location.pathname)}
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-center text-sm font-semibold text-ink"
              >
                {!isAdmin && !session && (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4.75 6V4.4a2.25 2.25 0 0 1 4.5 0V6" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                )}
                {isAdmin ? "Admin dashboard" : session ? "Your account" : "Trade login to unlock prices"}
              </Link>
              <Link
                to="/contact"
                className="mt-2 block rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Enquire now
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
