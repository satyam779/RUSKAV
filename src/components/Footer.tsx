import { categories, bioCategory, companyInfo } from "../data/catalogue";
import { MadeInIndiaBadge } from "./icons/Badges";

const links = [...categories.map((c) => ({ id: c.id, label: c.shortName })), { id: bioCategory.id, label: bioCategory.shortName }];

export function Footer() {
  return (
    <footer className="bg-ink pt-20 text-paper/80">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 pb-14 md:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          <div>
            <a href="#top" className="font-script text-3xl text-brand-light">
              RUSKAV
              <span className="ml-1 align-top text-xs text-paper/60">®</span>
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/55">
              International-quality food service products — trays, dinnerware and
              drinkware, engineered in India for every kitchen and canteen.
            </p>
            <MadeInIndiaBadge className="mt-5 !border-white/15 !bg-white/5 !text-paper" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-paper/45">Products</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {links.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="text-sm text-paper/70 transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-paper/45">Company</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a href="#about" className="text-sm text-paper/70 transition hover:text-white">
                  About us
                </a>
              </li>
              <li>
                <a href="#quality" className="text-sm text-paper/70 transition hover:text-white">
                  Quality &amp; certification
                </a>
              </li>
              <li>
                <a href="#contact" className="text-sm text-paper/70 transition hover:text-white">
                  Distributor enquiries
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-paper/45">Contact</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-paper/70">
              <li>{companyInfo.addressLines.join(", ")}</li>
              <li>
                <a href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`} className="transition hover:text-white">
                  {companyInfo.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${companyInfo.email}`} className="transition hover:text-white">
                  {companyInfo.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-7 text-xs text-paper/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Ruskav Food Service Products. All rights reserved.</p>
          <p>Distributor and dealer enquiries solicited.</p>
        </div>
      </div>
    </footer>
  );
}
