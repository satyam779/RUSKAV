import { motion } from "framer-motion";
import { CertBadge } from "./icons/Badges";

const stats = [
  { value: "5", label: "Product families" },
  { value: "40+", label: "SKUs across the range" },
  { value: "11", label: "Colourways per line" },
  { value: "100%", label: "Food-contact safe material" },
];

export function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-paper py-24 md:py-32">
      <div className="pointer-events-none absolute -right-24 -top-24 font-script text-[280px] leading-none text-brand/[0.04] md:text-[420px]">
        R
      </div>
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-14 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">About Ruskav</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-medium leading-[1.08] text-ink md:text-5xl">
              Quality control isn't a department. It's the whole job.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <p className="text-balance text-lg leading-relaxed text-ink-soft">
              RUSKAV Food Service Products is one of India's largest manufacturers of
              international-quality food service products — fast food trays,
              compartment trays, cafeteria trays, PC tumblers and PC dinnerware among
              them.
            </p>
            <p className="text-balance text-lg leading-relaxed text-ink-soft">
              Every raw material we use is either FDA-approved or compliant with{" "}
              <strong className="font-semibold text-ink">IS 10910</strong> for safe
              contact with food, pharmaceuticals and drinking water — built to
              international standards and specifications, and finished to be
              dishwasher- and microwave-safe.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <CertBadge kind="food" />
              <CertBadge kind="dishwasher" />
              <CertBadge kind="microwave" />
              <CertBadge kind="tuv" />
            </div>
          </motion.div>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/10 pt-10 md:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl font-medium text-brand md:text-5xl">{s.value}</dd>
              <dd className="mt-1.5 text-sm text-ink-soft">{s.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
