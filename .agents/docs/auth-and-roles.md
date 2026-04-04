# Autenticación y Gestión de Roles

Bookia utiliza **Supabase Auth** para la gestión de identidades y **Prisma** para el control de acceso granular (RBAC) a nivel de tienda.

## 1. Integración Supabase-Prisma
- **ID de Usuario**: El `id` en Supabase Auth (UUID) se usa como clave primaria en la tabla `User` de Prisma.
- **Flujo de Acceso**:
  1. El usuario se autentica en Supabase.
  2. `getAdminUser()` extrae el usuario y sus metadatos.
  3. Se consultan las membresías en la tabla `ShopMember` para determinar permisos locales.

## 2. Roles del Sistema
Se definen en el enum `Role` de Prisma:

- **SUPER_ADMIN**: Acceso global a todas las tiendas. No requiere membresía específica.
- **OWNER**: Dueño de un negocio. Control total sobre su propia tienda (`Shop`).
- **STAFF**: Empleado. Acceso a servicios y citas de la tienda asignada.
- **CUSTOMER**: Cliente. Puede agendar citas en la tienda.

## 3. Utilidades de Validación
Para proteger rutas administrativas, siempre usa `requireAdmin(shopId)` en Server Components:

```typescript
import { requireAdmin } from "@/lib/auth-utils";

export default async function AdminPage({ params }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  
  // Lanza redirect si no es ADMIN/OWNER de esta tienda
  const { role, user } = await requireAdmin(shop.id);
  
  // ... lógica segura ...
}
```

---
> [!IMPORTANT]
> Un usuario puede ser `OWNER` de una tienda y `CUSTOMER` de otra. Las membresías son aisladas por `shopId`.
