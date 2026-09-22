import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { companyInfo } from "../data/catalogue";
import { TradeGate } from "../components/TradeGate";
import {
  EmptyState,
  Notice,
  PageHeader,
  PriceLock,
  ProductImage,
  Section,
  buttonClass,
} from "../components/ui";
import { fullName, useAuth } from "../lib/auth";
import { cart, priceCart, useCartLines } from "../lib/cart";
import { formatMoney, piecesPerUnit, pricePerPiece, useProducts } from "../lib/products";
import { createOrder, payForOrder, type CustomerDetails } from "../lib/orders";
import { useTradeAccess } from "../lib/trade";
import { isPaymentConfigured, isSupabaseConfigured } from "../lib/supabase";

type Errors = Partial<Record<"name" | "contact", string>>;

const emptyDetails: CustomerDetails = {
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
  notes: "",
};

const fieldClass =
  "rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand";

function validate(details: CustomerDetails): Errors {
  const errors: Errors = {};
  if (!details.name.trim()) errors.name = "Tell us who you are.";

  const email = details.email.trim();
  const digits = details.phone.replace(/\D/g, "");
  if (!email && !digits) {
    errors.contact = "Add an email address or a phone number so we can reply.";
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.contact = "That email address looks incomplete.";
  } else if (!email && digits.length < 8) {
    errors.contact = "That phone number looks too short.";
  }
  return errors;
}

export function CartPage() {
  const lines = useCartLines();
  const { products } = useProducts();
  const { session } = useAuth();
  const { unlocked } = useTradeAccess();
  const [details, setDetails] = useState<CustomerDetails>(emptyDetails);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState<null | "enquiry" | "payment">(null);
  const [done, setDone] = useState<{ reference: string; paid: boolean } | null>(null);

  const totals = useMemo(() => priceCart(lines, products), [lines, products]);

  // A signed-in customer should not retype what their account already knows.
  // Only empty fields are filled, so anything they have edited survives.
  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    setDetails((d) => ({
      ...d,
      name: d.name || fullName(user),
      email: d.email || user.email || "",
    }));
  }, [session]);

  const set = <K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const guard = () => {
    const next = validate(details);
    setErrors(next);
    if (Object.keys(next).length) {
      setStatus("Please fix the highlighted fields.");
      return false;
    }
    return true;
  };

  /**
   * Sends the order to the office.
   *
   * Recording it is the delivery — it lands in the admin dashboard and
   * nowhere else — so a failure has to be shown. Nothing here may report
   * success unless the row is actually saved.
   */
  const submitEnquiry = async () => {
    if (!guard()) return;
    setBusy("enquiry");
    setStatus("Sending your order…");

    try {
      const order = await createOrder(details, totals, "enquiry");
      setDone({ reference: order.reference, paid: false });
      cart.clear();
    } catch (err) {
      console.error("Could not record the order:", err);
      setStatus("Sorry — that didn’t send. Please try again in a moment.");
    } finally {
      setBusy(null);
    }
  };

  const payNow = async () => {
    if (!guard()) return;
    setBusy("payment");
    setStatus("Starting secure payment…");
    try {
      const order = await createOrder(details, totals, "payment");
      const result = await payForOrder(order, details);
      if (result.status === "paid") {
        setDone({ reference: order.reference, paid: true });
        cart.clear();
      } else {
        setStatus(`Payment cancelled. Your order ${order.reference} is saved — you can pay or send it as an enquiry.`);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Payment could not be started.");
    } finally {
      setBusy(null);
    }
  };

  if (done) {
    return (
      <>
        <PageHeader
          kicker={done.paid ? "Payment received" : "Order sent"}
          title={done.paid ? "Thank you — that's paid." : "Thank you — that's with us."}
          intro={
            done.paid
              ? "We've got your payment and your order. A confirmation is on its way, and we'll be in touch about dispatch."
              : "We've logged your order and we'll come back with pricing, MOQs and lead times."
          }
          tone="dim"
        />
        <Section className="bg-paper pt-10 md:pt-14">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-8">
            <p className="text-xs uppercase tracking-wider text-ink-soft/70">Your reference</p>
            <p className="font-display mt-1 text-3xl font-semibold text-ink">{done.reference}</p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
              Quote this reference when you get in touch. Any questions in the meantime:{" "}
              <a href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`} className="font-medium text-brand hover:underline">
                {companyInfo.phone}
              </a>{" "}
              or{" "}
              <a href={`mailto:${companyInfo.email}`} className="font-medium text-brand hover:underline">
                {companyInfo.email}
              </a>
              .
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={buttonClass("primary")}>
                Back to the shop
              </Link>
              <Link to="/" className={buttonClass("outline")}>
                Home
              </Link>
            </div>
          </div>
        </Section>
      </>
    );
  }

  if (totals.itemCount === 0) {
    return (
      <>
        <PageHeader kicker="Your order" title="Nothing on your order yet." tone="dim" />
        <Section className="bg-paper pt-10 md:pt-14">
          <EmptyState
            title="Your order is empty"
            body="Browse the shop to add cases at current prices, or search the full catalogue by product code."
          >
            <Link to="/shop" className={buttonClass("primary")}>
              Go to the shop
            </Link>
            <Link to="/products" className={buttonClass("outline")}>
              Browse the range
            </Link>
          </EmptyState>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Your order"
        title={`${totals.caseCount} ${totals.caseCount === 1 ? "case" : "cases"}, ${
          totals.itemCount
        } ${totals.itemCount === 1 ? "product" : "products"}.`}
        intro="Adjust quantities, then either send this across as an enquiry or pay for it online."
        tone="dim"
      />

      <Section className="bg-paper pt-10 md:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          {/* -------------------------------------------------- line items */}
          <div>
            <ul className="flex flex-col gap-4">
              {totals.lines.map((l) => (
                <li
                  key={l.product.code}
                  className="flex gap-4 rounded-3xl border border-ink/10 bg-white/70 p-4"
                >
                  <Link to={`/shop/${encodeURIComponent(l.product.code)}`} className="w-24 shrink-0">
                    <ProductImage src={l.product.images[0]} alt={l.product.name} />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-semibold text-brand-dark">
                          {l.product.code}
                        </p>
                        <Link
                          to={`/shop/${encodeURIComponent(l.product.code)}`}
                          className="font-display text-base font-medium text-ink hover:text-brand"
                        >
                          {l.product.name}
                        </Link>
                        <p className="text-xs text-ink-soft">
                          {[l.product.size, `case of ${l.product.casePack}`, l.product.material]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(l.product.code)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-brand"
                      >
                        <span className="sr-only">Remove {l.product.code}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center overflow-hidden rounded-full border border-ink/15">
                        <button
                          type="button"
                          onClick={() => cart.setQuantity(l.product.code, l.quantity - 1)}
                          className="grid h-9 w-9 place-items-center text-ink transition hover:bg-ink/5"
                        >
                          <span className="sr-only">One case fewer of {l.product.code}</span>
                          <span aria-hidden="true">−</span>
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) =>
                            cart.setQuantity(
                              l.product.code,
                              Number.parseInt(e.target.value, 10) || 0
                            )
                          }
                          aria-label={`Cases of ${l.product.code}`}
                          className="w-12 border-0 bg-transparent py-1.5 text-center text-sm font-semibold text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => cart.setQuantity(l.product.code, l.quantity + 1)}
                          className="grid h-9 w-9 place-items-center text-ink transition hover:bg-ink/5"
                        >
                          <span className="sr-only">One case more of {l.product.code}</span>
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>

                      <div className="text-right">
                        {l.unitPrice === null ? (
                          <p className="text-sm font-medium text-ink-soft">Price on request</p>
                        ) : !unlocked ? (
                          <PriceLock size="sm" />
                        ) : (
                          <>
                            <p className="font-display text-lg font-semibold text-ink">
                              {formatMoney(l.lineTotal, l.product.currency)}
                            </p>
                            <p className="text-[11px] text-ink-soft">
                              {formatMoney(l.unitPrice, l.product.currency)} / {l.product.priceUnit}
                              {piecesPerUnit(l.product) > 1 && (
                                <>
                                  {" · "}
                                  {formatMoney(pricePerPiece(l.product) ?? 0, l.product.currency)} /
                                  piece
                                </>
                              )}
                              {l.savings > 0 && (
                                <span className="ml-1 font-semibold text-brand">
                                  saves {formatMoney(l.savings, l.product.currency)}
                                </span>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className={buttonClass("outline")}>
                Add more products
              </Link>
              <button type="button" onClick={() => cart.clear()} className={buttonClass("quiet")}>
                Clear order
              </button>
            </div>
          </div>

          {/* ------------------------------------------------ totals + form */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5">
              <h2 className="font-display text-xl font-medium text-ink">Summary</h2>

              <dl className="mt-5 flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Contents</dt>
                  <dd className="font-medium text-ink">
                    {totals.caseCount} {totals.caseCount === 1 ? "case" : "cases"} ·{" "}
                    {totals.pieceCount.toLocaleString("en-IN")} pieces
                  </dd>
                </div>
                {totals.weightKg !== null && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Gross weight</dt>
                    <dd className="font-medium text-ink">
                      {totals.weightPartial ? "from " : ""}
                      {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(
                        totals.weightKg
                      )}{" "}
                      kg
                    </dd>
                  </div>
                )}
                {unlocked ? (
                  <>
                    <div className="mt-1 flex justify-between border-t border-ink/10 pt-3">
                      <dt className="text-ink-soft">Subtotal</dt>
                      <dd className="font-medium text-ink">
                        {formatMoney(totals.subtotal, totals.currency)}
                      </dd>
                    </div>
                    {totals.discountTotal > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-ink-soft">Discount</dt>
                        <dd className="font-semibold text-brand">
                          − {formatMoney(totals.discountTotal, totals.currency)}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">GST</dt>
                      <dd className="font-medium text-ink">
                        {formatMoney(totals.taxTotal, totals.currency)}
                      </dd>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-ink/10 pt-3">
                      <dt className="font-display text-base font-medium text-ink">Total</dt>
                      <dd className="font-display text-xl font-semibold text-ink">
                        {formatMoney(totals.total, totals.currency)}
                      </dd>
                    </div>
                  </>
                ) : (
                  // An order can still be sent as an enquiry without an
                  // account — what a signed-out visitor cannot do is see the
                  // trade total, or pay it.
                  <div className="mt-3 border-t border-ink/10 pt-4">
                    <TradeGate compact />
                    <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                      You can still send this list over as an enquiry and we&apos;ll come
                      back with a quote.
                    </p>
                  </div>
                )}
              </dl>

              {unlocked && totals.quoteOnly.length > 0 && (
                <div className="mt-5">
                  <Notice tone="warn">
                    {totals.quoteOnly.length}{" "}
                    {totals.quoteOnly.length === 1 ? "product is" : "products are"}{" "}
                    price-on-request, so {totals.quoteOnly.length === 1 ? "it is" : "they are"} not
                    in this total. Send the order as an enquiry and we&apos;ll price{" "}
                    {totals.quoteOnly.length === 1 ? "it" : "them"}.
                  </Notice>
                </div>
              )}

              <p className="mt-4 text-xs leading-relaxed text-ink-soft">
                Delivery is quoted separately once we know the destination and volume.
                {totals.weightPartial
                  ? " The weight above covers only the lines we hold packing data for."
                  : ""}
              </p>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5">
              <h2 className="font-display text-xl font-medium text-ink">Your details</h2>

              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-name" className="text-sm font-medium text-ink">
                    Name
                  </label>
                  <input
                    id="cart-name"
                    value={details.name}
                    onChange={(e) => set("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "cart-name-error" : undefined}
                    className={`${fieldClass} ${errors.name ? "border-brand" : ""}`}
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p id="cart-name-error" className="text-xs font-medium text-brand">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-company" className="text-sm font-medium text-ink">
                    Company <span className="font-normal text-ink-soft/70">(optional)</span>
                  </label>
                  <input
                    id="cart-company"
                    value={details.company}
                    onChange={(e) => set("company", e.target.value)}
                    className={fieldClass}
                    placeholder="Business / organisation"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cart-email" className="text-sm font-medium text-ink">
                      Email
                    </label>
                    <input
                      id="cart-email"
                      type="email"
                      value={details.email}
                      onChange={(e) => set("email", e.target.value)}
                      aria-invalid={!!errors.contact}
                      className={`${fieldClass} ${errors.contact ? "border-brand" : ""}`}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cart-phone" className="text-sm font-medium text-ink">
                      Phone
                    </label>
                    <input
                      id="cart-phone"
                      type="tel"
                      value={details.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      aria-invalid={!!errors.contact}
                      className={`${fieldClass} ${errors.contact ? "border-brand" : ""}`}
                      placeholder="+91…"
                    />
                  </div>
                </div>
                {errors.contact && (
                  <p className="text-xs font-medium text-brand">{errors.contact}</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-city" className="text-sm font-medium text-ink">
                    Delivery city <span className="font-normal text-ink-soft/70">(optional)</span>
                  </label>
                  <input
                    id="cart-city"
                    value={details.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={fieldClass}
                    placeholder="Where should it ship?"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-notes" className="text-sm font-medium text-ink">
                    Notes <span className="font-normal text-ink-soft/70">(optional)</span>
                  </label>
                  <textarea
                    id="cart-notes"
                    rows={3}
                    value={details.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    className={`resize-y ${fieldClass}`}
                    placeholder="Colourways, lead time, anything else"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                {isPaymentConfigured && totals.payable && unlocked && (
                  <button
                    type="button"
                    onClick={payNow}
                    disabled={busy !== null}
                    className={buttonClass("primary", "w-full !py-3.5")}
                  >
                    {busy === "payment"
                      ? "Opening payment…"
                      : `Pay ${formatMoney(totals.total, totals.currency)} online`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={submitEnquiry}
                  disabled={busy !== null || !isSupabaseConfigured}
                  className={buttonClass(
                    isPaymentConfigured && totals.payable && unlocked ? "outline" : "primary",
                    "w-full !py-3.5"
                  )}
                >
                  {busy === "enquiry" ? "Sending…" : "Send as enquiry"}
                </button>
              </div>

              <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-center text-xs text-ink-soft">
                {status ||
                  (isPaymentConfigured && totals.payable && unlocked
                    ? "Card, UPI and netbanking via Razorpay. Payments are verified on our server."
                    : "Sent straight to our team — we usually reply within one working day.")}
              </p>

              {!isSupabaseConfigured && (
                <p className="mt-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-center text-[11px] text-amber-900">
                  The order desk isn&apos;t connected yet, so this can&apos;t send. Please call{" "}
                  <a
                    href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`}
                    className="font-semibold underline underline-offset-2"
                  >
                    {companyInfo.phone}
                  </a>{" "}
                  in the meantime.
                </p>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
