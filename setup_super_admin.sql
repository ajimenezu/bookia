-- 1. Asegúrate de que el Hook esté actualizado (ejecuta el archivo supabase_multitenant_hook.sql primero)

-- 2. Crea un Negocio de ejemplo
INSERT INTO public."Shop" (id, name, slug, "updatedAt")
VALUES ('shop-1', 'Barbería Demo', 'barberia-demo', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Promueve a tu usuario a SUPER_ADMIN (reemplaza 'TU-ID-AQUÍ')
-- Encuentra tu ID en Auth -> Users
-- Ahora los Super Admins se definen en la tabla ShopMember
INSERT INTO public."ShopMember" (id, "userId", "shopId", role, "updatedAt")
VALUES ('sa-' || gen_random_uuid(), 'TU-ID-AQUÍ', 'shop-1', 'SUPER_ADMIN', NOW())
ON CONFLICT ("userId", "shopId") DO UPDATE SET role = 'SUPER_ADMIN';
