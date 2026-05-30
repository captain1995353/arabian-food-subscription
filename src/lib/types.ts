// ======================================================================
//  Application + database types.
//  These mirror supabase/schema.sql. Kept hand-written (rather than
//  generated) so the project stays simple to set up.
// ======================================================================

export type UserRole = "customer" | "admin";

export type FoodCategory =
  | "Rice"
  | "Curry"
  | "Chicken"
  | "Beef"
  | "Fish"
  | "Vegetable"
  | "Dessert"
  | "Drinks";

export const FOOD_CATEGORIES: FoodCategory[] = [
  "Rice",
  "Curry",
  "Chicken",
  "Beef",
  "Fish",
  "Vegetable",
  "Dessert",
  "Drinks",
];

export type MenuStatus = "draft" | "published" | "closed";
export type PlanType = "weekly" | "monthly";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "partial";
export type PaymentMethod = "bank_transfer" | "kakaopay" | "cash" | "other";
export type DeliveryStatus =
  | "scheduled"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "failed";
export type NotificationType =
  | "order_confirmation"
  | "payment_confirmation"
  | "delivery_reminder"
  | "delivery_update"
  | "subscription_expiry"
  | "general";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  nationality: string | null;
  city: string | null;
  address: string | null;
  zip_code: string | null;
  room_building: string | null;
  preferred_delivery_day: string | null;
  allergy_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  category: FoodCategory;
  is_halal: boolean;
  spicy_level: number;
  available_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenu {
  id: string;
  title: string;
  week_number: number | null;
  start_date: string;
  end_date: string;
  delivery_date: string;
  order_deadline: string;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenuItem {
  id: string;
  weekly_menu_id: string;
  food_item_id: string;
  price: number;
  available_quantity: number;
  sort_order: number;
  created_at: string;
  food_item?: FoodItem;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan_type: PlanType;
  weeks_count: number;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string | null;
  plan_type: PlanType;
  start_date: string;
  end_date: string;
  weekly_deliveries: number;
  total_price: number;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  subscription_id: string | null;
  weekly_menu_id: string | null;
  delivery_date: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_city: string | null;
  delivery_address: string | null;
  delivery_zip: string | null;
  delivery_room: string | null;
  special_note: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  order_id: string | null;
  subscription_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_note: string | null;
  paid_at: string | null;
  confirmed_by: string | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  customer_id: string;
  delivery_date: string | null;
  status: DeliveryStatus;
  city: string | null;
  address: string | null;
  driver_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  customer_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
