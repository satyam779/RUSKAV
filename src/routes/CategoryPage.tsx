import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { categories, bioCategory } from "../data/catalogue";
import { ProductGroupCard } from "../components/ProductGroupCard";
import { Sustainability } from "../components/Sustainability";
import { NotFoundPage } from "./NotFoundPage";
import {
  EmptyState,
  PageHeader,
  Price,
  ProductImage,
  Section,
  SectionHeading,
  buttonClass,
} from "../components/ui";
import { cart } from "../lib/cart";
import { useProducts } from "../lib/products";

/** The priced rows for this category, so the page can link browse → buy. */
function CategoryShopStrip({ categoryId }: { categoryId: string }) {
  const { products } = useProducts();
  const inCategory = products.filter((p) => p.categoryId === categoryId);

  if (!inCategory.length) return null;

  return (
    <Section className="bg-paper-dim">
      <SectionHeading
        kicker="Buy this range"
        title="Priced by the case."
        intro="Add cases to your order and send it over as an enquiry, or pay online."
      />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {inCategory.slice(0, 8).map((p) => (
          <div
            key={p.code}
            className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-white/70 p-4"
          >
            <Link to={`/shop/${encodeURIComponent(p.code)}`} className="group">
              <ProductImage
                src={p.images[0]}
                alt={p.name}
                className="transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 45vw, 22vw"
              />
            </Link>
            <div className="flex flex-1 flex-col">
              <p className="font-mono text-[11px] font-semibold text-brand-dark">{p.code}</p>
              <Link
                to={`/shop/${encodeURIComponent(p.code)}`}
                className="mt-0.5 text-sm font-semibold leading-snug text-ink hover:text-brand"
              >
                {p.name}
              </Link>
              {p.size && <p className="text-xs text-ink-soft">{p.size}</p>}
              <div className="mt-auto pt-3">
                <Price product={p} size="sm" />
                <button
                  type="button"
                  onClick={() => cart.add(p.code)}
                  className={buttonClass("outline", "mt-3 w-full !px-3 !py-2 !text-xs")}
                >
                  Add a case
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {inCategory.length > 8 && (
        <div className="mt-8 flex justify-center">
          <Link to="/shop" className={buttonClass("ink", "px-6 py-3")}>
            See all {inCategory.length} codes with prices
          </Link>
        </div>
      )}
    </Section>
  );
}

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categories.find((c) => c.id === categoryId);
  const isBio = categoryId === bioCategory.id;

  useEffect(() => {
    const name = category?.name ?? (isBio ? bioCategory.name : null);
    if (name) document.title = `${name} | Ruskav Food Service Products`;
  }, [category, isBio]);

  // The bio line has no product codes in the print catalogue, so it keeps its
  // own editorial section rather than being forced into the spec-table layout.
  if (isBio) {
    return (
      <>
        <PageHeader
          kicker={bioCategory.kicker}
          title={bioCategory.tagline}
          intro={bioCategory.paragraphs[0]}
          tone="dim"
        >
          <Link to="/contact" className={buttonClass("primary")}>
            Ask for MOQs and pricing
          </Link>
        </PageHeader>
        <Sustainability />
        <CategoryShopStrip categoryId={bioCategory.id} />
      </>
    );
  }

  if (!category) return <NotFoundPage />;

  const [secondary, ...restImages] = category.secondaryImages;
  const codeCount = category.groups.reduce((n, g) => n + g.products.length, 0);

  return (
    <>
      <PageHeader
        backdrop={category.backdropImage}
        kicker={category.kicker}
        title={category.name}
        intro={category.tagline}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/shop" className={buttonClass("primary")}>
            Shop this range
          </Link>
          <Link to="/products" className={buttonClass("outline")}>
            All products
          </Link>
          <span className="text-sm text-ink-soft">
            {category.groups.length} lines · {codeCount} codes
          </span>
        </div>
      </PageHeader>

      <Section className="bg-paper pt-10 md:pt-14">
        <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-studio">
              <img
                src={category.heroImage}
                alt={category.name}
                width={1200}
                height={1500}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 92vw, 46vw"
                className="h-full w-full object-cover"
              />
            </div>
            {secondary && (
              <div className="absolute -bottom-8 -right-8 hidden w-[46%] overflow-hidden rounded-2xl border-4 border-paper bg-studio shadow-xl shadow-ink/15 sm:block">
                <img
                  src={secondary}
                  alt=""
                  width={800}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex flex-col gap-4">
              {category.paragraphs.map((p) => (
                <p key={p} className="text-balance leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </div>

            <h2 className="font-display mt-10 text-lg font-medium text-ink">
              Why this range
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {category.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-brand"
                  >
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

        {restImages.length > 0 && (
          <div className="mt-20 grid gap-4 sm:grid-cols-3">
            {restImages.map((src) => (
              <div key={src} className="aspect-square overflow-hidden rounded-2xl bg-studio">
                <img
                  src={src}
                  alt=""
                  width={800}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section className="border-t border-ink/8 bg-paper">
        <SectionHeading
          kicker="Specifications"
          title="Every line, every code."
          intro="Expand a line for its full specification table, colourways and product codes."
        />
        {category.groups.length ? (
          <div className="grid items-start gap-4 md:grid-cols-2">
            {category.groups.map((g, i) => (
              <ProductGroupCard key={g.id} group={g} defaultOpen={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState title="Specifications on request" body="Ask us for the full data sheet." />
        )}
      </Section>

      <CategoryShopStrip categoryId={category.id} />
    </>
  );
}
