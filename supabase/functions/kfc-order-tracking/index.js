import { timingSafeEqual } from "node:crypto";
import { testTracking } from "../../../src/lib/kfcShippingTestModel.ts";

const headers = { "cache-control": "no-store" };
const reply = (body, status = 200) => Response.json(body, { status, headers });
const normalize = (value) => typeof value === "string" && value.length <= 254 ? value.trim().toLowerCase() : "";
const postcode = (value) => normalize(value).replaceAll(/\s/g, "");
const denied = () => reply({ verified: false });

async function readTable(table, query) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/" + table + "?" + new URLSearchParams(query), {
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey },
  });
  if (!response.ok) throw Error("CRM lookup failed");
  return response.json();
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  const expected = Deno.env.get("KFC_TRACKING_DEMO_KEY");
  const provided = request.headers.get("x-kfc-tracking-key") ?? "";
  const bytes = new TextEncoder();
  if (!/^[a-f0-9]{64}$/.test(expected ?? "") || !/^[a-f0-9]{64}$/.test(provided) || !timingSafeEqual(bytes.encode(expected), bytes.encode(provided))) {
    return reply({ error: "unauthorized" }, 401);
  }

  const input = await request.json().catch(() => null);
  const number = normalize(input?.order_number).replace(/^#\s*/, "");
  const email = normalize(input?.email);
  const postalCode = postcode(input?.postcode);
  if (!/^\d{1,20}$/.test(number) || !email || !postalCode) return denied();

  try {
    const candidates = await readTable("kfc_shop_orders", {
      select: "id,ship_email,ship_postcode,fulfilment,status",
      number: "eq." + number, "raw->>source": "eq.sample",
    });
    const matches = candidates.filter((order) =>
      email === normalize(order.ship_email) && postalCode === postcode(order.ship_postcode));
    if (matches.length !== 1) return denied();
    const [order] = matches;

    const parcels = await readTable("kfc_shipping_test_parcels", {
      select: "id,parcel_no,service,created_at", order_id: "eq." + order.id, order: "parcel_no.asc",
    });
    const scenario = order.fulfilment === "shipped" ? "in_transit" : "label";
    return reply({
      verified: true,
      source: "simulation",
      order_status: order.status === "on-hold" || order.status === "pending" ? "awaiting_payment" :
        order.status === "refunded" ? "refunded" : ({
        shipped: "shipped", picked: "picked_awaiting_dispatch",
        external: "completed_in_webshop", cancelled: "cancelled",
        open: "awaiting_dispatch",
      })[order.fulfilment] ?? "unknown",
      parcels: parcels.map((parcel) => {
        const tracking = testTracking(parcel, scenario);
        return {
          number: parcel.parcel_no,
          carrier: tracking.carrier,
          last_event: tracking.events.at(-1) ?? null,
          estimated_delivery_date: tracking.estimate,
          estimated_delivery_time: null,
        };
      }),
    });
  } catch {
    return reply({ error: "tracking_unavailable" }, 503);
  }
});
