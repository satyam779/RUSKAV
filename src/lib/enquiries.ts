import { requireSupabase } from "./supabase";

export type EnquiryInput = {
  name: string;
  company: string;
  /** Exactly what the visitor typed — the field accepts either form. */
  contactRaw: string;
  interest: string;
  message: string;
  productCodes: string[];

  /** What a quote is actually built from. All optional — an enquiry that only
   *  says "tell me about your trays" is still a lead worth having. */
  city: string;
  state: string;
  gstin: string;
  businessType: string;
  quantity: string;
  timeline: string;
  /** Which trade band they are asking to be put on, if any. */
  tierRequested: string;
};

export const BUSINESS_TYPES = [
  { value: "", label: "Select…" },
  { value: "distributor", label: "Distributor" },
  { value: "dealer", label: "Dealer / reseller" },
  { value: "institution", label: "School, college or hospital" },
  { value: "horeca", label: "Hotel, restaurant or caterer" },
  { value: "corporate", label: "Corporate or industrial canteen" },
  { value: "other", label: "Something else" },
] as const;

export const TIMELINES = [
  { value: "", label: "Select…" },
  { value: "immediate", label: "Ready to order now" },
  { value: "1_month", label: "Within a month" },
  { value: "3_months", label: "Within three months" },
  { value: "planning", label: "Planning / budgeting" },
] as const;

export const TIER_REQUESTS = [
  { value: "", label: "Not sure — advise me" },
  { value: "regular", label: "One-off purchase" },
  { value: "dealer_c", label: "Occasional trade buyer" },
  { value: "dealer_b", label: "Regular dealer, ordering in volume" },
  { value: "dealer_a", label: "Appointed distributor" },
] as const;

/** Labels for the dashboard, so it never prints a raw enum at an admin. */
const byValue = (list: readonly { value: string; label: string }[]) =>
  new Map(list.filter((o) => o.value).map((o) => [o.value, o.label]));

export const BUSINESS_TYPE_LABEL = byValue(BUSINESS_TYPES);
export const TIMELINE_LABEL = byValue(TIMELINES);
export const TIER_REQUEST_LABEL = byValue(TIER_REQUESTS);

export type SavedEnquiry = { reference: string };

/** A short reference the visitor and the office can quote at each other. */
function makeReference() {
  const now = new Date();
  const stamp = [
    now.getFullYear().toString().slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `RE-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Splits the single "email or phone" field into its two columns.
 *
 * One field is right for the visitor — being asked which one they have is
 * friction — but the office wants to sort and click them separately, so the
 * split happens here rather than being pushed onto the form.
 */
export function splitContact(raw: string) {
  const value = raw.trim();
  if (!value) return { email: null, phone: null };
  if (value.includes("@")) return { email: value, phone: null };

  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? { email: null, phone: value } : { email: null, phone: null };
}

/**
 * Records a contact-form enquiry so it shows up in the admin dashboard.
 *
 * The dashboard is the only place an enquiry goes — there is no mail client or
 * WhatsApp handoff behind it — so this must not swallow failures. It throws
 * when the database is unreachable or unconfigured, and the form tells the
 * visitor their message did not send rather than pretending it did.
 *
 * The insert deliberately does not ask for the row back. `enquiries` is
 * insert-for-anyone but select-for-admins, and a RETURNING clause is checked
 * against the SELECT policy — so reading it back would fail for the very
 * visitors the form exists for. The reference is minted here instead.
 */
export async function createEnquiry(input: EnquiryInput): Promise<SavedEnquiry> {
  const client = requireSupabase();

  const { email, phone } = splitContact(input.contactRaw);
  const reference = makeReference();

  // Attached to the account when the sender is signed in; row level security
  // will not accept anybody else's id.
  const { data: auth } = await client.auth.getSession();

  const { error } = await client
    .from("enquiries")
    .insert({
      reference,
      user_id: auth.session?.user.id ?? null,
      name: input.name.trim(),
      company: input.company.trim() || null,
      email,
      phone,
      contact_raw: input.contactRaw.trim() || null,
      interest: input.interest || null,
      message: input.message.trim() || null,
      product_codes: input.productCodes,

      city: input.city.trim() || null,
      state: input.state.trim() || null,
      // Normalised here rather than in the form: a GSTIN typed with spaces is
      // still a GSTIN, and the office should not have to squint at it.
      gstin: input.gstin.replace(/\s+/g, "").toUpperCase() || null,
      business_type: input.businessType || null,
      quantity: input.quantity.trim() || null,
      timeline: input.timeline || null,
      tier_requested: input.tierRequested || null,

      channel: "website",
      status: "new",
    });

  if (error) throw error;
  return { reference };
}
