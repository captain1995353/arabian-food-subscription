import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { OfflineSubscriber } from "@/lib/types";

/** GET /admin/offline/export — download offline subscribers as Excel-ready CSV. */
export async function GET() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("offline_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = (data as OfflineSubscriber[]) ?? [];

  // Collect every distinct dish across all submissions -> one column each,
  // holding the quantity that customer chose (blank = none). Lets you total
  // each dish for kitchen prep.
  const dishNames = Array.from(
    new Set(rows.flatMap((r) => (r.items ?? []).map((it) => it.name)))
  ).sort();

  const qtyFor = (r: OfflineSubscriber, name: string) =>
    (r.items ?? []).find((it) => it.name === name)?.quantity ?? "";

  const headers = [
    "Submitted", "Name", "Phone", "Passport No", "Nationality", "City", "Address",
    "Zip", "Room/Building", "Delivery Date",
    "Map Link",
    ...dishNames, // per-dish quantity columns
    "Total Items", "Items Summary", "Payment Amount", "Receipt URL", "Note",
  ];

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) => {
      const totalItems = (r.items ?? []).reduce((s, it) => s + it.quantity, 0);
      return [
        new Date(r.created_at).toISOString().slice(0, 10),
        r.full_name,
        r.phone,
        r.passport_no,
        r.nationality,
        r.city,
        r.address,
        r.zip_code,
        r.room_building,
        r.delivery_date,
        r.map_link,
        ...dishNames.map((n) => qtyFor(r, n)),
        totalItems,
        r.item_summary,
        r.payment_amount,
        r.receipt_url,
        r.special_note,
      ].map(esc).join(",");
    }),
  ];

  // Prepend BOM so Excel reads UTF-8 (Korean/Bangla/Arabic) correctly.
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="offline-subscribers.csv"`,
    },
  });
}
