import { redirect } from "next/navigation";

/**
 * Checkout is handled inline by the multi-step OrderBuilder on /select-food
 * (select -> plan & delivery -> payment), so this route simply forwards there.
 */
export default function CheckoutPage() {
  redirect("/select-food");
}
