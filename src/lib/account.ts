import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * What a signed-in customer can see of their own dealings with us.
 *
 * Row level security does the work: both queries are unfiltered by account on
 * purpose, because the policy already restricts them to `user_id = auth.uid()`.
 * Adding a `.eq("user_id", …)` here would read as the thing protecting the
 * data, and the next person to edit this file would believe it.
 */
export type MyEnquiry = {
  id: string;
  reference: string;
  created_at: string;
  status: string;
  interest: string | null;
  message: string | null;
  product_codes: string[] | null;
  quantity: string | null;
  city: string | null;

  quoted_amount: number | string | null;
  quoted_currency: string | null;
  quote_notes: string | null;
  quoted_at: string | null;
  granted_tier: string | null;
};

export type MyOrder = {
  id: string;
  reference: string;
  created_at: string;
  kind: string;
  status: string;
  total: number | string | null;
  currency: string;
};

export type MyOrderItem = {
  order_id: string;
  product_code: string;
  product_name: string;
  size: string | null;
  quantity: number;
  line_total: number | string | null;
};

export type AccountState = {
  enquiries: MyEnquiry[];
  orders: MyOrder[];
  items: MyOrderItem[];
  loading: boolean;
  /** Set when the tables exist but the newer policies have not been applied. */
  error: string | null;
  reload: () => void;
};

export function useMyActivity(signedIn: boolean): AccountState {
  const [enquiries, setEnquiries] = useState<MyEnquiry[]>([]);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [items, setItems] = useState<MyOrderItem[]>([]);
  const [loading, setLoading] = useState(signedIn);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!supabase || !signedIn) {
      setLoading(false);
      return;
    }
    const client = supabase;
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const [enq, ord] = await Promise.all([
        client
          .from("enquiries")
          .select(
            "id, reference, created_at, status, interest, message, product_codes, quantity, city, quoted_amount, quoted_currency, quote_notes, quoted_at, granted_tier"
          )
          .order("created_at", { ascending: false })
          .limit(50),
        client
          .from("orders")
          .select("id, reference, created_at, kind, status, total, currency")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;

      // A missing column means the quoting migration has not been run. That is
      // a setup problem, not a customer-facing one, so the page still renders
      // what it can rather than showing an error to a buyer who cannot act on
      // it.
      if (enq.error) setError(enq.error.message);
      else setError(null);

      setEnquiries((enq.data ?? []) as MyEnquiry[]);
      const rows = (ord.data ?? []) as MyOrder[];
      setOrders(rows);

      if (rows.length) {
        const { data } = await client
          .from("order_items")
          .select("order_id, product_code, product_name, size, quantity, line_total")
          .in(
            "order_id",
            rows.map((o) => o.id)
          );
        if (!cancelled) setItems((data ?? []) as MyOrderItem[]);
      } else {
        setItems([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn, nonce]);

  return { enquiries, orders, items, loading, error, reload };
}

/** How a quote reads to the person who asked for it. */
export const ENQUIRY_STATUS_COPY: Record<string, { label: string; blurb: string }> = {
  new: {
    label: "With our team",
    blurb: "We've got it. You'll hear back with pricing, usually within a working day.",
  },
  quoted: {
    label: "Quoted",
    blurb: "We've priced this for you — the figures are below.",
  },
  replied: {
    label: "Replied",
    blurb: "We've come back to you on this one.",
  },
  won: {
    label: "Confirmed",
    blurb: "Agreed and on its way through.",
  },
  closed: {
    label: "Closed",
    blurb: "This one's wrapped up. Start a new request any time.",
  },
};
