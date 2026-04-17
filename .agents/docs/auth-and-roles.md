# Autenticación y Gestión de Roles

Bookia utiliza **Supabase Auth** para la gestión de identidades y **Prisma** para el control de acceso granular (RBAC) a nivel de tienda.

## 1. Integración Supabase-Prisma
- **ID de Usuario**: El `id` en Supabase Auth (UUID) se usa como clave primaria en la tabla `User` de Prisma.
- **Flujo de Acceso**:
  1. El usuario se autentica en Supabase.
  2. `getAdminUser()` extrae el usuario y sus metadatos (app_metadata).
  3. Se consultan las membresías en la tabla `ShopMember` para determinar permisos locales si los claims no están presentes.

## 2. Roles del Sistema
Se definen en el enum `Role` de Prisma y se reflejan en Supabase Auth:

- **SUPER_ADMIN**: Acceso global. Bypass de filtros de `shopId` locales.
- **OWNER**: Dueño de tienda. Control total sobre su `shopId`.
- **STAFF**: Empleado. Acceso operativo limitado a su `shopId`.
- **CUSTOMER**: Cliente con membresía en la tienda.

### Resumen de Privilegios
| Nivel | Rol | Alcance | Permisos Clave |
| :--- | :--- | :--- | :--- |
| 1 | `SUPER_ADMIN` | Global | Configuración de sistema, bypass multitenant. |
| 2 | `OWNER` | Shop | Gestión de staff, servicios y finanzas de tienda. |
| 3 | `STAFF` | Shop | Gestión de agenda propia y citas asignadas. |
| 4 | `CUSTOMER` | Shop | Reservas y perfil personal. |

## 3. Validación de Acceso en Server Components
La función `requireAdmin(targetShopId)` es la guardiana de las rutas administrativas:
1.  **Verificación Global**: Si el usuario es Super Admin, tiene acceso total.
2.  **Verificación Local**: Si no es Super Admin, se valida que tenga una membresía activa con rol `OWNER` o `STAFF` que **coincida exactamente** con el `targetShopId` solicitado.
3.  **Mandatorio**: Se **DEBE** pasar el `shopId` o `slug` verificado de la URL a `requireAdmin()`. Llamar a esta función sin parámetros debilita el aislamiento multi-tenant en usuarios con acceso a múltiples tiendas.
4.  **Redirección Forzada**: Si falla, redirige instantáneamente fuera del área administrativa.

### 4. Hardening de Login Contextual
En flujos de login por tienda (`signInToShop`), se debe validar la existencia del `slug` antes de la autenticación. 
- **Razones**: Mejor UX (error instantáneo para URL errónea) e impedimento de ataques de enumeración sobre tenants no existentes.
- **Implementación**: Ver `app/auth/actions.ts`.

```typescript
const shop = await getShopBySlug(slug);
if (!shop) throw new Error("La tienda no existe o el enlace es incorrecto");
```


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

## 5. Super Admin en Server Actions Públicas (Patrón Crítico)

En Server Actions que **no usan `requireAdmin`** (como `createBooking` en `app/schedule/actions.ts`), la verificación de Super Admin **NO** puede depender únicamente de `app_metadata.role` del JWT. El rol puede haberse asignado directamente en la DB sin actualizar el claim JWT.

**Patrón correcto — doble cobertura:**
```typescript
const globalRoleFromJwt = authUser.app_metadata?.role as string | undefined

const membership = await prisma.shopMember.findUnique({
  where: { userId_shopId: { userId: authUser.id, shopId } }
})

const isSuperAdmin =
  globalRoleFromJwt === "SUPER_ADMIN" || membership?.role === "SUPER_ADMIN"

const isAuthorized =
  isSuperAdmin || (membership && ["OWNER", "STAFF"].includes(membership.role))
```

> [!CAUTION]
> Nunca verificar solo el JWT claim para Super Admin en acciones críticas. Siempre incluir el fallback de DB.

## 6. Acceso por Rol en Configuración (OWNER-only)

Para funcionalidades restringidas a `OWNER` y `SUPER_ADMIN` (y no `STAFF`), usa `requireAdmin` normalmente y luego verifica el rol devuelto:

```typescript
const session = await requireAdmin(shopId)
if (!session.isSuperAdmin && session.role !== "OWNER") {
  redirect(`/${slug}/admin`) // o throw new Error()
}
```
