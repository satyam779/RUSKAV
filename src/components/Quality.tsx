import { motion } from "framer-motion";
import { MadeInIndiaBadge } from "./icons/Badges";

const pillars = [
  {
    title: "FDA & IS 10910 compliant",
    body: "Every raw material is either FDA-approved or certified to IS 10910, for safe contact with food, pharmaceuticals and drinking water.",
  },
  {
    title: "Dishwasher & microwave safe",
    body: "Engineered to survive repeated wash cycles and reheating without warping, clouding or staining.",
  },
  {
    title: "Freezer to hot-hold range",
    body: "Rated from -10°C up to +82°C depending on material, so the same tray moves from chiller to service line.",
  },
  {
    title: "TÜV Rheinland tested",
    body: "Independently tested for chemical resistance, break resistance, drying performance and durability.",
  },
  {
    title: "Coded, recyclable materials",
    body: "ABS, Co-Polymer (5 PP), Polycarbonate (PC) and Bio-Composite — every piece marked for responsible end-of-life.",
  },
  {
    title: "Mould-to-crate quality control",
    body: "In-house injection moulding with quality checks at every stage, from raw pellet to packed case.",
  },
];

export function Quality() {
  return (
    <section id="quality" className="scroll-mt-20 bg-ink py-24 text-paper md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-light">Quality &amp; certification</p>
            <h2 className="font-display mt-4 max-w-xl text-balance text-4xl font-medium leading-[1.08] md:text-5xl">
              Built to a standard, not a guess.
            </h2>
          </div>
          <MadeInIndiaBadge className="self-start !border-white/15 !bg-white/5 !text-paper" />
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: (i % 3) * 0.08 }}
              className="flex flex-col gap-3 bg-ink p-7"
            >
              <span className="font-display text-2xl text-brand-light">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-lg font-medium text-paper">{p.title}</h3>
              <p className="text-sm leading-relaxed text-paper/65">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
