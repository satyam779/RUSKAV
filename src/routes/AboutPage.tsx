import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CertBadge, MadeInIndiaBadge } from "../components/icons/Badges";
import { Sustainability } from "../components/Sustainability";
import { PageHeader, Section, SectionHeading, buttonClass } from "../components/ui";

const stats = [
  { value: "5", label: "Product families" },
  { value: "40+", label: "SKUs across the range" },
  { value: "11", label: "Colourways per line" },
  { value: "100%", label: "Food-contact safe material" },
];

/**
 * How a piece gets made, start to finish. The print catalogue shows the
 * moulding floor without explaining it; this puts the photographs in order so
 * a buyer can see where quality control actually happens.
 */
const process = [
  {
    title: "Virgin raw material",
    body: "Every batch starts with virgin, food-contact-safe pellets — FDA-approved or certified to IS 10910. No regrind, no reclaimed filler in anything that touches food.",
  },
  {
    title: "In-house injection moulding",
    body: "Tooling and moulding both happen on our own floor, so a dimension that drifts is caught at the machine rather than at the customer's servery.",
  },
  {
    title: "Checks at every stage",
    body: "Colour match, wall thickness, rim finish and stacking fit are checked through the run, not sampled at the end of it.",
  },
  {
    title: "Independent testing",
    body: "TÜV Rheinland tests chemical resistance, break resistance, drying performance and durability against the figures we publish.",
  },
  {
    title: "Packed by the case",
    body: "Counted, stacked and cased to fixed case packs, so what arrives at the dock matches what was ordered on paper.",
  },
];

const sectors = [
  "Schools & colleges",
  "Hospitals & healthcare",
  "Corporate cafeterias",
  "Food courts",
  "QSR & fast food",
  "Hotels & caterers",
  "Railway & transit catering",
  "Industrial canteens",
];

export function AboutPage() {
  return (
    <>
      <PageHeader
        kicker="About Ruskav"
        title={
          <>
            Quality control isn&apos;t a department. It&apos;s the whole job.
          </>
        }
        intro="RUSKAV Food Service Products is one of India's largest manufacturers of international-quality food service products — fast food trays, compartment trays, cafeteria trays, PC tumblers and PC dinnerware among them."
      >
        <div className="flex flex-wrap items-center gap-3">
          <MadeInIndiaBadge />
          <CertBadge kind="food" />
          <CertBadge kind="tuv" />
        </div>
      </PageHeader>

      <Section className="bg-paper pt-10 md:pt-14">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-5">
            <p className="text-balance text-lg leading-relaxed text-ink-soft">
              We lay a great deal of emphasis on quality control. All raw material used is
              either approved by the FDA or complies with{" "}
              <strong className="font-semibold text-ink">IS 10910</strong> for safe use in
              contact with foodstuff, pharmaceuticals and drinking water.
            </p>
            <p className="text-balance leading-relaxed text-ink-soft">
              Most of our products are built to international standards and specifications,
              offer the best value and quality to their customers, and are dishwasher and
              microwave safe.
            </p>
            <p className="text-balance leading-relaxed text-ink-soft">
              The range runs from the servery line to the table: cafeteria and fast food
              trays, compartment plates for portion control, polycarbonate dinnerware and
              drinkware with the look of glass, and a bio-composite line made from crop
              residue that would otherwise be burnt.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-studio">
            <img
              src="/gallery/compartment-trays-colours.webp"
              alt="Ruskav compartment trays fanned out in ten colourways."
              width={1120}
              height={1400}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/10 pt-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl font-medium text-brand md:text-5xl">{s.value}</dd>
              <dd className="mt-1.5 text-sm text-ink-soft">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section className="bg-paper-dim">
        <SectionHeading
          kicker="How it's made"
          title="From raw pellet to packed case."
          intro="Five stages, all under one roof — which is the reason a fault gets caught here rather than in your kitchen."
        />
        <ol className="grid gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-2 lg:grid-cols-3">
          {process.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.07 }}
              className="flex flex-col gap-3 bg-paper-dim p-7"
            >
              <span className="font-display text-2xl text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg font-medium text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </motion.li>
          ))}
          <li className="flex flex-col justify-center gap-4 bg-ink p-7 text-paper">
            <p className="font-display text-xl leading-snug">
              Want the specification sheet for a particular line?
            </p>
            <Link
              to="/contact"
              className={buttonClass("primary", "self-start")}
            >
              Ask us
            </Link>
          </li>
        </ol>
      </Section>

      <Section className="bg-paper">
        <SectionHeading
          kicker="Who we serve"
          title="Wherever food is served at volume."
        />
        <ul className="flex flex-wrap gap-2.5">
          {sectors.map((s) => (
            <li
              key={s}
              className="rounded-full border border-ink/12 bg-white/70 px-4 py-2 text-sm font-medium text-ink-soft"
            >
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Sustainability />
    </>
  );
}
