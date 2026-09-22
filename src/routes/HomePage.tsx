import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFrameSequence } from "../hooks/useFrameSequence";
import { acquireScrollLock } from "../lib/scrollLock";
import { Loader } from "../components/Loader";
import { Hero } from "../components/Hero";
import { TrustStrip } from "../components/TrustStrip";
import { CategoryGrid } from "../components/CategoryGrid";
import { ProductCard } from "../components/ProductCard";
import { TradeGate } from "../components/TradeGate";
import { CertBadge, MakeInIndiaMark } from "../components/icons/Badges";
import { Eyebrow, Section, SectionHeading, buttonClass } from "../components/ui";
import { useProducts } from "../lib/products";
import { bioCategory, categories } from "../data/catalogue";

const stats = [
  { value: "5", label: "Product families" },
  { value: "40+", label: "SKUs across the range" },
  { value: "11", label: "Colourways per line" },
  { value: "100%", label: "Food-contact safe material" },
];

/**
 * Who actually buys this.
 *
 * A wholesale visitor is not shopping for a tray, they are outfitting a
 * servery — so the range is introduced by the room it goes into before it is
 * introduced by its material.
 */
const sectors = [
  {
    name: "Schools & colleges",
    detail: "Compartment trays that survive a thousand covers a day",
    image: "/gallery/compartment-trays-six.webp",
  },
  {
    name: "Hospitals",
    detail: "Sealed carriers and lidded trays for ward service",
    image: "/gallery/compartment-carrier-loaded.webp",
  },
  {
    name: "QSR & food courts",
    detail: "Fast food trays in eleven colourways, branded to your line",
    image: "/gallery/tray-fastfood-red.webp",
  },
  {
    name: "Hotels & catering",
    detail: "Polycarbonate dinnerware and break-resistant drinkware",
    image: "/gallery/tumblers-frosted-table.webp",
  },
];

/**
 * The shop, on the home page.
 *
 * Eight lines rather than four: the point of this block is to make the site
 * read as a catalogue you can order from, and a single row of four reads as a
 * teaser for one.
 */
function Featured() {
  const { products } = useProducts();

  const featured = useMemo(() => {
    const flagged = products.filter((p) => p.isFeatured);
    return (flagged.length ? flagged : products).slice(0, 6);
  }, [products]);

  if (!featured.length) return null;

  return (
    <Section className="bg-paper-dim">
      <SectionHeading
        kicker="In the shop"
        title="Order by the case, priced and ready."
        intro="Case packs, colourways and trade pricing — add what you need and send it across in a couple of clicks."
        action={
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand transition hover:gap-3"
          >
            Shop the full range
            <span aria-hidden="true">→</span>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-7 md:gap-y-14">
        {featured.map((p, i) => (
          <motion.div
            key={p.code}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
          >
            <ProductCard
              product={p}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 45vw, 32vw"
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link to="/shop" className={buttonClass("ink", "px-7 py-3.5")}>
          Shop the full range
        </Link>
      </div>
    </Section>
  );
}

function Sectors() {
  return (
    <Section className="bg-paper">
      <SectionHeading
        kicker="Built for"
        title="Wherever the queue forms."
        intro="Specified by school kitchens, hospital wards, food courts and hotel banqueting teams across India."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {sectors.map((s, i) => (
          <motion.article
            key={s.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.07 }}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink"
          >
            <img
              src={s.image}
              alt=""
              width={800}
              height={1066}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 46vw, 23vw"
              className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <span
                aria-hidden="true"
                className="mb-2 block h-0.5 w-7 origin-left bg-brand transition-transform duration-500 group-hover:scale-x-[2.2]"
              />
              <h3 className="font-display text-base font-medium leading-tight text-white md:text-lg">
                {s.name}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-white/65 md:text-xs">
                {s.detail}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/** The sustainable line, given its own band rather than a tile in a grid. */
function BioBand() {
  return (
    <section className="bg-bio-paper py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:gap-16">
        <div className="relative">
          <div className="media-panel-bio aspect-[5/4] overflow-hidden rounded-[2rem]">
            <img
              src={bioCategory.heroImage}
              alt={bioCategory.name}
              width={1200}
              height={960}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 92vw, 46vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-4 hidden w-[38%] overflow-hidden rounded-2xl border-4 border-bio-paper shadow-xl shadow-ink/15 sm:block">
            <img
              src={bioCategory.thumb}
              alt=""
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>

        <div>
          <Eyebrow>{bioCategory.kicker}</Eyebrow>
          <h2 className="font-display mt-4 text-balance text-3xl font-medium leading-[1.08] text-ink md:text-[2.6rem]">
            {bioCategory.tagline}
          </h2>
          <p className="mt-5 text-balance leading-relaxed text-ink-soft">
            {bioCategory.paragraphs[1]}
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {bioCategory.points.map((p) => (
              <li key={p.label} className="rounded-2xl border border-bio-dark/15 bg-white/50 p-4">
                <p className="text-sm font-semibold text-ink">{p.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.detail}</p>
              </li>
            ))}
          </ul>
          <Link
            to={`/products/${bioCategory.id}`}
            className={buttonClass("primary", "mt-8 px-6 py-3")}
          >
            See the bio-composite range
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { progress, ready, images, animated, count } = useFrameSequence();
  const [loaderVisible, setLoaderVisible] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setLoaderVisible(false), 400);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => acquireScrollLock(loaderVisible), [loaderVisible]);

  return (
    <>
      <Loader progress={progress} visible={loaderVisible} />

      <Hero images={images} ready={ready} animated={animated} count={count} />
      <TrustStrip />

      {/* The deal, stated once, above everything a price could appear in. */}
      <div className="bg-paper pt-14 md:pt-20">
        <div className="mx-auto max-w-6xl px-6">
          <TradeGate />
        </div>
      </div>

      <Section className="relative overflow-hidden bg-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 select-none font-script text-[280px] leading-none text-brand/[0.05] md:text-[420px]"
        >
          R
        </div>
        <div className="relative grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div>
            <Eyebrow>About Ruskav</Eyebrow>
            <h2 className="font-display mt-4 text-balance text-3xl font-medium leading-[1.06] text-ink md:text-[2.6rem]">
              Quality control isn&apos;t a department. It&apos;s the whole job.
            </h2>
            <Link to="/about" className={buttonClass("outline", "mt-7")}>
              Read our story
            </Link>
            <MakeInIndiaMark width={172} className="mt-10" />
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-balance text-lg leading-relaxed text-ink-soft">
              RUSKAV Food Service Products is one of India&apos;s largest manufacturers of
              international-quality food service products — fast food trays, compartment
              trays, cafeteria trays, PC tumblers and PC dinnerware among them.
            </p>
            <p className="text-balance leading-relaxed text-ink-soft">
              Every raw material we use is either FDA-approved or compliant with{" "}
              <strong className="font-semibold text-ink">IS 10910</strong> for safe contact
              with food, pharmaceuticals and drinking water.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <CertBadge kind="food" />
              <CertBadge kind="dishwasher" />
              <CertBadge kind="microwave" />
              <CertBadge kind="tuv" />
            </div>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/10 pt-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-l-2 border-brand/25 pl-4">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl font-medium text-brand md:text-5xl">{s.value}</dd>
              <dd className="mt-1.5 text-sm text-ink-soft">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CategoryGrid />
      <Featured />
      <Sectors />
      <BioBand />

      <Section className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand"
        />
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow tone="light">Distributor &amp; dealer enquiries</Eyebrow>
            <h2 className="font-display mt-4 max-w-xl text-balance text-3xl font-medium leading-[1.08] md:text-[2.6rem]">
              Tell us what you&apos;re serving, and how much of it.
            </h2>
            <p className="mt-5 max-w-lg text-balance leading-relaxed text-paper/65">
              We&apos;ll come back with specifications, MOQs and pricing for your format —
              across all {categories.length + 1} product families.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/contact" className={buttonClass("primary", "px-6 py-3")}>
              Get in touch
            </Link>
            <Link
              to="/shop"
              className={buttonClass("outline", "px-6 py-3 !border-white/25 !text-paper hover:!border-white/60 hover:!text-white")}
            >
              Browse the shop
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
