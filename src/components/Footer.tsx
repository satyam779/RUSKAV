import { LabelIcon } from "./icons/LabelIcon";
import { Link } from "react-router-dom";
import { categories, bioCategory, companyInfo } from "../data/catalogue";
import { MakeInIndiaMark } from "./icons/Badges";
import { useCartBarVisible } from "./CartBar";
import { loginHref, useTradeAccess } from "../lib/trade";
import { ColourStrip } from "./ui";

const productLinks = [
  ...categories.map((c) => ({ to: `/products/${c.id}`, label: c.shortName })),
  { to: `/products/${bioCategory.id}`, label: bioCategory.shortName },
];

const companyLinks = [
  { to: "/about", label: "About us" },
  { to: "/quality", label: "Quality & certification" },
  { to: "/products", label: "Full product range" },
  { to: "/shop", label: "Shop with prices" },
  { to: "/contact", label: "Distributor enquiries" },
];

export function Footer() {
  // The floating cart bar hovers over the last 80-odd pixels of the page, and
  // the end of the footer is the one place a reader cannot scroll out from
  // under it — so the footer makes room for it while it is there.
  const cartBar = useCartBarVisible();
  const { signedIn } = useTradeAccess();

  return (
    <footer
      className={`relative isolate overflow-hidden bg-ink text-paper/80 ${cartBar ? "pb-24 md:pb-20" : ""}`}
    >
      {/* The wordmark as a watermark behind the columns. `isolate` keeps it
          under the footer's content without lifting it above the page. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-0.14em] -z-10 select-none whitespace-nowrap text-center font-script text-[27vw] leading-none text-brand/[0.13] md:text-[21vw] 2xl:text-[20rem]"
      >
        RUSKAV
      </span>

      <ColourStrip className="h-1.5" />

      {/* The last chance to open an account, on every page of the site. */}
      <div className="border-b border-white/10 bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:py-12">
          <div>
            <p className="eyebrow-rule text-brand-light">
              <LabelIcon label="Trade accounts" />
              Trade accounts
            </p>
            <h2 className="font-display mt-3 max-w-lg text-balance text-2xl font-medium leading-tight text-paper md:text-[1.75rem]">
              {signedIn
                ? "Your prices are unlocked. Build an order any time."
                : "Open a free trade account and see every price."}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={signedIn ? "/shop" : loginHref("/shop")}
              className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark"
            >
              {signedIn ? "Go to the shop" : "Create a free account"}
            </Link>
            <a
              href={`https://wa.me/${companyInfo.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-paper transition hover:border-white/60"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-10 md:pt-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pb-10 md:pb-14 md:grid-cols-[1.3fr_1fr_1fr_1.1fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-script text-3xl text-brand-light">
              RUSKAV
              <span className="ml-1 align-top text-xs text-paper/70">®</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">
              International-quality food service products: trays, dinnerware and
              drinkware, engineered in India for every kitchen and canteen.
            </p>
            <MakeInIndiaMark panel width={148} className="mt-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-paper">
              Products
            </p>
            <ul className="mt-2.5 flex flex-col gap-1 md:mt-4 md:gap-2.5">
              {productLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="inline-block py-1.5 text-sm text-paper/65 transition hover:text-white md:py-0"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-paper">
              Company
            </p>
            <ul className="mt-2.5 flex flex-col gap-1 md:mt-4 md:gap-2.5">
              {companyLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="inline-block py-1.5 text-sm text-paper/65 transition hover:text-white md:py-0"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold text-paper">
              Contact
            </p>
            <ul className="mt-2.5 flex flex-col gap-1 text-sm text-paper/65 md:mt-4 md:gap-2.5">
              <li>{companyInfo.addressLines.map((l) => l.replace(/,$/, "")).join(", ")}</li>
              <li>
                <a
                  href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`}
                  className="inline-block py-1.5 transition hover:text-white md:py-0"
                >
                  {companyInfo.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${companyInfo.email}`} className="inline-block py-1.5 transition hover:text-white md:py-0">
                  {companyInfo.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${companyInfo.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1.5 transition hover:text-white md:py-0"
                >
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-7 text-xs text-paper/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Ruskav Food Service Products. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <LabelIcon label="Distributor enquiries" className="text-brand-light" />
            Distributor and dealer enquiries solicited.
          </p>
        </div>
      </div>
    </footer>
  );
}
