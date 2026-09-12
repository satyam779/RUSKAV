/**
 * Verifies a Razorpay payment signature and marks the order paid.
 *
 * This is the only thing that may set `status = 'paid'`. The browser is not
 * trusted to report its own success: Razorpay signs `order_id|payment_id` with
 * the key secret, and an order is only marked paid when that HMAC matches one
 * computed here. A client that simply claims to have paid changes nothing.
 *
 * Deploy:
 *   supabase functions deploy razorpay-verify --no-verify-jwt
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/** HMAC-SHA256 of `payload` under `secret`, hex encoded. */
async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent comparison, so timing cannot leak the expected value. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keySecret) return json({ error: "Razorpay is not configured on the server." }, 500);

  let body: {
    order_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }

  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return json({ error: "Missing payment details." }, 400);
  }

  const expected = await sign(`${razorpay_order_id}|${razorpay_payment_id}`, keySecret);
  if (!timingSafeEqual(expected, razorpay_signature)) {
    console.warn("Rejected payment with a bad signature for order", order_id);
    return json({ error: "Payment could not be verified." }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Pin the update to the razorpay order id this signature belongs to, so a
  // valid signature for one order can never settle a different one.
  const { data, error } = await admin
    .from("orders")
    .update({ status: "paid", razorpay_payment_id })
    .eq("id", order_id)
    .eq("razorpay_order_id", razorpay_order_id)
    .select("id, reference")
    .single();

  if (error || !data) return json({ error: "Order not found for this payment." }, 404);

  return json({ status: "paid", reference: data.reference });
});
