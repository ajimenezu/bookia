-- 1. Asegúrate de que el Hook esté actualizado (ejecuta el archivo supabase_multitenant_hook.sql primero)

-- 2. Crea un Negocio de ejemplo
INSERT INTO public."Shop" (id, name, slug, "updatedAt")
VALUES ('shop-1', 'Barbería Demo', 'barberia-demo', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Promueve a tu usuario a SUPER_ADMIN (reemplaza 'TU-ID-AQUÍ')
-- Encuentra tu ID en Auth -> Users
UPDATE public."User" 
SET role = 'SUPER_ADMIN' 
WHERE id = 'TU-ID-AQUÍ';

-- 4. Opcional: Asígnate como Dueño de la barbería
INSERT INTO public."ShopMember" (id, "userId", "shopId", role, "updatedAt")
VALUES ('mem-1', 'TU-ID-AQUÍ', 'shop-1', 'OWNER', NOW())
ON CONFLICT DO NOTHING;
