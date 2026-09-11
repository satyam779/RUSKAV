import { motion } from "framer-motion";
import type { Category } from "../data/catalogue";
import { ProductGroupCard } from "./ProductGroupCard";

export function CategoryShowcase({ category, reverse = false }: { category: Category; reverse?: boolean }) {
  const secondary = category.secondaryImages[0];

  return (
    <section id={category.id} className="scroll-mt-20 border-t border-ink/8 bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className={`grid items-center gap-14 md:gap-16 ${reverse ? "md:grid-cols-[1fr_1fr]" : "md:grid-cols-[1fr_1fr]"}`}>
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`relative ${reverse ? "md:order-2" : ""}`}
          >
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-studio">
              <img src={category.heroImage} alt={category.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
            {secondary && (
              <div
                className={`absolute -bottom-8 hidden w-[46%] overflow-hidden rounded-2xl border-4 border-paper bg-studio shadow-xl shadow-ink/15 sm:block ${
                  reverse ? "-left-8" : "-right-8"
                }`}
              >
                <img src={secondary} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className={reverse ? "md:order-1" : ""}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">{category.kicker}</p>
            <h2 className="font-display mt-4 text-balance text-3xl font-medium leading-[1.1] text-ink md:text-4xl">
              {category.name}
            </h2>
            <p className="font-display mt-1 text-balance text-lg italic text-brand-dark/80">{category.tagline}</p>

            <div className="mt-6 flex flex-col gap-4">
              {category.paragraphs.map((p, i) => (
                <p key={i} className="text-balance leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </div>

            <ul className="mt-6 flex flex-col gap-2.5">
              {category.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <svg width="16" height="16" viewBox="0 0 16 16" className="mt-0.5 shrink-0 text-brand">
                    <path
                      d="M3.5 8.5 6.5 11.5 12.5 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mt-24 md:mt-28">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft/60">
            Specifications &amp; product codes
          </p>
          <div className="grid items-start gap-4 md:grid-cols-2">
            {category.groups.map((g, i) => (
              <ProductGroupCard key={g.id} group={g} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
