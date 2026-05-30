# Arabian Food Subscription

A subscription-based **halal food delivery** platform for foreigners living in
South Korea. Customers register, pick dishes from the admin's published weekly
menu, choose a **weekly** or **monthly** plan, and check out. Admins manage food,
menus, customers, subscriptions, orders, deliveries, payments and reports.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**
(PostgreSQL database, Auth, and Storage for food images).

---

## ✨ Features

**Customer**
- Register with full delivery profile (name, email, phone, nationality, city,
  address, zip, room/building, preferred delivery day, allergy note)
- Browse the published weekly menu (halal status, spice level, price, category)
- Multi-step ordering: select food → choose plan & delivery → payment
- Dashboard: active subscription, next delivery, payment status, order history,
  notifications
- Update profile/address, **pause / resume / cancel** subscription

**Admin**
- Secure admin login (role-based)
- Dashboard: customers, active subscriptions, weekly/monthly subs, pending
  payments, upcoming deliveries, revenue, recent orders
- **Food items**: add/edit/delete, image upload, price, stock, category, halal,
  spice, availability
- **Weekly menus**: create, add/remove dishes, draft → publish → close
- **Orders**: filter by status/payment/date/city, advance status, mark paid
- **Subscriptions**: filter, change status, pause, cancel, extend
- **Customers**: list, search, view & edit details + full history
- **Deliveries**: generate a weekly delivery list by date, update delivery status
- **Payments**: confirm manual payments (bank transfer / KakaoPay / cash), revenue
- **Reports**: weekly/monthly/all-time revenue, most ordered items, pending payments
- **Notifications** on order, payment and delivery events

---

## 🧱 Tech stack

| Layer        | Choice                                             |
|--------------|----------------------------------------------------|
| Frontend     | Next.js 15 (App Router), React 19, TypeScript      |
| Styling      | Tailwind CSS (teal + gold brand)                   |
| Backend      | Next.js Server Actions + Route Handlers            |
| Database     | Supabase PostgreSQL (with Row Level Security)      |
| Auth         | Supabase Auth (email + password, roles)            |
| Image upload | Supabase Storage (`food-images` bucket)            |
| Validation   | Zod + react-hook-form                              |

---

## 🚀 Setup

### 1. Prerequisites
- Node.js 18.18+ (tested on Node 24)
- A free [Supabase](https://supabase.com) project

### 2. Install dependencies
```bash
npm install
```

### 3. Create the Supabase project
1. Create a new project at https://supabase.com.
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
3. In **Storage → New bucket**, create a **public** bucket named `food-images`.

### 4. Configure environment variables
Copy the example and fill in your values:
```bash
cp .env.example .env.local
```
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_FOOD_BUCKET=food-images
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Create the database schema
Open **Supabase → SQL Editor**, then run, in order:
1. `supabase/schema.sql`  — tables, enums, triggers, Row Level Security
2. `supabase/seed.sql`    — sample food items, plans, and one published menu

> The storage policies at the bottom of `schema.sql` only apply if the
> `food-images` bucket already exists — create it first (step 3).

### 6. (Recommended for testing) disable email confirmation
In **Supabase → Authentication → Providers → Email**, turn **off** “Confirm email”
so new sign-ups can log in immediately. (In production, keep it on — the app
already handles the email-confirmation redirect at `/auth/callback`.)

### 7. Run the app
```bash
npm run dev
```
Open http://localhost:3000

---

## 👤 Creating an admin

Admins are just users with `role = 'admin'`.

1. Register a normal account in the app (or add a user in **Supabase →
   Authentication → Users**).
2. In **SQL Editor**, edit and run `supabase/make_admin.sql` (set your email).
3. Log in at **`/admin/login`**.

---

## 🗂 Project structure

```
supabase/
  schema.sql          # database schema + RLS + triggers
  seed.sql            # sample catalog/menu/plans
  make_admin.sql      # promote a user to admin
src/
  app/
    (site)/           # public marketing pages (home, menu, plans, about, contact)
    (auth)/           # login, register
    (customer)/       # protected dashboard + select-food/checkout
    admin/
      login/          # admin login (no shell)
      (panel)/        # protected admin dashboard + management pages
    auth/             # callback + signout route handlers
  components/
    ui/               # Logo, Badge, FoodCard, SubmitButton, Toast, SpiceLevel
    layout/           # Navbar, Footer, SidebarNav, SignOutButton
    customer/         # OrderBuilder, MenuBrowser, ProfileForm, SubscriptionActions
    admin/            # FoodManager, MenuManager, OrderControls, etc.
  lib/
    supabase/         # browser / server / service clients + auth middleware
    actions/          # server actions (auth, orders, profile, admin, notifications)
    auth.ts           # session/role guards
    types.ts          # DB types
    utils.ts          # formatting helpers (KRW, dates, status colors)
    validations.ts    # Zod schemas
  middleware.ts       # session refresh + route protection
```

---

## 🔄 Business workflow

1. Admin adds **food items** and creates a **weekly menu**, adds dishes, **publishes** it.
2. Customer registers and adds delivery details.
3. Customer selects food from the published menu, picks **weekly** (1 delivery)
   or **monthly** (4 weekly deliveries), and checks out.
4. The app creates a **subscription**, one **order per delivery week**, order
   items, an unpaid **payment**, and an order-confirmation **notification**.
5. Admin confirms payment and advances order status.
6. Admin generates the weekly **delivery list** and updates delivery status.
7. Customer tracks everything from their dashboard.

---

## 🔐 Security notes
- Every table has **Row Level Security**: customers can only read/write their own
  data; admins (via the `is_admin()` function) manage everything.
- The `service_role` key is used **server-side only** (notifications, image
  uploads) and never shipped to the browser.
- All prices are recomputed server-side at checkout — client prices are never trusted.

---

## 🌍 Internationalization (future)
The UI is English-first. Strings are plain text in components, ready to be moved
into a library like `next-intl` to add Korean, Bangla, Arabic and more.

## 📜 Scripts
```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # run production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
