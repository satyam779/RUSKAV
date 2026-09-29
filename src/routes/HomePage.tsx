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
import { bioCategory } from "../data/catalogue";

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
    image: "/gallery/compartment-trays-six.webp",
  },
  {
    name: "Hospitals",
    image: "/gallery/compartment-carrier-loaded.webp",
  },
  {
    name: "QSR & food courts",
    image: "/gallery/tray-fastfood-red.webp",
  },
  {
    name: "Hotels & catering",
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
        action={
          <Link
            to="/shop"
            className="-my-2 py-2 text-sm font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition hover:decoration-brand"
          >
            Shop the full range
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
    <section className="bg-bio-paper py-10 sm:py-14 md:py-20">
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
          <ul className="mt-6 flex flex-wrap gap-2">
            {bioCategory.points.map((p) => (
              <li
                key={p.label}
                className="rounded-full border border-bio-dark/20 bg-white/60 px-4 py-2 text-sm font-semibold text-ink"
              >
                {p.label}
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
      <div className="bg-paper pt-10 md:pt-14">
        <div className="mx-auto max-w-6xl px-6">
          <TradeGate />
        </div>
      </div>

      <Section className="relative isolate overflow-hidden bg-paper">
        {/* The full wordmark as a watermark across the section, behind the
            copy and the figures (`isolate` keeps -z-10 inside the section). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none whitespace-nowrap text-center font-script text-[27vw] leading-none text-brand/[0.06] md:text-[21vw] 2xl:text-[20rem]"
        >
          RUSKAV
        </div>
        <div className="relative grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div>
            <Eyebrow>About Ruskav</Eyebrow>
            <h2 className="font-display mt-4 text-balance text-3xl font-medium leading-[1.06] text-ink md:text-[2.6rem]">
              Quality control isn&apos;t a department. It&apos;s the whole job.
            </h2>
            {/* Side by side on a phone: stacked, the mark left a screen of
                empty paper between the heading and the copy it introduces. */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-5 md:mt-7 md:block">
              <Link to="/about" className={buttonClass("outline")}>
                Read our story
              </Link>
              <MakeInIndiaMark width={172} className="w-[128px] shrink-0 md:mt-10 md:w-auto" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:gap-6">
            <p className="text-balance text-base leading-relaxed text-ink-soft md:text-lg">
              RUSKAV Food Service Products is one of India&apos;s largest manufacturers of
              international-quality food service products, with fast food trays, compartment
              trays, cafeteria trays, PC tumblers and PC dinnerware among them.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <CertBadge kind="food" />
              <CertBadge kind="dishwasher" />
              <CertBadge kind="microwave" />
              <CertBadge kind="tuv" />
            </div>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-ink/10 pt-8 md:mt-16 md:grid-cols-4 md:pt-10">
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
    </>
  );
}
