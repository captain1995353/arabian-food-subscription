import { z } from "zod";
import { FOOD_CATEGORIES } from "./types";

// ---- Auth ----
export const registerSchema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(6, "Enter a valid phone number"),
  nationality: z.string().min(2, "Enter your nationality"),
  city: z.string().min(1, "Enter your city in Korea"),
  address: z.string().min(4, "Enter your full delivery address"),
  zip_code: z.string().min(3, "Enter your zip code"),
  room_building: z.string().optional().default(""),
  preferred_delivery_day: z.string().optional().default("Saturday"),
  allergy_note: z.string().optional().default(""),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Admin registration (gated by a secret invite code) ----
export const adminRegisterSchema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().default(""),
  invite_code: z.string().min(1, "Invite code is required"),
});
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;

// ---- Profile / address update ----
export const profileSchema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(6, "Enter a valid phone number"),
  nationality: z.string().optional().default(""),
  city: z.string().min(1, "Enter your city"),
  address: z.string().min(4, "Enter your address"),
  zip_code: z.string().min(3, "Enter your zip code"),
  room_building: z.string().optional().default(""),
  preferred_delivery_day: z.string().optional().default("Saturday"),
  allergy_note: z.string().optional().default(""),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ---- Food item (admin) ----
export const foodItemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional().default(""),
  image_url: z.string().optional().default(""),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.enum(FOOD_CATEGORIES as [string, ...string[]]),
  is_halal: z.coerce.boolean().default(true),
  spicy_level: z.coerce.number().min(0).max(5).default(0),
  available_quantity: z.coerce.number().min(0).default(0),
  is_active: z.coerce.boolean().default(true),
});
export type FoodItemInput = z.infer<typeof foodItemSchema>;

// ---- Weekly menu (admin) ----
export const weeklyMenuSchema = z.object({
  title: z.string().min(2, "Title is required"),
  week_number: z.coerce.number().optional(),
  start_date: z.string().min(1, "Start date required"),
  end_date: z.string().min(1, "End date required"),
  delivery_date: z.string().min(1, "Delivery date required"),
  order_deadline: z.string().min(1, "Order deadline required"),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
});
export type WeeklyMenuInput = z.infer<typeof weeklyMenuSchema>;

export const PREFERRED_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
