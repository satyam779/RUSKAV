import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { Footer } from "../components/Footer";
import { CartBar } from "../components/CartBar";
import { CookieBanner } from "../components/CookieBanner";

/**
 * Route titles. A single-page site got away with one <title>; separate pages
 * need their own, or every browser tab and every bookmark reads the same.
 */
const TITLES: Record<string, string> = {
  "/": "RUSKAV Food Service Products | Trays, Dinnerware & Drinkware, Made in India",
  "/about": "About Ruskav | Food service manufacturing in India",
  "/products": "Product range | Ruskav Food Service Products",
  "/shop": "Wholesale shop | Trade prices, case packs and discounts | Ruskav",
  "/cart": "Your order | Ruskav",
  "/account": "Your account | Quotes and orders | Ruskav",
  "/quality": "Quality & certification | Ruskav",
  "/contact": "Contact & distributor enquiries | Ruskav",
  "/login": "Trade login | Unlock wholesale pricing | Ruskav",
  "/admin": "Admin dashboard | Ruskav",
};

function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Only exact matches are claimed here. Dynamic routes — a category, a
    // product, the 404 — know their own subject and set their own title; this
    // effect runs after theirs, so claiming a prefix match would overwrite it.
    const exact = TITLES[pathname];
    if (exact) document.title = exact;
  }, [pathname]);
}

export function Layout() {
  useDocumentTitle();

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <Outlet />
      </main>

      <Footer />
      <CartBar />
      <CookieBanner />
      <ScrollRestoration />
    </MotionConfig>
  );
}
