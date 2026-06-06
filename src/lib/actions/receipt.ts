"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer uploads a payment receipt (image/pdf) for one of their
 * subscriptions. Uploaded with the customer's own session to the public
 * `receipts` bucket; the URL is saved on the subscription so the admin can
 * verify it. Wrapped so it always returns an error rather than throwing
 * (a throw would crash the page via the client transition).
 */
export async function uploadReceipt(
  subscriptionId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please log in." };

    // Verify the subscription belongs to this customer (RLS-backed).
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("id", subscriptionId)
      .eq("customer_id", user.id)
      .maybeSingle();
    if (!sub) return { error: "Subscription not found." };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "Please choose a file." };
    if (file.size > 8 * 1024 * 1024) return { error: "File too large (max 8MB)." };

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${subscriptionId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) return { error: upErr.message };

    const { data: pub } = supabase.storage.from("receipts").getPublicUrl(path);

    const { error: updErr } = await supabase
      .from("subscriptions")
      .update({ receipt_url: pub.publicUrl })
      .eq("id", subscriptionId);
    if (updErr) return { error: updErr.message };

    revalidatePath("/dashboard/subscription");
    revalidatePath("/dashboard/orders");
    return { url: pub.publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed. Please try again." };
  }
}
