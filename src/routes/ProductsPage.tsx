import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categories, bioCategory } from "../data/catalogue";
import { ProductFinder } from "../components/ProductFinder";
import { PageHeader, Section, SectionHeading, buttonClass } from "../components/ui";
import { allProducts } from "../lib/catalogueIndex";

const cards = [
  ...categories.map((c) => ({
    id: c.id,
    name: c.name,
    tagline: c.tagline,
    kicker: c.kicker,
    thumb: c.thumb,
    theme: c.theme,
    count: c.groups.reduce((n, g) => n + g.products.length, 0),
    lines: c.groups.length,
  })),
  {
    id: bioCategory.id,
    name: bioCategory.name,
    tagline: bioCategory.tagline,
    kicker: bioCategory.kicker,
    thumb: bioCategory.thumb,
    theme: bioCategory.theme,
    count: 0,
    lines: 0,
  },
];

export function ProductsPage() {
  return (
    <>
      <PageHeader
        backdrop
        kicker="The range"
        title="Five product families, one standard of quality."
        intro={`${allProducts.length} product codes across trays, compartment plates, dinnerware, drinkware and the bio-composite line — every piece designed to outlast a full day of service.`}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/shop" className={buttonClass("primary")}>
            Shop with prices
          </Link>
          <a href="#finder" className={buttonClass("outline")}>
            Search all codes
          </a>
        </div>
      </PageHeader>

      <Section className="bg-paper-dim pt-10 md:pt-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
            >
              <Link
                to={`/products/${c.id}`}
                className="group card-lift flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white hover:border-brand/35 hover:shadow-[0_20px_44px_-28px_rgba(23,20,15,0.5)]"
              >
                <div
                  className={`relative aspect-[4/3] overflow-hidden ${
                    c.theme === "bio" ? "media-panel-bio" : "media-panel"
                  }`}
                >
                  <img
                    src={c.thumb}
                    alt={c.name}
                    width={1000}
                    height={750}
                    loading={i < 3 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 font-display text-[11px] font-bold tracking-wider text-brand backdrop-blur-sm"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow-rule text-[10px] font-bold uppercase tracking-[0.26em] text-brand">
                    {c.kicker}
                  </p>
                  <h2 className="font-display mt-3 text-xl font-medium leading-tight text-ink transition group-hover:text-brand">
                    {c.name}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.tagline}</p>
                  <p className="mt-auto flex items-center justify-between gap-3 pt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft/70">
                    {c.count > 0 ? `${c.lines} lines · ${c.count} codes` : "Made to order"}
                    <span className="text-brand transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      <div id="finder">
        <ProductFinder />
      </div>

      <Section className="bg-paper-dim">
        <SectionHeading
          kicker="Not listed?"
          title="Most of the range can be made to your format."
          intro="Sizes, colourways and compartment layouts outside the catalogue are routine for us — tell us the format and the volume."
        />
        <Link to="/contact" className={buttonClass("primary", "px-6 py-3")}>
          Ask about a custom size
        </Link>
      </Section>
    </>
  );
}
