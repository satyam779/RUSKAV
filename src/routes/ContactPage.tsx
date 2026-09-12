import { Contact } from "../components/Contact";
import { companyInfo } from "../data/catalogue";
import { PageHeader, Section, SectionHeading } from "../components/ui";

const faqs = [
  {
    q: "What are your minimum order quantities?",
    a: "Everything ships by the case, and case packs are listed against every product code — 25, 50 or 72 pieces depending on the line. For most items a single case is enough to start; larger programmes get tiered pricing.",
  },
  {
    q: "Can you make a size or colour that isn't in the catalogue?",
    a: "Usually, yes. Compartment layouts, tray sizes and colourways outside the listed range are routine for us since we tool and mould in-house. Tell us the format and the annual volume.",
  },
  {
    q: "Do you supply distributors and dealers?",
    a: "Distributor and dealer enquiries are welcome nationwide — that is most of our business. Get in touch with your territory and the sectors you serve.",
  },
  {
    q: "How do you quote delivery?",
    a: "Separately from product pricing, once we know the destination city and the volume. Freight on a pallet of trays differs enormously by route, so we would rather quote it accurately than pad the product price.",
  },
  {
    q: "Can we get samples before ordering?",
    a: "Yes. Samples of any listed line can be sent for evaluation — ask for the specific product codes you want to assess.",
  },
];

export function ContactPage() {
  return (
    <>
      <PageHeader
        kicker="Contact"
        title="Distributor & dealer enquiries welcome."
        intro="Tell us what you're serving and how much of it — we'll come back with specifications, MOQs and pricing."
        tone="dim"
      >
        <div className="flex flex-wrap gap-6 text-sm">
          <a
            href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`}
            className="font-semibold text-ink transition hover:text-brand"
          >
            {companyInfo.phone}
          </a>
          <a
            href={`mailto:${companyInfo.email}`}
            className="font-semibold text-ink transition hover:text-brand"
          >
            {companyInfo.email}
          </a>
          <a
            href={`https://wa.me/${companyInfo.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink transition hover:text-brand"
          >
            WhatsApp
          </a>
        </div>
      </PageHeader>

      <Contact />

      <Section className="bg-paper">
        <SectionHeading
          kicker="Before you ask"
          title="The questions we get most."
        />
        <dl className="grid gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="flex flex-col gap-2.5 bg-paper p-7">
              <dt className="font-display text-lg font-medium text-ink">{f.q}</dt>
              <dd className="text-sm leading-relaxed text-ink-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
