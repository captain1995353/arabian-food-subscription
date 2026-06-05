-- ======================================================================
--  ARABIAN FOOD SUBSCRIPTION — SAMPLE SEED DATA
--  Run AFTER schema.sql, in the Supabase SQL Editor.
--
--  This seeds the public catalog only (food items, one published weekly
--  menu, and subscription plans). Auth users (customers/admin) are created
--  through Supabase Auth (the app's Register page or the dashboard) — they
--  cannot be inserted with plain SQL.
--
--  Image URLs point at the Next.js /public/images folder, so they render
--  immediately in local dev. When you upload real images to Supabase
--  Storage, the admin UI will replace these with storage URLs.
-- ======================================================================

-- Clear catalog (keeps it re-runnable). Order respects FKs.
delete from public.weekly_menu_items;
delete from public.weekly_menus;
delete from public.food_items;
delete from public.subscription_plans;

-- ---- FOOD ITEMS ----
insert into public.food_items (id, name, description, image_url, price, category, is_halal, spicy_level, available_quantity, is_active) values
  ('11111111-0000-0000-0000-000000000001', 'Chicken Kabsa',            'Fragrant Arabian spiced basmati rice slow-cooked with tender halal chicken, golden raisins and toasted almonds.', '/images/kabsa.png',                  12000, 'Rice',      true, 1, 50, true),
  ('11111111-0000-0000-0000-000000000002', 'Lamb Kabsa',              'Premium halal lamb on aromatic Arabian spiced rice with nuts and raisins.',                                      '/images/kabsa.png',                  12500, 'Beef',      true, 1, 30, true),
  ('11111111-0000-0000-0000-000000000003', 'Hyderabadi Chicken Biryani','Layered basmati rice and marinated halal chicken with whole spices.',                                          '/images/biryani.png',                11000, 'Rice',      true, 2, 40, true),
  ('11111111-0000-0000-0000-000000000004', 'Arabiana Yangnyeom Chicken','Double-fried halal chicken glazed in our sweet-spicy signature sauce.',                                         '/images/korean-fried-chicken.png',   15000, 'Chicken',   true, 3, 40, true),
  ('11111111-0000-0000-0000-000000000005', 'Sweet Crispy Dakgangjeong','Bite-sized ultra-crispy halal chicken in a sweet sticky glaze with sesame.',                                     '/images/kangjeong-chicken.png',      15000, 'Chicken',   true, 2, 40, true),
  ('11111111-0000-0000-0000-000000000006', 'Buldak Fire Chicken Bowl','Fiery Korean fire chicken over steamed rice — for spice lovers.',                                                '/images/korean-fried-chicken.png',   8000,  'Chicken',   true, 5, 35, true),
  ('11111111-0000-0000-0000-000000000007', 'Grilled Fish Curry',      'Mild coconut fish curry with herbs, served with rice.',                                                          '/images/biryani.png',                11500, 'Fish',      true, 2, 20, true),
  ('11111111-0000-0000-0000-000000000008', 'Mixed Vegetable Curry',   'Seasonal vegetables in a fragrant, lightly spiced curry. Vegan friendly.',                                        '/images/kabsa.png',                  9000,  'Vegetable', true, 1, 25, true),
  ('11111111-0000-0000-0000-000000000009', 'Beef Bulgogi Rice Box',   'Marinated halal beef bulgogi over rice with pickled sides.',                                                      '/images/hero-spread.png',            12000, 'Beef',      true, 1, 30, true),
  ('11111111-0000-0000-0000-00000000000a', 'Date & Pistachio Dessert','Traditional Arabian sweet with dates and pistachio.',                                                            '/images/hero-spread.png',            5000,  'Dessert',   true, 0, 60, true),
  ('11111111-0000-0000-0000-00000000000b', 'Mango Lassi',             'Creamy yogurt mango drink.',                                                                                     '/images/hero-spread.png',            3500,  'Drinks',    true, 0, 80, true),
  ('11111111-0000-0000-0000-00000000000c', 'Soft Drink 355ml',        'Assorted soft drinks — Coke, Sprite, Fanta.',                                                                    '/images/hero-spread.png',            1500,  'Drinks',    true, 0, 100, true);

-- ---- SUBSCRIPTION PLANS ----
-- item_count = 0  -> a-la-carte (price = sum of chosen item prices)
-- item_count > 0  -> fixed package (pick exactly N items for the flat base_price/week)
insert into public.subscription_plans (id, name, plan_type, weeks_count, item_count, base_price, description, is_active) values
  ('22222222-0000-0000-0000-000000000001', 'Weekly Plan',  'weekly',  1, 0, 0, 'Pay per dish for one week, delivered once. Great to try Arabian.', true),
  ('22222222-0000-0000-0000-000000000002', 'Monthly Plan', 'monthly', 4, 0, 0, 'Pay per dish for a month. Fresh food delivered every week for 4 weeks.', true),
  ('22222222-0000-0000-0000-000000000010', 'Weekly Package (6 items)', 'weekly', 1, 6, 57000, 'Pick any 6 dishes from this week''s menu for one flat weekly price.', true),
  ('22222222-0000-0000-0000-000000000011', 'Monthly Package (6 items/week)', 'monthly', 4, 6, 228000, 'Pick 6 dishes each week, delivered every week for a month. Best value.', true);

-- ---- WEEKLY MENU (one published menu for the current week) ----
-- Dates are relative to "today" so the seed always shows a live, open menu.
insert into public.weekly_menus (id, title, week_number, start_date, end_date, delivery_date, order_deadline, status) values
  ('33333333-0000-0000-0000-000000000001',
   'This Week''s Arabian Menu',
   1,
   current_date,
   current_date + 6,
   current_date + 3,
   (current_date + 2)::timestamptz + interval '20 hours',
   'published');

-- Attach food items to the published weekly menu (price snapshot + stock).
insert into public.weekly_menu_items (weekly_menu_id, food_item_id, price, available_quantity, sort_order)
select '33333333-0000-0000-0000-000000000001', id, price, available_quantity, row_number() over (order by category, name)
from public.food_items
where is_active = true;
