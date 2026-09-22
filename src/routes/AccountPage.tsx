import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { avatarUrl, displayName, signOut, useAuth } from "../lib/auth";
import { useTier } from "../lib/tier";
import { formatMoney } from "../lib/products";
import { ENQUIRY_STATUS_COPY, useMyActivity, type MyEnquiry } from "../lib/account";
import { isSupabaseConfigured } from "../lib/supabase";
import { loginHref } from "../lib/trade";
import {
  Badge,
  EmptyState,
  Eyebrow,
  Notice,
  PageHeader,
  Section,
  Spinner,
  buttonClass,
} from "../components/ui";

const STATUS_TONE: Record<string, "good" | "brand" | "warn" | "neutral"> = {
  new: "brand",
  quoted: "warn",
  replied: "neutral",
  won: "good",
  closed: "neutral",
};

const ORDER_STATUS_TONE: Record<string, "good" | "brand" | "warn" | "neutral"> = {
  paid: "good",
  pending: "warn",
  quoted: "brand",
  failed: "neutral",
  cancelled: "neutral",
};

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * A quote, as the person who asked for it sees it.
 *
 * The figure is the point of the card, so it is the largest thing on it. The
 * note the office wrote sits under it verbatim — an office that took the
 * trouble to explain its MOQ should have that explanation reach the buyer, not
 * a summary of it.
 */
function EnquiryCard({ enquiry }: { enquiry: MyEnquiry }) {
  const copy = ENQUIRY_STATUS_COPY[enquiry.status] ?? ENQUIRY_STATUS_COPY.new;
  const amount =
    enquiry.quoted_amount === null || enquiry.quoted_amount === undefined
      ? null
      : Number(enquiry.quoted_amount);
  const quoted = enquiry.quoted_at !== null;

  return (
    <li className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/8 px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold text-brand-dark">
            {enquiry.reference}
          </p>
          <p className="mt-0.5 text-sm font-medium text-ink">
            {enquiry.interest ?? "General enquiry"}
            {enquiry.quantity ? ` · ${enquiry.quantity}` : ""}
          </p>
          <p className="text-xs text-ink-soft">Sent {when(enquiry.created_at)}</p>
        </div>
        <Badge tone={STATUS_TONE[enquiry.status] ?? "neutral"}>{copy.label}</Badge>
      </div>

      <div className="px-5 py-5">
        <p className="text-sm leading-relaxed text-ink-soft">{copy.blurb}</p>

        {quoted && (
          <div className="mt-4 rounded-2xl border border-brand/20 bg-brand-tint px-5 py-4">
            <Eyebrow>Your quote</Eyebrow>
            {amount !== null ? (
              <p className="font-display mt-2.5 text-3xl font-semibold text-ink">
                {formatMoney(amount, enquiry.quoted_currency ?? "INR")}
              </p>
            ) : (
              <p className="font-display mt-2.5 text-lg font-medium text-ink">
                Priced — see the note below.
              </p>
            )}
            {enquiry.quote_notes && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                {enquiry.quote_notes}
              </p>
            )}
            {enquiry.granted_tier && (
              <p className="mt-3 text-xs font-semibold text-brand-dark">
                We&apos;ve put your account on a trade band — prices across the site now
                show your rate.
              </p>
            )}
            <p className="mt-4 text-[11px] text-ink-soft">
              Quoted {when(enquiry.quoted_at!)}. Quote us{" "}
              <span className="font-mono font-semibold">{enquiry.reference}</span> when you
              come back to us.
            </p>
          </div>
        )}

        {enquiry.message && (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft/60">
              What you asked
            </p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {enquiry.message}
            </p>
          </div>
        )}

        {(enquiry.product_codes?.length ?? 0) > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {enquiry.product_codes?.map((code) => (
              <li key={code}>
                <Link
                  to={`/shop/${encodeURIComponent(code)}`}
                  className="inline-block rounded-full border border-ink/12 bg-paper-dim/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-dark transition hover:border-brand"
                >
                  {code}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Everything the business has said to this customer, in one place.
 *
 * Before this page a quote lived entirely inside the dashboard: an admin could
 * price an enquiry and the person who asked for it had no way to read the
 * answer. The two RLS policies that make this possible are in `schema.sql`
 * under "what a customer can read back".
 */
export function AccountPage() {
  const { session, isAdmin, loading: authLoading } = useAuth();
  const { tier } = useTier();
  const navigate = useNavigate();
  const signedIn = Boolean(session);
  const { enquiries, orders, items, loading, error } = useMyActivity(signedIn);

  useEffect(() => {
    document.title = "Your account | Ruskav";
  }, []);

  // Somebody who lands here signed out wants the sign-in page, not a lecture.
  useEffect(() => {
    if (!authLoading && !signedIn) {
      navigate(loginHref("/account"), { replace: true });
    }
  }, [authLoading, signedIn, navigate]);

  if (!isSupabaseConfigured) {
    return (
      <Section className="bg-paper pt-32">
        <Notice tone="warn">
          Accounts aren&apos;t connected yet. See <code className="font-mono">README.md</code>.
        </Notice>
      </Section>
    );
  }

  if (authLoading || !session) return <Spinner label="Opening your account" />;

  const user = session.user;
  const avatar = avatarUrl(user);
  const quotedCount = enquiries.filter((e) => e.quoted_at !== null).length;

  return (
    <>
      <PageHeader
        kicker="Your account"
        title={`Hello, ${displayName(user).split(" ")[0] || "there"}.`}
        intro={
          quotedCount > 0
            ? `You have ${quotedCount} ${quotedCount === 1 ? "quote" : "quotes"} waiting below, along with everything else you've sent us.`
            : "Your quote requests and orders live here, with our answers against them."
        }
        tone="dim"
      >
        <div className="flex flex-wrap items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={44}
              height={44}
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : null}
          <div>
            <p className="text-sm font-semibold text-ink">{displayName(user)}</p>
            <p className="text-xs text-ink-soft">{user.email}</p>
          </div>
          <span className="ml-1 rounded-full border border-brand/25 bg-brand-tint px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-dark">
            {tier.label}
            {tier.discountPercent > 0 ? ` · ${tier.discountPercent}% off list` : ""}
          </span>
        </div>
      </PageHeader>

      <Section className="bg-paper pt-10 md:pt-14">
        {error && (
          <div className="mb-8">
            <Notice tone="warn">
              Some of your history couldn&apos;t be loaded. If this is a fresh install, the
              account policies in <code className="font-mono text-xs">schema.sql</code> may
              not have been applied yet.
            </Notice>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>Quote requests</Eyebrow>
            <h2 className="font-display mt-3 text-2xl font-medium text-ink">
              What you&apos;ve asked us
            </h2>

            {loading ? (
              <Spinner label="Loading your requests" />
            ) : enquiries.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="Nothing here yet"
                  body="Ask us to price a format and it'll appear here with our answer against it. Requests you sent before signing in stay between you and our team — we'll reply to those by email."
                >
                  <Link to="/contact" className={buttonClass("primary")}>
                    Request a quote
                  </Link>
                  <Link to="/shop" className={buttonClass("outline")}>
                    Browse the shop
                  </Link>
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-6 flex flex-col gap-4">
                {enquiries.map((e) => (
                  <EnquiryCard key={e.id} enquiry={e} />
                ))}
              </ul>
            )}
          </div>

          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <Eyebrow>Orders</Eyebrow>
            <h2 className="font-display mt-3 text-2xl font-medium text-ink">
              What you&apos;ve sent through
            </h2>

            {loading ? null : orders.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-ink/15 px-5 py-8 text-center text-sm text-ink-soft">
                No orders yet. Anything you build in the shop and send us shows up here.
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3">
                {orders.map((o) => {
                  const lines = items.filter((i) => i.order_id === o.id);
                  return (
                    <li
                      key={o.id}
                      className="rounded-2xl border border-ink/10 bg-white px-5 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] font-semibold text-brand-dark">
                            {o.reference}
                          </p>
                          <p className="text-xs text-ink-soft">{when(o.created_at)}</p>
                        </div>
                        <Badge tone={ORDER_STATUS_TONE[o.status] ?? "neutral"}>
                          {o.kind === "enquiry" && o.status === "pending"
                            ? "Awaiting quote"
                            : o.status}
                        </Badge>
                      </div>

                      {lines.length > 0 && (
                        <ul className="mt-3 flex flex-col gap-1 text-xs text-ink-soft">
                          {lines.slice(0, 4).map((l) => (
                            <li key={l.product_code} className="flex justify-between gap-3">
                              <span className="truncate">
                                {l.quantity} × {l.product_name}
                              </span>
                              <span className="shrink-0 font-mono text-[11px]">
                                {l.product_code}
                              </span>
                            </li>
                          ))}
                          {lines.length > 4 && (
                            <li className="text-ink-soft/70">
                              and {lines.length - 4} more
                            </li>
                          )}
                        </ul>
                      )}

                      {Number(o.total ?? 0) > 0 && (
                        <p className="font-display mt-3 border-t border-ink/8 pt-3 text-lg font-semibold text-ink">
                          {formatMoney(Number(o.total), o.currency)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-8 rounded-2xl border border-ink/10 bg-paper-dim/60 p-5">
              <p className="text-sm font-semibold text-ink">Your trade band</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                You&apos;re on <strong className="font-semibold text-ink">{tier.label}</strong>
                {tier.discountPercent > 0
                  ? `, which takes ${tier.discountPercent}% off every list price you see.`
                  : ", which is our list price. Ordering in volume? Ask us about a dealer band."}
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-block text-[11px] font-bold uppercase tracking-wider text-brand transition hover:underline"
              >
                Ask about your band →
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {isAdmin && (
                <Link to="/admin" className={buttonClass("outline")}>
                  Admin dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => void signOut()}
                className={buttonClass("quiet")}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
