import { motion } from "framer-motion";
import { bioCategory } from "../data/catalogue";

export function Sustainability() {
  const [imgA, imgB, imgC] = bioCategory.secondaryImages;

  return (
    <section
      id={bioCategory.id}
      className="scroll-mt-[calc(var(--header-h)+1rem)] bg-bio-paper py-14 sm:py-20 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 md:grid-cols-2 md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] text-bio-dark">{bioCategory.kicker}</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-medium leading-[1.08] text-ink md:text-5xl">
              {bioCategory.tagline}
            </h2>
            <div className="mt-6 flex flex-col gap-4">
              {bioCategory.paragraphs.map((p, i) => (
                <p key={i} className="text-balance leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-bio-dark/15 pt-8">
              {bioCategory.points.map((pt) => (
                <div key={pt.label}>
                  <dt className="font-display text-base font-medium text-ink">{pt.label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{pt.detail}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="grid grid-cols-2 grid-rows-2 gap-4"
          >
            <div className="col-span-2 aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-[#e6dcc6]">
              <img
                src={bioCategory.heroImage}
                alt={bioCategory.name}
                loading="lazy"
                decoding="async"
                width={1600}
                height={1000}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#e6dcc6]">
              <img src={imgA} alt="" loading="lazy" decoding="async" width={800} height={800} className="h-full w-full object-cover" />
            </div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#e6dcc6]">
              <img src={imgB} alt="" loading="lazy" decoding="async" width={800} height={800} className="h-full w-full object-cover" />
            </div>
          </motion.div>
        </div>

        {imgC && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mt-14 flex items-center gap-6 rounded-3xl bg-white/40 p-6 md:p-8"
          >
            <div className="hidden h-28 w-28 shrink-0 overflow-hidden rounded-2xl sm:block">
              <img src={imgC} alt="" loading="lazy" decoding="async" width={400} height={400} className="h-full w-full object-cover" />
            </div>
            <p className="text-balance leading-relaxed text-ink-soft">
              Every item in the bio-composite line is engineered to swap in wherever a
              conventional tray, plate, bowl or cup is used today — no compromise on
              durability, same wash-and-reuse cycle, a lighter footprint on the way
              out. Ask us for MOQs, lead times and pricing for your format.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
