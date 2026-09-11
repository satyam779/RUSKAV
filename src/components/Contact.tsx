import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { categories, bioCategory, companyInfo } from "../data/catalogue";

const interests = [...categories.map((c) => c.shortName), bioCategory.shortName, "General enquiry"];

export function Contact() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [interest, setInterest] = useState(interests[0]);
  const [message, setMessage] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Enquiry: ${interest}${company ? ` — ${company}` : ""}`;
    const bodyLines = [
      `Name: ${name}`,
      company && `Company: ${company}`,
      `Contact: ${emailOrPhone}`,
      `Interested in: ${interest}`,
      "",
      message,
    ].filter(Boolean);
    const url = `mailto:${companyInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyLines.join("\n")
    )}`;
    window.location.href = url;
  };

  return (
    <section id="contact" className="scroll-mt-20 bg-paper-dim py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">Get in touch</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-medium leading-[1.08] text-ink md:text-5xl">
              Distributor &amp; dealer enquiries welcome.
            </h2>
            <p className="mt-5 max-w-sm text-balance leading-relaxed text-ink-soft">
              Tell us what you're serving and how much of it — we'll get back with
              specifications, MOQs and pricing.
            </p>

            <div className="mt-10 flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <circle cx="10" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium text-ink">{companyInfo.name}</p>
                  <p className="text-sm text-ink-soft">
                    {companyInfo.addressLines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              <a href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`} className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 3h3l1.5 4L6.5 8.5a10 10 0 0 0 5 5L13 11.5l4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A14 14 0 0 1 3.5 4.6 1.5 1.5 0 0 1 4 3Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="font-medium text-ink transition group-hover:text-brand">{companyInfo.phone}</p>
              </a>

              <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="m3 5.5 7 5.5 7-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <p className="font-medium text-ink">{companyInfo.email}</p>
              </a>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            onSubmit={submit}
            className="rounded-[2rem] bg-white p-7 shadow-xl shadow-ink/5 md:p-9"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
                  placeholder="Your name"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Company
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
                  placeholder="Business / organisation"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-ink">
              Email or phone
              <input
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
                placeholder="How should we reach you?"
              />
            </label>

            <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-ink">
              Interested in
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
              >
                {interests.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-ink">
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
                placeholder="Quantities, formats, delivery city…"
              />
            </label>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark"
            >
              Send enquiry
            </button>
            <p className="mt-3 text-center text-xs text-ink-soft/70">Opens your email app, addressed to {companyInfo.email}</p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
