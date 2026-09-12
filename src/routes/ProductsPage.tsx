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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.07 }}
            >
              <Link
                to={`/products/${c.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white/70 transition hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
              >
                <div
                  className={`aspect-[4/3] overflow-hidden ${
                    c.theme === "bio" ? "bg-bio-paper" : "bg-studio"
                  }`}
                >
                  <img
                    src={c.thumb}
                    alt={c.name}
                    width={1000}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">
                    {c.kicker}
                  </p>
                  <h2 className="font-display mt-3 text-xl font-medium text-ink">{c.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.tagline}</p>
                  <p className="mt-auto pt-5 text-xs font-medium text-ink-soft/80">
                    {c.count > 0
                      ? `${c.lines} product lines · ${c.count} codes`
                      : "Full range · made to order"}
                    <span className="ml-2 inline-block text-brand transition group-hover:translate-x-0.5">
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
