-- ======================================================================
--  ARABIAN FOOD SUBSCRIPTION — DATABASE SCHEMA
--  Target: Supabase (PostgreSQL 15+)
--
--  Run this file once in the Supabase SQL Editor (Dashboard -> SQL Editor
--  -> New query -> paste -> Run). It is idempotent-ish: it drops the app
--  tables/types first so you can re-run during development.
--
--  Auth is handled by Supabase Auth (auth.users). Each auth user gets a
--  matching row in `profiles`. Customers additionally get a `customers`
--  row holding delivery details. Admins are simply profiles with
--  role = 'admin'.
-- ======================================================================

-- ----------------------------------------------------------------------
-- 0. CLEAN SLATE (safe for dev). Comment out in production.
-- ----------------------------------------------------------------------
drop table if exists public.notifications cascade;
drop table if exists public.deliveries cascade;
drop table if exists public.payments cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.subscription_plans cascade;
drop table if exists public.weekly_menu_items cascade;
drop table if exists public.weekly_menus cascade;
drop table if exists public.food_items cascade;
drop table if exists public.customers cascade;
drop table if exists public.profiles cascade;

drop type if exists public.user_role cascade;
drop type if exists public.food_category cascade;
drop type if exists public.menu_status cascade;
drop type if exists public.plan_type cascade;
drop type if exists public.subscription_status cascade;
drop type if exists public.order_status cascade;
drop type if exists public.payment_status cascade;
drop type if exists public.payment_method cascade;
drop type if exists public.delivery_status cascade;
drop type if exists public.notification_type cascade;

-- ----------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------
create type public.user_role          as enum ('customer', 'admin');
create type public.food_category       as enum ('Rice', 'Curry', 'Chicken', 'Beef', 'Fish', 'Vegetable', 'Dessert', 'Drinks');
create type public.menu_status         as enum ('draft', 'published', 'closed');
create type public.plan_type           as enum ('weekly', 'monthly');
create type public.subscription_status as enum ('active', 'paused', 'cancelled', 'expired');
create type public.order_status        as enum ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
create type public.payment_status      as enum ('unpaid', 'paid', 'partial');
create type public.payment_method      as enum ('bank_transfer', 'kakaopay', 'cash', 'other');
create type public.delivery_status     as enum ('scheduled', 'preparing', 'out_for_delivery', 'delivered', 'failed');
create type public.notification_type   as enum ('order_confirmation', 'payment_confirmation', 'delivery_reminder', 'delivery_update', 'subscription_expiry', 'general');

-- ----------------------------------------------------------------------
-- 2. HELPER: updated_at trigger function
-- ----------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------
-- 3. PROFILES  (1:1 with auth.users)  ==> the "users" / "admin_users" table
-- ----------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'customer',
  full_name   text not null default '',
  email       text not null default '',
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- is_admin(): SECURITY DEFINER so RLS policies can call it without recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------
-- 4. CUSTOMERS  (delivery + personal details, 1:1 with a customer profile)
-- ----------------------------------------------------------------------
create table public.customers (
  id                     uuid primary key references public.profiles(id) on delete cascade,
  nationality            text,
  city                   text,                       -- city in Korea
  address                text,                       -- full delivery address
  zip_code               text,
  room_building          text,                       -- room number / building name
  preferred_delivery_day text,                       -- e.g. 'Saturday'
  allergy_note           text,                       -- special food note / allergy info
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- 5. FOOD ITEMS  (master catalog managed by admin)
-- ----------------------------------------------------------------------
create table public.food_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  image_url    text,
  price        numeric(10,2) not null default 0,     -- price in KRW (won)
  category     public.food_category not null default 'Rice',
  is_halal     boolean not null default true,
  spicy_level  int not null default 0 check (spicy_level between 0 and 5),
  available_quantity int not null default 0,
  package_required boolean not null default false,     -- always included & locked in packages
  max_per_week int not null default 0,                 -- max qty per week (0 = no limit)
  is_active    boolean not null default true,         -- available / unavailable
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_food_items_updated before update on public.food_items
  for each row execute function public.set_updated_at();
create index idx_food_items_category on public.food_items(category);
create index idx_food_items_active   on public.food_items(is_active);

-- ----------------------------------------------------------------------
-- 6. WEEKLY MENUS  +  WEEKLY MENU ITEMS
-- ----------------------------------------------------------------------
create table public.weekly_menus (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,                       -- e.g. "Week of June 2 – June 8"
  week_number    int,
  start_date     date not null,
  end_date       date not null,
  delivery_date  date not null,
  order_deadline timestamptz not null,
  status         public.menu_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_weekly_menus_updated before update on public.weekly_menus
  for each row execute function public.set_updated_at();
create index idx_weekly_menus_status on public.weekly_menus(status);

create table public.weekly_menu_items (
  id              uuid primary key default gen_random_uuid(),
  weekly_menu_id  uuid not null references public.weekly_menus(id) on delete cascade,
  food_item_id    uuid not null references public.food_items(id) on delete cascade,
  price           numeric(10,2) not null default 0,   -- price snapshot for this week
  available_quantity int not null default 0,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (weekly_menu_id, food_item_id)
);
create index idx_wmi_menu on public.weekly_menu_items(weekly_menu_id);

-- ----------------------------------------------------------------------
-- 7. SUBSCRIPTION PLANS  +  SUBSCRIPTIONS
-- ----------------------------------------------------------------------
create table public.subscription_plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                          -- e.g. "Weekly Plan", "Monthly Plan"
  plan_type   public.plan_type not null,
  weeks_count int not null default 1,                 -- weekly = 1, monthly = 4
  item_count  int not null default 0,                 -- 0 = a-la-carte (sum item prices);
                                                       -- > 0 = fixed package: pick exactly N
                                                       -- items for the flat base_price per week
  description text,
  base_price  numeric(10,2) not null default 0,       -- a-la-carte: optional fee; package: flat price/week
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers(id) on delete cascade,
  plan_id           uuid references public.subscription_plans(id) on delete set null,
  plan_type         public.plan_type not null,
  start_date        date not null,
  end_date          date not null,
  weekly_deliveries int not null default 1,            -- number of weekly deliveries
  total_price       numeric(10,2) not null default 0,
  payment_status    public.payment_status not null default 'unpaid',
  delivery_status   public.delivery_status not null default 'scheduled',
  status            public.subscription_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
create index idx_subscriptions_customer on public.subscriptions(customer_id);
create index idx_subscriptions_status   on public.subscriptions(status);

-- ----------------------------------------------------------------------
-- 8. ORDERS  +  ORDER ITEMS
--    An order represents one weekly delivery. A monthly subscription
--    produces several orders (one per delivery week).
-- ----------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1000;

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique default ('AF-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  weekly_menu_id  uuid references public.weekly_menus(id) on delete set null,
  delivery_date   date,
  -- delivery address snapshot (so historical orders keep the address used)
  delivery_name      text,
  delivery_phone     text,
  delivery_city      text,
  delivery_address   text,
  delivery_zip       text,
  delivery_room      text,
  special_note    text,
  subtotal        numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  status          public.order_status not null default 'pending',
  payment_status  public.payment_status not null default 'unpaid',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status   on public.orders(status);
create index idx_orders_delivery on public.orders(delivery_date);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  name         text not null,                          -- snapshot of food name
  unit_price   numeric(10,2) not null default 0,
  quantity     int not null default 1,
  line_total   numeric(10,2) not null default 0,
  created_at   timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

-- ----------------------------------------------------------------------
-- 9. PAYMENTS
-- ----------------------------------------------------------------------
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount          numeric(10,2) not null default 0,
  method          public.payment_method not null default 'bank_transfer',
  status          public.payment_status not null default 'unpaid',
  transaction_note text,
  paid_at         timestamptz,
  confirmed_by    uuid references public.profiles(id) on delete set null,  -- admin who confirmed
  created_at      timestamptz not null default now()
);
create index idx_payments_customer on public.payments(customer_id);
create index idx_payments_status   on public.payments(status);

-- ----------------------------------------------------------------------
-- 10. DELIVERIES
-- ----------------------------------------------------------------------
create table public.deliveries (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  delivery_date date,
  status        public.delivery_status not null default 'scheduled',
  city          text,
  address       text,
  driver_note   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_deliveries_updated before update on public.deliveries
  for each row execute function public.set_updated_at();
create index idx_deliveries_date on public.deliveries(delivery_date);

-- ----------------------------------------------------------------------
-- 11. NOTIFICATIONS
-- ----------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  type        public.notification_type not null default 'general',
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_notifications_customer on public.notifications(customer_id);

-- ----------------------------------------------------------------------
-- 12. NEW-USER TRIGGER
--     When a user signs up via Supabase Auth, create their profile (and a
--     customers row if they are a customer). Role + full_name + phone come
--     from the sign-up metadata set by the app.
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer');

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'phone'
  );

  if v_role = 'customer' then
    insert into public.customers (
      id, nationality, city, address, zip_code, room_building,
      preferred_delivery_day, allergy_note
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'nationality',
      new.raw_user_meta_data ->> 'city',
      new.raw_user_meta_data ->> 'address',
      new.raw_user_meta_data ->> 'zip_code',
      new.raw_user_meta_data ->> 'room_building',
      new.raw_user_meta_data ->> 'preferred_delivery_day',
      new.raw_user_meta_data ->> 'allergy_note'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ======================================================================
--  ROW LEVEL SECURITY
-- ======================================================================
alter table public.profiles            enable row level security;
alter table public.customers           enable row level security;
alter table public.food_items          enable row level security;
alter table public.weekly_menus        enable row level security;
alter table public.weekly_menu_items   enable row level security;
alter table public.subscription_plans  enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.payments            enable row level security;
alter table public.deliveries          enable row level security;
alter table public.notifications       enable row level security;

-- ---- PROFILES ----
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- CUSTOMERS ----
create policy "customers_select_own_or_admin" on public.customers
  for select using (id = auth.uid() or public.is_admin());
create policy "customers_update_own" on public.customers
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "customers_admin_all" on public.customers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- FOOD ITEMS ----  (everyone can read, only admin writes)
create policy "food_read_all" on public.food_items
  for select using (true);
create policy "food_admin_write" on public.food_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- WEEKLY MENUS ----  (public can read PUBLISHED menus; admin sees all)
create policy "menus_read_published_or_admin" on public.weekly_menus
  for select using (status = 'published' or public.is_admin());
create policy "menus_admin_write" on public.weekly_menus
  for all using (public.is_admin()) with check (public.is_admin());

create policy "menu_items_read" on public.weekly_menu_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.weekly_menus m
      where m.id = weekly_menu_id and m.status = 'published'
    )
  );
create policy "menu_items_admin_write" on public.weekly_menu_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- SUBSCRIPTION PLANS ----  (public read active, admin writes)
create policy "plans_read" on public.subscription_plans
  for select using (is_active = true or public.is_admin());
create policy "plans_admin_write" on public.subscription_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- SUBSCRIPTIONS ----
create policy "subs_select_own_or_admin" on public.subscriptions
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "subs_insert_own" on public.subscriptions
  for insert with check (customer_id = auth.uid());
create policy "subs_update_own" on public.subscriptions
  for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "subs_admin_all" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- ORDERS ----
create policy "orders_select_own_or_admin" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (customer_id = auth.uid());
create policy "orders_update_own" on public.orders
  for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- ORDER ITEMS ----  (tied to a viewable order)
create policy "order_items_select" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()
    )
  );
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
  );
create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- PAYMENTS ----  (customer reads own, only admin/customer create; admin confirms)
create policy "payments_select_own_or_admin" on public.payments
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "payments_insert_own" on public.payments
  for insert with check (customer_id = auth.uid() or public.is_admin());
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- DELIVERIES ----  (customer reads own, admin manages)
create policy "deliveries_select_own_or_admin" on public.deliveries
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "deliveries_admin_all" on public.deliveries
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- NOTIFICATIONS ----
create policy "notifications_select_own_or_admin" on public.notifications
  for select using (customer_id = auth.uid() or public.is_admin());
create policy "notifications_update_own" on public.notifications
  for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "notifications_admin_all" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  STORAGE POLICIES (food images)
--  NOTE: First create a PUBLIC bucket named 'food-images' in the
--  Supabase dashboard (Storage -> New bucket -> public). Then run these.
-- ======================================================================
-- Public read of food images:
do $$
begin
  if exists (select 1 from storage.buckets where id = 'food-images') then
    -- public read
    drop policy if exists "food_images_public_read" on storage.objects;
    create policy "food_images_public_read" on storage.objects
      for select using (bucket_id = 'food-images');
    -- only admins can upload / change / delete
    drop policy if exists "food_images_admin_write" on storage.objects;
    create policy "food_images_admin_write" on storage.objects
      for all using (bucket_id = 'food-images' and public.is_admin())
      with check (bucket_id = 'food-images' and public.is_admin());
  end if;
end $$;
