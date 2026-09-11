import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories, bioCategory } from "../data/catalogue";

const navCategories = [...categories.map((c) => ({ id: c.id, shortName: c.shortName })), { id: bioCategory.id, shortName: bioCategory.shortName }];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const close = () => {
    setMenuOpen(false);
    setProductsOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-paper/85 shadow-[0_1px_0_rgba(23,20,15,0.08)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#top" className="flex items-baseline gap-1.5" onClick={close}>
          <span className="font-script text-2xl leading-none text-brand md:text-[28px]">RUSKAV</span>
          <span className="text-[9px] font-semibold leading-none text-ink-soft md:text-[10px]">®</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#about" className="text-sm font-medium text-ink-soft transition hover:text-ink">
            About
          </a>
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink">
              Products
              <svg width="10" height="10" viewBox="0 0 12 12" className="mt-px">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="invisible absolute left-1/2 top-full w-56 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="overflow-hidden rounded-2xl border border-ink/8 bg-paper shadow-xl shadow-ink/10">
                {navCategories.map((c) => (
                  <a
                    key={c.id}
                    href={`#${c.id}`}
                    className="block px-4 py-3 text-sm text-ink-soft transition hover:bg-paper-dim hover:text-ink"
                  >
                    {c.shortName}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <a href="#quality" className="text-sm font-medium text-ink-soft transition hover:text-ink">
            Quality
          </a>
          <a href="#contact" className="text-sm font-medium text-ink-soft transition hover:text-ink">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark md:inline-block"
          >
            Enquire Now
          </a>
          <button
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              {menuOpen ? (
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-paper md:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 pb-6 pt-2">
              <a href="#about" onClick={close} className="rounded-lg px-2 py-3 text-base font-medium text-ink">
                About
              </a>
              <button
                className="flex items-center justify-between rounded-lg px-2 py-3 text-base font-medium text-ink"
                onClick={() => setProductsOpen((v) => !v)}
              >
                Products
                <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${productsOpen ? "rotate-180" : ""}`}>
                  <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col overflow-hidden pl-4"
                  >
                    {navCategories.map((c) => (
                      <a key={c.id} href={`#${c.id}`} onClick={close} className="rounded-lg px-2 py-2.5 text-sm text-ink-soft">
                        {c.shortName}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <a href="#quality" onClick={close} className="rounded-lg px-2 py-3 text-base font-medium text-ink">
                Quality
              </a>
              <a href="#contact" onClick={close} className="rounded-lg px-2 py-3 text-base font-medium text-ink">
                Contact
              </a>
              <a
                href="#contact"
                onClick={close}
                className="mt-2 rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Enquire Now
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
