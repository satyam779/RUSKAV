import { requireSupabase } from "./supabase";

export type EnquiryInput = {
  name: string;
  company: string;
  /** Exactly what the visitor typed — the field accepts either form. */
  contactRaw: string;
  interest: string;
  message: string;
  productCodes: string[];
};

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
      channel: "website",
      status: "new",
    });

  if (error) throw error;
  return { reference };
}
