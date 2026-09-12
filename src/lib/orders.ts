import type { CartTotals } from "./cart";
import { RAZORPAY_KEY_ID, requireSupabase } from "./supabase";

export type CustomerDetails = {
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
};

export type OrderKind = "enquiry" | "payment";

/** A short human reference the customer and the office can quote at each other. */
function makeReference() {
  const now = new Date();
  const stamp = [
    now.getFullYear().toString().slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RK-${stamp}-${random}`;
}

export type SavedOrder = { id: string; reference: string };

/**
 * Records the order in Supabase.
 *
 * Line prices are copied into `order_items` rather than referenced, so the
 * order still reads correctly after the admin edits the catalogue.
 *
 * The id is minted here rather than read back from the insert: `orders` is
 * insert-for-anyone but select-for-admins, and a RETURNING clause is checked
 * against the SELECT policy, so asking for the row back would fail for every
 * customer who is not signed in as us.
 *
 * Throws when Supabase is not configured. The saved row is how an order
 * reaches the office, so there is nothing to fall back to and no caller may
 * treat a missing database as a sent order.
 */
export async function createOrder(
  details: CustomerDetails,
  totals: CartTotals,
  kind: OrderKind
): Promise<SavedOrder> {
  const client = requireSupabase();

  const id = crypto.randomUUID();
  const reference = makeReference();

  // Attach the order to the account when there is one, so the dashboard can
  // show a customer's history. Row level security only accepts the signed-in
  // user's own id here, so this cannot be pointed at anybody else.
  const { data: auth } = await client.auth.getSession();

  const { error } = await client
    .from("orders")
    .insert({
      id,
      reference,
      user_id: auth.session?.user.id ?? null,
      customer_name: details.name,
      company: details.company || null,
      email: details.email || null,
      phone: details.phone || null,
      city: details.city || null,
      notes: details.notes || null,
      kind,
      status: kind === "payment" ? "pending" : "quoted",
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      tax_total: totals.taxTotal,
      total: totals.total,
      currency: totals.currency,
    });

  if (error) throw error;

  const items = totals.lines.map((l) => ({
    order_id: id,
    product_code: l.product.code,
    product_name: l.product.name,
    size: l.product.size,
    case_pack: l.product.casePack,
    quantity: l.quantity,
    unit_price: l.unitPrice ?? 0,
    discount_percent: l.product.discountPercent,
    line_total: l.lineTotal,
  }));

  if (items.length) {
    const { error: itemsError } = await client.from("order_items").insert(items);
    if (itemsError) throw itemsError;
  }

  return { id, reference };
}

// ----------------------------------------------------------------- Razorpay

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayConstructor = new (options: RazorpayOptions) => {
  open: () => void;
  on: (event: string, cb: (e: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads Razorpay's checkout script once, on demand. */
function loadCheckout(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay checkout loaded but did not initialise."));
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Could not reach Razorpay. Check your connection and try again.")),
      { once: true }
    );

    if (!existing) {
      script.src = CHECKOUT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export type PaymentResult = { status: "paid" | "dismissed"; paymentId?: string };

/**
 * Runs the online payment for an order that has already been recorded.
 *
 * The amount is never sent from the browser: the `razorpay-create-order` Edge
 * Function re-reads the order from the database and asks Razorpay for that
 * amount, so a tampered client cannot pay one rupee for a full pallet.
 * Likewise the payment signature is verified server-side in
 * `razorpay-verify`, which is what actually marks the order paid.
 */
export async function payForOrder(
  order: SavedOrder,
  details: CustomerDetails
): Promise<PaymentResult> {
  const client = requireSupabase();
  const keyId = RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("Online payment is not configured.");

  const { data: created, error: createError } = await client.functions.invoke(
    "razorpay-create-order",
    { body: { order_id: order.id } }
  );
  if (createError) throw new Error(createError.message);

  const { razorpay_order_id, amount, currency } = created as {
    razorpay_order_id: string;
    amount: number;
    currency: string;
  };

  const Razorpay = await loadCheckout();

  return new Promise<PaymentResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: keyId,
      amount,
      currency,
      name: "RUSKAV Food Service Products",
      description: `Order ${order.reference}`,
      order_id: razorpay_order_id,
      prefill: { name: details.name, email: details.email, contact: details.phone },
      notes: { reference: order.reference },
      theme: { color: "#b91c2e" },
      handler: (response) => {
        client.functions
          .invoke("razorpay-verify", {
            body: {
              order_id: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          })
          .then(({ error }) => {
            if (error) reject(new Error("Payment taken but could not be verified. Contact us with your reference before paying again."));
            else resolve({ status: "paid", paymentId: response.razorpay_payment_id });
          })
          .catch(reject);
      },
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    });

    checkout.open();
  });
}
