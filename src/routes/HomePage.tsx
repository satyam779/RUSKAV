import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFrameSequence } from "../hooks/useFrameSequence";
import { acquireScrollLock } from "../lib/scrollLock";
import { Loader } from "../components/Loader";
import { Hero } from "../components/Hero";
import { TrustStrip } from "../components/TrustStrip";
import { CategoryGrid } from "../components/CategoryGrid";
import { CertBadge } from "../components/icons/Badges";
import { Price, ProductImage, Section, SectionHeading, buttonClass } from "../components/ui";
import { useProducts } from "../lib/products";
import { categories } from "../data/catalogue";

const stats = [
  { value: "5", label: "Product families" },
  { value: "40+", label: "SKUs across the range" },
  { value: "11", label: "Colourways per line" },
  { value: "100%", label: "Food-contact safe material" },
];

/** Up to four featured lines, so the home page shows real product, not just copy. */
function Featured() {
  const { products } = useProducts();
  const featured = (products.filter((p) => p.isFeatured).length
    ? products.filter((p) => p.isFeatured)
    : products
  ).slice(0, 4);

  if (!featured.length) return null;

  return (
    <Section className="bg-paper-dim">
      <SectionHeading
        kicker="In the shop"
        title="Order by the case, priced and ready."
        intro="Case packs, colourways and current pricing — add what you need and send it across in a couple of clicks."
      />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {featured.map((p, i) => (
          <motion.div
            key={p.code}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.07 }}
          >
            <Link
              to={`/shop/${encodeURIComponent(p.code)}`}
              className="group flex h-full flex-col gap-3 rounded-3xl border border-ink/10 bg-white/70 p-4 transition hover:border-brand/40 hover:shadow-lg hover:shadow-ink/5"
            >
              <ProductImage
                src={p.images[0]}
                alt={p.name}
                className="transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 45vw, 22vw"
              />
              <div className="flex flex-1 flex-col">
                <p className="font-mono text-[11px] font-semibold text-brand-dark">{p.code}</p>
                <h3 className="mt-0.5 text-sm font-semibold leading-snug text-ink">{p.name}</h3>
                {p.size && <p className="text-xs text-ink-soft">{p.size}</p>}
                <div className="mt-auto pt-3">
                  <Price product={p} size="sm" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/shop" className={buttonClass("ink", "px-6 py-3")}>
          Shop the full range
        </Link>
      </div>
    </Section>
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

      <Section className="relative overflow-hidden bg-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 font-script text-[280px] leading-none text-brand/[0.04] md:text-[420px]"
        >
          R
        </div>
        <div className="relative grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">
              About Ruskav
            </p>
            <h2 className="font-display mt-4 text-balance text-3xl font-medium leading-[1.08] text-ink md:text-4xl">
              Quality control isn&apos;t a department. It&apos;s the whole job.
            </h2>
            <Link to="/about" className={buttonClass("outline", "mt-7")}>
              Read our story
            </Link>
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
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl font-medium text-brand md:text-5xl">{s.value}</dd>
              <dd className="mt-1.5 text-sm text-ink-soft">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CategoryGrid />
      <Featured />

      <Section className="bg-ink text-paper">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-light">
              Distributor &amp; dealer enquiries
            </p>
            <h2 className="font-display mt-4 max-w-xl text-balance text-3xl font-medium leading-[1.1] md:text-4xl">
              Tell us what you&apos;re serving, and how much of it.
            </h2>
            <p className="mt-5 max-w-lg text-balance leading-relaxed text-paper/70">
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
              className={buttonClass("outline", "px-6 py-3 !border-white/25 !text-paper hover:!border-white/60")}
            >
              Browse prices
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
