#!/usr/bin/env bash
# =============================================================================
# dump-prod-sanitized.sh
# -----------------------------------------------------------------------------
# Builds a SANITIZED local seed from production data, WITHOUT ever committing
# real PII. Flow:
#
#   prod (READ-ONLY)  --copy public data-->  local Supabase DB
#   local DB          --anonymize emails/names/phones in place-->
#   local DB          --synthesize auth.users/identities (shared dev password)-->
#   local DB          --re-export as INSERTs-->  supabase/seed/seed.sql  (clean)
#
# Only the scrubbed file is shared. Raw prod rows live transiently in the local
# DB of whoever runs this, and are overwritten on the next `npm run db:reset`.
#
# Requirements: psql + pg_dump (libpq, e.g. `brew install libpq`), a RUNNING
# local Supabase stack (`npm run supabase:start`) on a freshly reset schema
# (`npm run db:reset`), and a READ-ONLY prod connection string.
#
# Usage:
#   PROD_DB_URL="postgresql://readonly_user:***@db.<ref>.supabase.co:5432/postgres" \
#     npm run db:dump:prod
#
# The single shared dev password for every seeded user is below.
# =============================================================================
set -euo pipefail

DEV_PASSWORD="${DEV_PASSWORD:-devpassword123}"
LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
SEED_OUT="$(cd "$(dirname "$0")/.." && pwd)/supabase/seed/seed.sql"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

# --- Preflight ---------------------------------------------------------------
command -v psql >/dev/null    || { red "✖ psql not found. Install libpq (brew install libpq) and add it to PATH."; exit 1; }
command -v pg_dump >/dev/null || { red "✖ pg_dump not found. Install libpq (brew install libpq)."; exit 1; }

: "${PROD_DB_URL:?Set PROD_DB_URL to a READ-ONLY production connection string}"

# Guard: PROD_DB_URL must NOT be local, LOCAL_DB_URL MUST be local.
prod_host="$(printf '%s' "$PROD_DB_URL" | sed -E 's#^[a-z]+://[^@]*@([^:/]+).*#\1#')"
local_host="$(printf '%s' "$LOCAL_DB_URL" | sed -E 's#^[a-z]+://[^@]*@([^:/]+).*#\1#')"
case "$local_host" in
  localhost|127.0.0.1|::1) ;;
  *) red "✖ LOCAL_DB_URL host is '$local_host' — must be localhost/127.0.0.1. Aborting."; exit 1;;
esac
case "$prod_host" in
  localhost|127.0.0.1|::1) red "✖ PROD_DB_URL points at localhost — that's not prod. Aborting."; exit 1;;
esac

# Confirm local stack is up and schema is migrated.
if ! psql "$LOCAL_DB_URL" -tAc "select 1 from public._prisma_migrations limit 1" >/dev/null 2>&1; then
  red "✖ Local DB not reachable or schema not migrated."
  echo "  Run:  npm run supabase:start  &&  npm run db:reset   then retry."
  exit 1
fi

blue "▶ Source (prod, READ-ONLY): $prod_host"
blue "▶ Target (local):           $local_host"
echo
red  "This reads PRODUCTION (read-only) and OVERWRITES your local DB + supabase/seed/seed.sql."
read -r -p "Type 'yes' to continue: " confirm
[ "$confirm" = "yes" ] || { echo "Aborted."; exit 1; }

# --- 1. Wipe local public data, copy prod public data in (FK checks off) ------
blue "▶ [1/4] Copying prod public data into local…"
{
  echo "set session_replication_role = replica;"
  echo "do \$\$ declare r record; begin
          for r in select tablename from pg_tables
                   where schemaname='public' and tablename <> '_prisma_migrations' loop
            execute format('truncate table public.%I cascade', r.tablename);
          end loop;
        end \$\$;"
  # Real prod data (COPY format streams fine through psql in the same session).
  pg_dump "$PROD_DB_URL" --data-only --schema=public \
    --exclude-table=public._prisma_migrations --no-owner --no-privileges
} | psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -q
green "  ✓ prod data loaded locally"

# --- 2. Anonymize PII in place ------------------------------------------------
blue "▶ [2/4] Scrubbing PII…"
psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -q <<SQL
create extension if not exists pgcrypto;

-- Users: deterministic per-id so emails stay unique and stable across runs.
update public."User" set
  email = 'user' || substr(md5(id::text),1,8) || '@example.com',
  name  = case when name is not null then 'User ' || substr(md5(id::text),1,6) else null end,
  phone = case when phone is not null then '+1000' || lpad((abs(hashtext(id::text)) % 1000000)::text, 7, '0') else null end;

-- Appointment denormalized customer fields.
update public."Appointment" set
  "customerName"  = case when "customerName"  is not null then 'Customer ' || substr(md5(id::text),1,6) else null end,
  "customerEmail" = case when "customerEmail" is not null then 'customer' || substr(md5(id::text),1,8) || '@example.com' else null end,
  "customerPhone" = case when "customerPhone" is not null then '+1000' || lpad((abs(hashtext(id::text)) % 1000000)::text, 7, '0') else null end;

-- Demo requests (sales leads).
update public."DemoRequest" set
  email = 'demo' || substr(md5(id::text),1,8) || '@example.com',
  name  = 'Demo ' || substr(md5(id::text),1,6),
  phone = '+1000' || lpad((abs(hashtext(id::text)) % 1000000)::text, 7, '0');

-- Shop WhatsApp numbers.
update public."Shop" set "whatsappPhone" = case when "whatsappPhone" is not null then '+10000000000' else null end;
SQL
green "  ✓ PII scrubbed"

# --- 3. Synthesize auth users so every seeded user can log in -----------------
blue "▶ [3/4] Building auth users (password: $DEV_PASSWORD for everyone)…"
psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -q <<SQL
-- One auth.users row per public."User", same UUID so FKs hold.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  -- '' (not NULL) — GoTrue scans these into non-nullable strings.
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
       u.email, crypt('${DEV_PASSWORD}', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('name', coalesce(u.name, '')), now(), now(),
       '', '', '', '', '', '', '', ''
from public."User" u
on conflict (id) do update
  set email = excluded.email, encrypted_password = excluded.encrypted_password;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from public."User" u
on conflict (provider, provider_id) do nothing;
SQL
green "  ✓ auth users ready"

# --- 4. Re-export the CLEAN local DB as portable INSERTs -----------------------
blue "▶ [4/4] Writing sanitized seed → supabase/seed/seed.sql…"
{
  cat <<'HEADER'
-- =============================================================================
-- LOCAL seed — SANITIZED snapshot of production (generated by
-- scripts/dump-prod-sanitized.sh). Contains NO real PII: all emails/names/phones
-- are anonymized and every user's password is the shared dev password.
-- Regenerate with `npm run db:dump:prod`. Loaded by `npm run db:seed`.
--
-- Log in as any user with email userXXXXXXXX@example.com (see public."User")
-- OR the always-present super admin appended at the bottom of this file.
-- =============================================================================
HEADER
  # auth rows FIRST (public."User" may FK to auth.users), then public data.
  pg_dump "$LOCAL_DB_URL" --data-only --column-inserts --no-owner --no-privileges \
    --table='auth.users' --table='auth.identities'
  pg_dump "$LOCAL_DB_URL" --data-only --column-inserts --no-owner --no-privileges \
    --schema=public --exclude-table=public._prisma_migrations
  # Always-available super admin login (admin@bookia.local / devpassword123).
  cat <<'ADMIN'

-- --- Guaranteed super-admin login (idempotent) -------------------------------
do $$
declare admin_id uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
          confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', admin_id,'authenticated','authenticated','admin@bookia.local',
          crypt('devpassword123', gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb,'{"name":"Local Super Admin"}'::jsonb, now(), now(),
          '','','','','','','','')
  on conflict (id) do nothing;
  insert into auth.identities (id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(), admin_id, admin_id::text,
          jsonb_build_object('sub',admin_id::text,'email','admin@bookia.local','email_verified',true),'email',now(),now(),now())
  on conflict (provider, provider_id) do nothing;
  insert into public."User" (id,email,name,"updatedAt") values (admin_id,'admin@bookia.local','Local Super Admin',now())
  on conflict (id) do nothing;
  insert into public."Shop" (id,name,slug,"updatedAt") values ('shop-1','Barbería Demo','barberia-demo',now())
  on conflict (id) do nothing;
  insert into public."ShopMember" (id,"userId","shopId",role,"updatedAt") values ('sa-local-bootstrap',admin_id,'shop-1','SUPER_ADMIN',now())
  on conflict ("userId","shopId") do update set role='SUPER_ADMIN';
end $$;
ADMIN
} > "$SEED_OUT"

green "✓ Done. Sanitized seed written to supabase/seed/seed.sql"
echo
echo "Your local DB already holds this data. To reload it from scratch later:"
echo "  npm run db:reset"
echo
echo "Log in with:  admin@bookia.local / devpassword123  (or any userXXXX@example.com / ${DEV_PASSWORD})"
