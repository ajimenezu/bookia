-- =============================================================================
-- Custom Access Token Hook — LOCAL parity with production
-- =============================================================================
-- This reproduces the production multi-tenant JWT hook (../../supabase_multitenant_hook.sql)
-- for the LOCAL Supabase stack, PLUS the grants that production configured via the
-- Supabase dashboard (which are not captured in the dashboard-applied hook file).
--
-- Applied automatically by `npm run db:seed` against the LOCAL database only.
-- The hook itself is registered in supabase/config.toml ([auth.hook.custom_access_token]).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
declare
  claims jsonb;
  uid uuid;
  is_super_admin boolean;
  db_member_role text;
  db_shop_id text;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  uid := (event ->> 'user_id')::uuid;

  -- 1. Is the user SUPER_ADMIN in ANY shop?
  select exists(
    select 1 from public."ShopMember"
    where "userId" = uid and "role" = 'SUPER_ADMIN'
  ) into is_super_admin;

  -- 2. Super admins get the global role + full access (no specific shop_id needed)
  if is_super_admin then
    if jsonb_typeof(claims->'app_metadata') is null then
      claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
    end if;
    claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb('SUPER_ADMIN'::text), true);
    claims := jsonb_set(claims, '{app_metadata, is_super_admin}', to_jsonb(true), true);
  else
    -- 3. Otherwise pick their most important membership: OWNER > STAFF > CUSTOMER
    select m."role"::text, m."shopId"
      into db_member_role, db_shop_id
      from public."ShopMember" m
      where m."userId" = uid
      order by
        case m."role"
          when 'OWNER' then 1
          when 'STAFF' then 2
          else 3
        end
      limit 1;

    if db_member_role is not null then
      if jsonb_typeof(claims->'app_metadata') is null then
        claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
      end if;
      claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(db_member_role), true);
      claims := jsonb_set(claims, '{app_metadata, shop_id}', to_jsonb(db_shop_id), true);
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Grants: GoTrue runs as `supabase_auth_admin` and must be able to call the hook.
-- The hook reads public."ShopMember"; SECURITY DEFINER runs it as the owner, but
-- we grant select explicitly to match Supabase's documented hook setup.
-- -----------------------------------------------------------------------------
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on table public."ShopMember" to supabase_auth_admin;

-- The hook must NOT be callable by normal API roles.
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
