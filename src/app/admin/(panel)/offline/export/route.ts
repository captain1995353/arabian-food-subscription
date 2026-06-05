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

  const headers = [
    "Submitted", "Name", "Phone", "Passport No", "Nationality", "City", "Address",
    "Zip", "Room/Building", "Delivery Date", "Items", "Note",
  ];

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
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
        r.item_summary,
        r.special_note,
      ].map(esc).join(",")
    ),
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
