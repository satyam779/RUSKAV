import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { categories, bioCategory, companyInfo } from "../data/catalogue";
import { Link } from "react-router-dom";
import { fullName, useAuth } from "../lib/auth";
import { cart, priceCart, useCartLines } from "../lib/cart";
import { useProducts } from "../lib/products";
import { useTier } from "../lib/tier";
import {
  BUSINESS_TYPES,
  createEnquiry,
  TIER_REQUESTS,
  TIMELINES,
} from "../lib/enquiries";
import { isSupabaseConfigured } from "../lib/supabase";

const interests = [...categories.map((c) => c.shortName), bioCategory.shortName, "General enquiry"];

type Errors = Partial<Record<"name" | "contact", string>>;

/**
 * Accepts either an email address or a phone number, since the field takes
 * both. Deliberately loose — the point is to catch a typo or an empty-ish
 * value, not to adjudicate what a valid Indian landline looks like.
 */
function validateContact(value: string) {
  const v = value.trim();
  if (!v) return "Add an email address or phone number so we can reply.";
  if (v.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? undefined : "That email address looks incomplete.";
  }
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 ? undefined : "That phone number looks too short.";
}

const fieldClass =
  "w-full rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand";
const errorFieldClass = "border-brand bg-brand/[0.03]";

/** A labelled control. The form has fourteen of them now; this is the shape. */
function Field({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-soft/70"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-brand">
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] leading-relaxed text-ink-soft/80">{hint}</p>
      )}
    </div>
  );
}

export function Contact() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [interest, setInterest] = useState(interests[0]);
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [gstin, setGstin] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [timeline, setTimeline] = useState("");
  const [tierRequested, setTierRequested] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Five fields are enough to answer. The rest sharpen the answer, so they are
  // offered rather than demanded — a quote form long enough to feel like an
  // application is one people abandon.
  const [showDetail, setShowDetail] = useState(false);

  const { session } = useAuth();
  const cartLines = useCartLines();
  const { products } = useProducts();
  const { tier } = useTier();
  const totals = priceCart(cartLines, products, tier.discountPercent);
  const items = totals.lines.map((l) => l.product);

  // Prefill from the account, without overwriting anything already typed.
  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    setName((v) => v || fullName(user));
    setContact((v) => v || user.email || "");
  }, [session]);

  const validate = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = "Tell us who you are.";
    const contactError = validateContact(contact);
    if (contactError) next.contact = contactError;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Clears the confirmation and the fields, ready for a second enquiry. */
  const sendAnother = () => {
    setReference(null);
    setName("");
    setCompany("");
    setContact("");
    setCity("");
    setStateName("");
    setGstin("");
    setBusinessType("");
    setQuantity("");
    setTimeline("");
    setTierRequested("");
    setMessage("");
    setStatus("");
  };

  /**
   * Sends the enquiry straight into the admin dashboard.
   *
   * There is no mail-client or WhatsApp handoff behind this: the database row
   * IS the delivery, so a failure has to be shown rather than logged and
   * hidden — otherwise the visitor walks away believing they got in touch.
   */
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStatus("Please fix the highlighted fields.");
      return;
    }
    setSending(true);
    setStatus("Sending…");
    try {
      const saved = await createEnquiry({
        name,
        company,
        contactRaw: contact,
        interest,
        message,
        productCodes: items.map((p) => p.code),
        city,
        state: stateName,
        gstin,
        businessType,
        quantity,
        timeline,
        tierRequested,
      });
      setReference(saved.reference);
      setStatus("");
    } catch (err) {
      console.error("Could not record the enquiry:", err);
      setStatus("Sorry — that didn’t send. Please try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="scroll-mt-[calc(var(--header-h)+1rem)] bg-paper-dim py-14 sm:py-20 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] text-brand">Get in touch</p>
            <h2 className="font-display mt-4 text-balance text-4xl font-medium leading-[1.08] text-ink md:text-5xl">
              Ask us for a price.
            </h2>
            <p className="mt-5 max-w-sm text-balance leading-relaxed text-ink-soft">
              Tell us what you&apos;re serving and how much of it — we&apos;ll get back with
              specifications, MOQs and pricing.
            </p>

            <div className="mt-10 flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

              <a
                href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`}
                className="group flex items-center gap-4"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

              <a href={`mailto:${companyInfo.email}`} className="group flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="m3 5.5 7 5.5 7-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <p className="font-medium text-ink transition group-hover:text-brand">{companyInfo.email}</p>
              </a>
            </div>
          </motion.div>

          {reference ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="rounded-[2rem] bg-white p-7 shadow-xl shadow-ink/5 md:p-9"
            >
              <p className="eyebrow-rule text-[11px] font-bold uppercase tracking-[0.3em] text-brand">
                Quote request received
              </p>
              <h3 className="font-display mt-4 text-3xl font-medium text-ink">
                Thank you — that&apos;s with us.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
                It is in front of our team now. We&apos;ll come back with specifications, MOQs
                and a price against this reference — and if you asked to be set up as a
                dealer, with the band we can put you on.
              </p>
              {session ? (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                  The quote will appear in{" "}
                  <Link
                    to="/account"
                    className="font-semibold text-brand underline-offset-2 hover:underline"
                  >
                    your account
                  </Link>{" "}
                  as soon as we&apos;ve priced it, and we&apos;ll reply to you directly too.
                </p>
              ) : (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                  We&apos;ll reply to the address you gave us.{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-brand underline-offset-2 hover:underline"
                  >
                    Create an account
                  </Link>{" "}
                  and future quotes land in it, where you can read them back any time.
                </p>
              )}
              <div className="mt-7 rounded-2xl bg-brand/[0.05] px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-ink-soft/70">Your reference</p>
                <p className="font-display mt-1 text-2xl font-semibold text-brand-dark">
                  {reference}
                </p>
              </div>
              <button
                type="button"
                onClick={sendAnother}
                className="mt-7 text-sm font-semibold text-brand underline-offset-4 transition hover:underline"
              >
                Send another enquiry
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              onSubmit={submit}
              noValidate
              className="rounded-[2rem] bg-white p-7 shadow-xl shadow-ink/5 md:p-9"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="enq-name" label="Name" error={errors.name}>
                  <input
                    id="enq-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "enq-name-error" : undefined}
                    className={`${fieldClass} ${errors.name ? errorFieldClass : ""}`}
                    placeholder="Your name"
                  />
                </Field>

                <Field id="enq-company" label="Company" optional>
                  <input
                    id="enq-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={fieldClass}
                    placeholder="Business / organisation"
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Field id="enq-contact" label="Email or phone" error={errors.contact}>
                  <input
                    id="enq-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    aria-invalid={!!errors.contact}
                    aria-describedby={errors.contact ? "enq-contact-error" : undefined}
                    className={`${fieldClass} ${errors.contact ? errorFieldClass : ""}`}
                    placeholder="How should we reach you?"
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field id="enq-interest" label="Interested in">
                  <select
                    id="enq-interest"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className={fieldClass}
                  >
                    {interests.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="enq-quantity" label="Roughly how much" optional>
                  <input
                    id="enq-quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={fieldClass}
                    placeholder="About 40 cases a month"
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Field id="enq-message" label="What you need" optional>
                  <textarea
                    id="enq-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className={`resize-y ${fieldClass}`}
                    placeholder="Sizes, colourways, delivery city, anything else we should know…"
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-2xl border border-ink/10 bg-paper-dim/50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowDetail((v) => !v)}
                  aria-expanded={showDetail}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {showDetail ? "Extra detail" : "Add a few more details"}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      Optional — but it gets you a firm price instead of a range.
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-brand transition-transform ${
                      showDetail ? "rotate-180" : ""
                    }`}
                  >
                    &#9662;
                  </span>
                </button>
              </div>

              {showDetail && (
                <>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field id="enq-city" label="Delivery city" optional>
                  <input
                    id="enq-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                    className={fieldClass}
                    placeholder="Bangalore"
                  />
                </Field>

                <Field id="enq-state" label="State" optional>
                  <input
                    id="enq-state"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    autoComplete="address-level1"
                    className={fieldClass}
                    placeholder="Karnataka"
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field id="enq-business" label="Type of business" optional>
                  <select
                    id="enq-business"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className={fieldClass}
                  >
                    {BUSINESS_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  id="enq-gstin"
                  label="GSTIN"
                  optional
                  hint="Speeds up a formal quote. Leave it blank if you don't have one."
                >
                  <input
                    id="enq-gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className={`${fieldClass} font-mono uppercase`}
                    placeholder="29AAAAA0000A1Z5"
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field id="enq-timeline" label="When you need it" optional>
                  <select
                    id="enq-timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className={fieldClass}
                  >
                    {TIMELINES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  id="enq-tier"
                  label="How you'd buy"
                  optional
                  hint="Decides which trade band we quote you on."
                >
                  <select
                    id="enq-tier"
                    value={tierRequested}
                    onChange={(e) => setTierRequested(e.target.value)}
                    className={fieldClass}
                  >
                    {TIER_REQUESTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
                </>
              )}

              {items.length > 0 && (
                <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      {items.length} {items.length === 1 ? "product" : "products"} attached
                    </p>
                    <button
                      type="button"
                      onClick={() => cart.clear()}
                      className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft transition hover:text-brand"
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {items.map((p) => (
                      <li key={p.code}>
                        <button
                          type="button"
                          onClick={() => cart.remove(p.code)}
                          title={`${p.name} · ${p.size}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-dark transition hover:border-brand"
                        >
                          {p.code}
                          <span className="sr-only">Remove from enquiry</span>
                          <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true" className="text-ink-soft">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-ink-soft">
                    These codes are included in your message. Add more from the{" "}
                    <Link to="/shop" className="font-medium text-brand underline-offset-2 hover:underline">
                      shop
                    </Link>
                    .
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-6 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending…" : "Request a quote"}
              </button>

              <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-center text-xs text-ink-soft">
                {status ||
                  "Goes straight to our team — we usually come back with pricing within one working day."}
              </p>

              {!isSupabaseConfigured && (
                <p className="mt-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-center text-xs text-amber-900">
                  The enquiry desk isn&apos;t connected yet, so this form can&apos;t send. Please call{" "}
                  <a
                    href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`}
                    className="font-semibold underline underline-offset-2"
                  >
                    {companyInfo.phone}
                  </a>{" "}
                  in the meantime.
                </p>
              )}
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}
