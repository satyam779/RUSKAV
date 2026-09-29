import { Link } from "react-router-dom";
import { categories, bioCategory } from "../data/catalogue";

const cards = [
  ...categories.map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    tagline: c.tagline,
    thumb: c.thumb,
    theme: c.theme,
    codes: c.groups.reduce((n, g) => n + g.products.length, 0),
  })),
  {
    id: bioCategory.id,
    name: bioCategory.name,
    shortName: bioCategory.shortName,
    tagline: bioCategory.tagline,
    thumb: bioCategory.thumb,
    theme: bioCategory.theme,
    codes: 0,
  },
];

function ArrowBadge() {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition duration-300 group-hover:bg-brand md:h-11 md:w-11"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 12 12 4M12 4H6M12 4v6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * The range as one tall card for the lead range and four photographs beside
 * it. The lead card carries its name and a line of copy over the top of its
 * photo; the others are the photograph, a name and the way in.
 */
export function CategoryGrid() {
  const [lead, ...rest] = cards;

  return (
    <section className="bg-paper py-10 sm:py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-10">
          <h2 className="font-display max-w-xl text-balance text-3xl leading-[1.05] text-ink md:text-[2.6rem]">
            Five product families, one standard of quality.
          </h2>
          <Link
            to="/products"
            className="-my-2 py-2 text-sm font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition hover:decoration-brand"
          >
            See all products
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1.35fr_1fr_1fr] md:gap-4">
          <Link
            to={`/products/${lead.id}`}
            className="group relative col-span-2 aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-paper-dim sm:aspect-[16/11] md:col-span-1 md:row-span-2 md:aspect-auto"
          >
            <img
              src={lead.thumb}
              alt=""
              loading="lazy"
              decoding="async"
              width={1000}
              height={1000}
              sizes="(max-width: 768px) 92vw, 40vw"
              className="absolute inset-0 h-full w-full object-cover object-[center_80%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            {/* The copy sits on a plain ground that melts into the photograph
                over a short fixed distance, so the product itself stays crisp
                whatever the card's height. */}
            <div className="relative bg-paper-dim p-6 pb-2 md:p-8 md:pb-3">
              <h3 className="font-display text-2xl leading-tight text-ink md:text-[1.9rem]">
                {lead.name}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft md:text-[15px]">
                {lead.tagline} {lead.codes} product codes.
              </p>
            </div>
            <div
              aria-hidden="true"
              className="relative h-16 bg-gradient-to-b from-paper-dim to-transparent md:h-24"
            />
            <span className="absolute bottom-4 right-4 md:bottom-5 md:right-5">
              <ArrowBadge />
            </span>
          </Link>

          {rest.map((c) => (
            <Link
              key={c.id}
              to={`/products/${c.id}`}
              className={`group relative aspect-square overflow-hidden rounded-[1.25rem] ${
                c.theme === "bio" ? "media-panel-bio" : "media-panel"
              }`}
            >
              <img
                src={c.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                width={1000}
                height={1000}
                sizes="(max-width: 768px) 46vw, 24vw"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] rounded-xl bg-white/90 px-3 py-1.5 text-[13px] font-semibold leading-tight text-ink backdrop-blur md:bottom-4 md:left-4 md:max-w-[calc(100%-4.75rem)] md:text-sm">
                {c.shortName}
              </span>
              {/* A phone-sized compartment has no room for both; the whole
                  card is the link, so the name wins there. */}
              <span className="absolute bottom-4 right-4 hidden md:block">
                <ArrowBadge />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
