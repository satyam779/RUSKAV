import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categories, bioCategory } from "../data/catalogue";
import { Eyebrow } from "./ui";

const cards = [
  ...categories.map((c) => ({
    id: c.id,
    name: c.name,
    tagline: c.tagline,
    thumb: c.thumb,
    theme: c.theme,
    codes: c.groups.reduce((n, g) => n + g.products.length, 0),
  })),
  {
    id: bioCategory.id,
    name: bioCategory.name,
    tagline: bioCategory.tagline,
    thumb: bioCategory.thumb,
    theme: bioCategory.theme,
    codes: 0,
  },
];

/**
 * The range, as six tiles.
 *
 * These used to be anchor links to `#trays` and friends — sections that live
 * on the category pages, not on the home page, so every tile scrolled a
 * visitor precisely nowhere. They are proper routes now.
 *
 * The first tile runs wide and the rest follow in a three-up grid: a flat grid
 * of six identical squares gives a reader nowhere to start, and the lead range
 * is the one most people are here for.
 */
export function CategoryGrid() {
  return (
    <section className="bg-paper-dim py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <Eyebrow>The range</Eyebrow>
            <h2 className="font-display mt-4 max-w-lg text-balance text-3xl font-medium leading-[1.06] text-ink md:text-[2.75rem]">
              Five product families, one standard of quality.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-4 md:max-w-sm md:items-end">
            <p className="text-balance text-sm leading-relaxed text-ink-soft md:text-right">
              From the servery line to the sustainable range — every piece designed to
              outlast a full day of service.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand transition hover:gap-3"
            >
              All products
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {cards.map((c, i) => {
            const lead = i === 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease: "easeOut", delay: (i % 3) * 0.08 }}
                className={lead ? "sm:col-span-2 lg:row-span-2" : undefined}
              >
                <Link
                  to={`/products/${c.id}`}
                  className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl ${
                    c.theme === "bio" ? "media-panel-bio" : "media-panel"
                  } ${lead ? "aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[32rem]" : "aspect-[5/4] sm:aspect-square"}`}
                >
                  <img
                    src={c.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={1000}
                    height={1000}
                    sizes={lead ? "(max-width: 1024px) 92vw, 42vw" : "(max-width: 640px) 92vw, 30vw"}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.07]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />

                  {/* The index number is the only decoration on the tile, and
                      it is the brand red — a catalogue's own numbering, not a
                      badge borrowed from somewhere else. */}
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-4 font-display text-sm font-semibold tracking-wider text-brand-light"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex items-end justify-between gap-3 p-5 md:p-6">
                    <div>
                      <span
                        aria-hidden="true"
                        className="mb-3 block h-0.5 w-8 origin-left bg-brand transition-transform duration-500 group-hover:scale-x-[2]"
                      />
                      <h3
                        className={`font-display font-medium leading-tight text-white ${
                          lead ? "text-2xl md:text-[1.9rem]" : "text-lg md:text-xl"
                        }`}
                      >
                        {c.name}
                      </h3>
                      <p className="mt-1.5 max-w-[30ch] text-xs leading-relaxed text-white/70 md:text-sm">
                        {c.tagline}
                      </p>
                      <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                        {c.codes > 0 ? `${c.codes} product codes` : "Made to order"}
                      </p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition duration-300 group-hover:bg-brand">
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M4 12 12 4M12 4H6M12 4v6"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
