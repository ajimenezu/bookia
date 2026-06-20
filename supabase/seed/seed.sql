-- =============================================================================
-- LOCAL seed — placeholder / bootstrap data
-- =============================================================================
-- Loaded by `npm run db:seed` (after supabase/sql/access-token-hook.sql) against
-- the LOCAL Supabase stack ONLY (the prod guard blocks remote targets).
--
-- This minimal seed gives you a working SUPER_ADMIN login out of the box:
--     email:    admin@bookia.local
--     password: devpassword123
--
-- For realistic data, run `npm run db:dump:prod` (read-only, sanitized) — it
-- OVERWRITES this file with a scrubbed snapshot of production. Until then this
-- bootstrap row is enough to log in and click around.
-- =============================================================================

create extension if not exists pgcrypto;

-- Stable UUID for the local super admin (used across auth.users / public."User" / ShopMember)
do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  -- 1. Supabase auth user (GoTrue) ------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    -- GoTrue scans these into non-nullable strings; leaving them NULL breaks
    -- login with "Database error querying schema". Must be '' (empty), not NULL.
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  values (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'admin@bookia.local',
    crypt('devpassword123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Local Super Admin"}'::jsonb,
    now(), now(),
    '', '', '', '', '', '', '', ''
  )
  on conflict (id) do nothing;

  -- 2. Auth identity (email provider) --------------------------------------------
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), admin_id, admin_id::text,
    jsonb_build_object('sub', admin_id::text, 'email', 'admin@bookia.local', 'email_verified', true),
    'email', now(), now(), now()
  )
  on conflict (provider, provider_id) do nothing;

  -- 3. Prisma public."User" mirror ------------------------------------------------
  insert into public."User" (id, email, name, "updatedAt")
  values (admin_id, 'admin@bookia.local', 'Local Super Admin', now())
  on conflict (id) do nothing;

  -- 4. Demo shop ------------------------------------------------------------------
  insert into public."Shop" (id, name, slug, "updatedAt")
  values ('shop-1', 'Barbería Demo', 'barberia-demo', now())
  on conflict (id) do nothing;

  -- 5. Grant SUPER_ADMIN membership (drives the JWT hook's app_metadata.role) ------
  insert into public."ShopMember" (id, "userId", "shopId", role, "updatedAt")
  values ('sa-local-bootstrap', admin_id, 'shop-1', 'SUPER_ADMIN', now())
  on conflict ("userId", "shopId") do update set role = 'SUPER_ADMIN';
end $$;
