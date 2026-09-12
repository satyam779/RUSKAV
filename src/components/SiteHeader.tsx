import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import { categories, bioCategory } from "../data/catalogue";
import { acquireScrollLock } from "../lib/scrollLock";
import { useCartLines } from "../lib/cart";
import { avatarUrl, displayName, useAuth } from "../lib/auth";

const productLinks = [
  { to: "/products", label: "All products", lead: true },
  ...categories.map((c) => ({ to: `/products/${c.id}`, label: c.shortName, lead: false })),
  { to: `/products/${bioCategory.id}`, label: bioCategory.shortName, lead: false },
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

export function SiteHeader({ overHero }: { overHero: boolean }) {
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
  // Only the home hero sits under the header; every other page starts with a
  // solid masthead, so the header needs its own surface from the first pixel.
  const solid = scrolled || !overHero;

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

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition ${isActive ? "text-brand" : "text-ink-soft hover:text-ink"}`;

  const productsActive = location.pathname.startsWith("/products");

  return (
    <header
      className={`print-hide fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "bg-paper/90 shadow-[0_1px_0_rgba(23,20,15,0.08)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-20 md:px-8">
        <Link to="/" className="flex shrink-0 items-baseline gap-1.5">
          <span className="font-script text-2xl leading-none text-brand md:text-[28px]">RUSKAV</span>
          <span className="text-[9px] font-semibold leading-none text-ink-soft md:text-[10px]">®</span>
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
              className={`flex items-center gap-1 text-sm font-medium transition ${
                productsActive ? "text-brand" : "text-ink-soft hover:text-ink"
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
              className="absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3"
            >
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-xl shadow-ink/10">
                {productLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`block px-4 py-3 text-sm transition hover:bg-paper-dim ${
                      l.lead
                        ? "border-b border-ink/8 font-semibold text-ink"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
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
            className="relative grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/60 text-ink transition hover:border-ink/30"
          >
            <CartIcon />
            <span className="sr-only">
              Cart{cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ", empty"}
            </span>
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white"
              >
                {cartCount}
              </span>
            )}
          </Link>

          {session && !isAdmin ? (
            <Link
              to="/login"
              title={displayName(session.user)}
              className="hidden h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-ink/15 bg-paper/60 transition hover:border-ink/40 sm:grid"
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
            <Link
              to={isAdmin ? "/admin" : "/login"}
              className="hidden rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40 sm:inline-block"
            >
              {isAdmin ? "Dashboard" : "Sign in"}
            </Link>
          )}

          <Link
            to="/contact"
            className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark md:inline-block"
          >
            Enquire Now
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/60 text-ink lg:hidden"
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

      <div aria-hidden="true" className="h-px w-full overflow-hidden bg-ink/8">
        <div ref={progressRef} className="h-full origin-left scale-x-0 bg-brand" />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden border-t border-ink/8 bg-paper lg:hidden"
          >
            <nav aria-label="Mobile" className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto px-5 pb-6 pt-3">
              <Link to="/shop" className="rounded-lg px-2 py-3 text-base font-semibold text-brand">
                Shop with prices
              </Link>
              <Link to="/about" className="rounded-lg px-2 py-3 text-base font-medium text-ink">
                About
              </Link>
              <button
                type="button"
                className="flex items-center justify-between rounded-lg px-2 py-3 text-base font-medium text-ink"
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
                    className="flex flex-col overflow-hidden pl-4"
                  >
                    {productLinks.map((l) => (
                      <Link key={l.to} to={l.to} className="rounded-lg px-2 py-2.5 text-sm text-ink-soft">
                        {l.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <Link to="/quality" className="rounded-lg px-2 py-3 text-base font-medium text-ink">
                Quality
              </Link>
              <Link to="/contact" className="rounded-lg px-2 py-3 text-base font-medium text-ink">
                Contact
              </Link>
              <Link
                to={isAdmin ? "/admin" : "/login"}
                className="rounded-lg px-2 py-3 text-base font-medium text-ink"
              >
                {isAdmin ? "Admin dashboard" : session ? "Your account" : "Sign in"}
              </Link>
              <Link
                to="/contact"
                className="mt-2 rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white"
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
