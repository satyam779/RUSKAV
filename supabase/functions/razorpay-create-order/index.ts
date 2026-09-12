/**
 * Creates a Razorpay order for an order already stored in the database.
 *
 * The browser sends only an order id. The amount is re-read from the `orders`
 * table with the service-role key, so a tampered client cannot choose what it
 * pays. The Razorpay key secret exists only here, never in the bundle.
 *
 * Deploy:
 *   supabase functions deploy razorpay-create-order --no-verify-jwt
 *   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    return json({ error: "Razorpay is not configured on the server." }, 500);
  }

  let orderId: string | undefined;
  try {
    const body = await req.json();
    orderId = body?.order_id;
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }
  if (!orderId) return json({ error: "order_id is required." }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: order, error } = await admin
    .from("orders")
    .select("id, reference, total, currency, status")
    .eq("id", orderId)
    .single();

  if (error || !order) return json({ error: "Order not found." }, 404);
  if (order.status === "paid") return json({ error: "This order is already paid." }, 409);

  const amountPaise = Math.round(Number(order.total) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    return json({ error: "This order has nothing payable on it." }, 400);
  }

  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: order.currency ?? "INR",
      receipt: order.reference,
      notes: { supabase_order_id: order.id },
    }),
  });

  if (!razorpayResponse.ok) {
    const detail = await razorpayResponse.text();
    console.error("Razorpay order creation failed:", detail);
    return json({ error: "Could not start the payment. Please try again." }, 502);
  }

  const razorpayOrder = await razorpayResponse.json();

  await admin
    .from("orders")
    .update({ razorpay_order_id: razorpayOrder.id })
    .eq("id", order.id);

  return json({
    razorpay_order_id: razorpayOrder.id,
    amount: amountPaise,
    currency: order.currency ?? "INR",
  });
});
