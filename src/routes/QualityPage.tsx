import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CertBadge, MadeInIndiaBadge, MaterialBadge } from "../components/icons/Badges";
import { PageHeader, Section, SectionHeading, buttonClass } from "../components/ui";

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

/** The four materials, with the trade-offs a buyer actually chooses between. */
const materials = [
  {
    code: "ABS",
    name: "ABS",
    heat: "-10°C to +82°C",
    strengths: "Highest heat tolerance in the range; excellent chemical resistance and a very good scratch-hiding texture.",
    use: "Cafeteria and fast food trays that go through hot wash cycles all day.",
  },
  {
    code: "5 PP",
    name: "Co-Polymer",
    heat: "-10°C to +75°C",
    strengths: "Excellent break resistance and the most economical of the range; microwave safe.",
    use: "Compartment plates, Rupee Saver trays, high-turnover service where drops happen.",
  },
  {
    code: "PC",
    name: "Polycarbonate",
    heat: "-10°C to +82°C",
    strengths: "The clarity and weight of glass, virtually unbreakable, up to 50% lighter.",
    use: "Dinnerware and drinkware front of house, where it has to look like glass.",
  },
  {
    code: "BIO",
    name: "Bio-Composite",
    heat: "Ambient service",
    strengths: "Made with rice husk, coffee husk, bamboo and fast-renewable starch diverted from burning.",
    use: "Sustainability-led service that still needs a wash-and-reuse cycle.",
  },
];

const tests = [
  { label: "Chemical resistance", value: "Excellent" },
  { label: "Drying test", value: "Excellent" },
  { label: "Shock resistance", value: "Good" },
  { label: "Break resistance", value: "Good to excellent" },
  { label: "Scratch resistance", value: "Very good" },
  { label: "Stain resistance", value: "Very good" },
];

/** The shop floor, photographed for the print catalogue. */
const shopFloor = [
  {
    src: "/gallery/factory-mould-open.webp",
    alt: "An injection mould open on the press, showing the polished tray cavity",
    caption:
      "A tray cavity in the open mould. The polish on the tool is what gives the finished tray its surface.",
  },
  {
    src: "/gallery/factory-press.webp",
    alt: "An injection moulding machine mid-cycle on the Ruskav shop floor",
    caption:
      "Moulding in progress. Cycle time, melt temperature and cooling are logged per tool, per shift.",
  },
  {
    src: "/gallery/factory-crates.webp",
    alt: "Stacked crates of moulded product waiting for inspection and packing",
    caption:
      "Off the press and into crates, where every batch is checked before it is packed by the case.",
  },
];

export function QualityPage() {
  return (
    <>
      <PageHeader
        kicker="Quality & certification"
        title="Built to a standard, not a guess."
        intro="Every figure we publish is one an independent lab has checked. Here is what that means, material by material."
        tone="ink"
      >
        <div className="flex flex-wrap items-center gap-3">
          <MadeInIndiaBadge className="!border-white/15 !bg-white/5 !text-paper" />
          <span className="text-sm text-paper/70">TÜV Rheinland tested · FDA · IS 10910</span>
        </div>
      </PageHeader>

      <Section className="bg-ink pt-0 text-paper md:pt-0">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
              className="flex flex-col gap-3 bg-ink p-7"
            >
              <span className="font-display text-2xl text-brand-light">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-lg font-medium text-paper">{p.title}</h2>
              <p className="text-sm leading-relaxed text-paper/70">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section className="bg-paper">
        <SectionHeading
          kicker="Materials"
          title="Four materials, chosen for the job."
          intro="Which one a line is moulded in is a decision about heat, breakage and cost — not a preference."
        />
        <div className="overflow-x-auto rounded-3xl border border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="bg-paper-dim text-xs uppercase tracking-wide text-ink-soft">
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Material
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Heat range
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Strengths
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Typically used for
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 bg-white/40">
              {materials.map((m) => (
                <tr key={m.code}>
                  <th scope="row" className="px-5 py-4 text-left align-top">
                    <span className="flex items-center gap-2">
                      <MaterialBadge code={m.code} size={24} />
                      <span className="font-display text-base font-medium text-ink">{m.name}</span>
                    </span>
                  </th>
                  <td className="whitespace-nowrap px-5 py-4 align-top font-medium text-ink">
                    {m.heat}
                  </td>
                  <td className="px-5 py-4 align-top leading-relaxed text-ink-soft">{m.strengths}</td>
                  <td className="px-5 py-4 align-top leading-relaxed text-ink-soft">{m.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="bg-paper-dim">
        <SectionHeading
          kicker="Our own tool room"
          title="Tooled and moulded under one roof."
          intro="Cavities are cut, trialled and corrected here, which is why a compartment layout or a tray size outside the catalogue is a routine request rather than a project."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {shopFloor.map((shot, i) => (
            <motion.figure
              key={shot.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="overflow-hidden rounded-3xl border border-ink/10 bg-white/60"
            >
              <div className="aspect-[4/3] overflow-hidden bg-studio">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 768px) 92vw, 30vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="px-5 py-4 text-sm leading-relaxed text-ink-soft">
                {shot.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Section>

      <Section className="bg-paper-dim">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <SectionHeading kicker="Independent testing" title="What TÜV Rheinland checks." />
            <dl className="overflow-hidden rounded-3xl border border-ink/10 bg-white/60">
              {tests.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between gap-4 border-b border-ink/8 px-5 py-3.5 last:border-0"
                >
                  <dt className="text-sm text-ink-soft">{t.label}</dt>
                  <dd className="text-sm font-semibold text-ink">{t.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              Exact figures vary by line and material — every product page and specification
              table carries the values for that item.
            </p>
          </div>

          <div>
            <SectionHeading kicker="Marks on every piece" title="What the symbols mean." />
            <ul className="flex flex-col gap-3">
              {(["food", "dishwasher", "microwave", "freezer", "tuv"] as const).map((kind) => (
                <li key={kind} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
                  <CertBadge kind={kind} />
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className={buttonClass("ink")}>
                See specifications by range
              </Link>
              <Link to="/contact" className={buttonClass("outline")}>
                Request a data sheet
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
