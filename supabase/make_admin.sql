-- ======================================================================
--  Promote an existing user to ADMIN.
--  1. First register/sign up the account through the app or Supabase
--     dashboard (Authentication -> Users -> Add user).
--  2. Then run this, replacing the email below.
-- ======================================================================
update public.profiles
set role = 'admin'
where email = 'admin@arabian.example';

-- A profile with role='admin' does not need a customers row.
delete from public.customers
where id in (select id from public.profiles where role = 'admin');
