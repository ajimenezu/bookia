-- Función de Auth Hook para el nuevo esquema Multi-tenant
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

  -- 1. Verificamos si el usuario tiene rol SUPER_ADMIN en ALGUNA tienda
  select exists(
    select 1 from public."ShopMember" 
    where "userId" = uid and "role" = 'SUPER_ADMIN'
  ) into is_super_admin;
  
  -- 2. Si es SUPER_ADMIN, le damos el rol global y acceso total (no necesita shop_id específico)
  if is_super_admin then
    if jsonb_typeof(claims->'app_metadata') is null then
      claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
    end if;
    claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb('SUPER_ADMIN'::text), true);
    claims := jsonb_set(claims, '{app_metadata, is_super_admin}', to_jsonb(true), true);
  else
    -- 3. Si no es súper admin, buscamos su membresía más importante
    -- Priorizamos OWNER > STAFF > CUSTOMER
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
