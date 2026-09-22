import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import { categories, bioCategory } from "../data/catalogue";
import { AnnouncementBar } from "./AnnouncementBar";
import { acquireScrollLock } from "../lib/scrollLock";
import { useCartLines } from "../lib/cart";
import { avatarUrl, displayName, useAuth } from "../lib/auth";
import { loginHref } from "../lib/trade";

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
  const location = useLocation();
  const lines = useCartLines();
  const { session, isAdmin } = useAuth();
  const avatar = avatarUrl(session?.user);

  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const productsButtonRef = useRef<HTMLButtonElement>(null);

  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  useEffect(() => acquireScrollLock(menuOpen), [menuOpen]);

  // Any navigation closes both layers.
  useEffect(() => {
    setMenuOpen(false);
    setProductsOpen(false);
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

  // On red, "active" cannot be a colour change — there is no second colour
  // with enough contrast left. It is an underline instead.
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 pb-0.5 text-sm font-semibold transition ${
      isActive
        ? "border-white text-white"
        : "border-transparent text-white/75 hover:border-white/40 hover:text-white"
    }`;

  const productsActive = location.pathname.startsWith("/products");

  return (
    <header className="print-hide fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />

      {/* The masthead carries the wordmark's red rather than sitting on cream
          behind it. It is solid on every route, home hero included: a bar that
          fades in on scroll costs the brand the first screen, which is the one
          screen everybody sees. */}
      <div
        className={`bg-brand transition-shadow duration-300 ${
          scrolled ? "shadow-[0_6px_24px_-12px_rgba(23,20,15,0.55)]" : ""
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-[72px] md:px-8">
          <Link to="/" className="flex shrink-0 items-baseline gap-1.5 transition-opacity hover:opacity-80">
            <span className="font-script text-2xl leading-none text-white md:text-[28px]">
              RUSKAV
            </span>
            <span className="text-[9px] font-semibold leading-none text-white/70 md:text-[10px]">
              ®
            </span>
            <span className="sr-only">Ruskav Food Service Products — home</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>

            <div ref={productsRef} className="relative">
              <button
                ref={productsButtonRef}
                type="button"
                aria-expanded={productsOpen}
                aria-controls="products-menu"
                onClick={() => setProductsOpen((v) => !v)}
                className={`flex items-center gap-1 border-b-2 pb-0.5 text-sm font-semibold transition ${
                  productsActive || productsOpen
                    ? "border-white text-white"
                    : "border-transparent text-white/75 hover:border-white/40 hover:text-white"
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
                className="absolute left-1/2 top-full w-[min(92vw,880px)] -translate-x-1/2 pt-4"
              >
                <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-2xl shadow-ink/25">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {ranges.map((r) => (
                      <Link
                        key={r.to}
                        to={r.to}
                        className="group/tile flex items-center gap-3 rounded-2xl p-2 transition hover:bg-paper-dim"
                      >
                        <span className="media-panel h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={r.thumb}
                            alt=""
                            width={112}
                            height={112}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/tile:scale-110"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink group-hover/tile:text-brand">
                            {r.label}
                          </span>
                          <span className="block truncate text-[11px] text-ink-soft">
                            {r.codes > 0 ? `${r.codes} codes` : "Made to order"}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-ink/8 bg-paper-dim/60 px-5 py-3.5">
                    <Link
                      to="/products"
                      className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition hover:text-brand"
                    >
                      All products →
                    </Link>
                    <Link
                      to="/shop"
                      className="rounded-full bg-brand px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-brand-dark"
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
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
            >
              <CartIcon />
              <span className="sr-only">
                Cart{cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ", empty"}
              </span>
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white ring-2 ring-brand"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {session && !isAdmin ? (
              <Link
                to="/account"
                title={displayName(session.user)}
                className="hidden h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/50 bg-white/10 transition hover:border-white sm:grid"
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
                  <span className="text-sm font-semibold text-white">
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
                className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm transition hover:bg-paper-dim sm:inline-flex"
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
              className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-brand-dark md:inline-block"
            >
              Enquire Now
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white lg:hidden"
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
        </div>

        <div aria-hidden="true" className="h-[3px] w-full overflow-hidden bg-black/15">
          <div ref={progressRef} className="h-full origin-left scale-x-0 bg-white/85" />
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
            className="overflow-hidden border-t border-white/15 bg-brand-dark lg:hidden"
          >
            <nav
              aria-label="Mobile"
              className="max-h-[calc(100svh-var(--header-h)-1rem)] space-y-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-3"
            >
              <Link
                to="/shop"
                className="mb-1 block rounded-xl bg-white/10 px-3 py-3 text-base font-bold text-white"
              >
                Shop with prices
              </Link>
              <Link to="/about" className="block rounded-lg px-2 py-3 text-base font-medium text-white/85">
                About
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2 py-3 text-base font-medium text-white/85"
                aria-expanded={productsOpen}
                aria-controls="mobile-products"
                onClick={() => setProductsOpen((v) => !v)}
              >
                Products
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className={`transition-transform ${productsOpen ? "rotate-180" : ""}`}
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
                {productsOpen && (
                  <motion.div
                    id="mobile-products"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-3"
                  >
                    <Link
                      to="/products"
                      className="block rounded-lg px-2 py-2.5 text-sm font-semibold text-white"
                    >
                      All products
                    </Link>
                    {ranges.map((r) => (
                      <Link
                        key={r.to}
                        to={r.to}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/75"
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
              <Link to="/quality" className="block rounded-lg px-2 py-3 text-base font-medium text-white/85">
                Quality
              </Link>
              <Link to="/contact" className="block rounded-lg px-2 py-3 text-base font-medium text-white/85">
                Contact
              </Link>
              <Link
                to={isAdmin ? "/admin" : session ? "/account" : loginHref(location.pathname)}
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-brand-dark"
              >
                {!isAdmin && !session && (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4.75 6V4.4a2.25 2.25 0 0 1 4.5 0V6" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                )}
                {isAdmin ? "Admin dashboard" : session ? "Your account" : "Trade login — unlock prices"}
              </Link>
              <Link
                to="/contact"
                className="mt-2 block rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-paper"
              >
                Enquire Now
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
