import { createServiceClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/types";

/**
 * Insert a notification for a customer. Uses the service client so it works
 * from server actions regardless of who triggered it (customer checkout,
 * admin status change, etc.). SERVER-ONLY.
 */
export async function notify(
  customerId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    const supabase = createServiceClient();
    await supabase.from("notifications").insert({
      customer_id: customerId,
      type,
      title,
      message,
    });
  } catch {
    // Notifications are best-effort; never block the main flow on failure.
  }
}
