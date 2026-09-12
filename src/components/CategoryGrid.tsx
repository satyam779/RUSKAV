import { motion } from "framer-motion";
import { categories, bioCategory } from "../data/catalogue";

const cards = [
  ...categories.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline, thumb: c.thumb, theme: c.theme })),
  { id: bioCategory.id, name: bioCategory.name, tagline: bioCategory.tagline, thumb: bioCategory.thumb, theme: bioCategory.theme },
];

export function CategoryGrid() {
  return (
    <section className="bg-paper-dim py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">The range</p>
            <h2 className="font-display mt-4 max-w-lg text-balance text-4xl font-medium leading-[1.08] text-ink md:text-5xl">
              Five product families, one standard of quality.
            </h2>
          </div>
          <p className="max-w-sm text-balance text-ink-soft">
            From the servery line to the sustainable range — every piece designed to
            outlast a full day of service.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.a
              key={c.id}
              href={`#${c.id}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: (i % 3) * 0.08 }}
              className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl ${
                c.theme === "bio" ? "bg-bio-paper" : "bg-studio"
              } ${i === 0 ? "sm:col-span-2 sm:aspect-[16/9] lg:col-span-1 lg:aspect-[4/5]" : ""}`}
            >
              <img
                src={c.thumb}
                alt={c.name}
                loading="lazy"
                decoding="async"
                width={1000}
                height={1250}
                className="absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
              <div className="relative flex items-end justify-between gap-3 p-6">
                <div>
                  <h3 className="font-display text-xl font-medium text-white md:text-2xl">{c.name}</h3>
                  <p className="mt-1 max-w-[22ch] text-sm text-white/75">{c.tagline}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-brand">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
