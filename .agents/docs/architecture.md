# Arquitectura Multi-tenant en Bookia

Este proyecto está diseñado para soportar múltiples negocios (Barberías, Spas, etc.) bajo una sola base de código, aislando los datos y la personalización visual.

## 1. Identificación del Tenant (Slug)
Toda la lógica de usuario y administración reside bajo el segmento dinámico `app/[slug]/`.
- El `slug` es el identificador único legible del negocio.
- **Acceso Directo**: `/[slug]/` -> Landing page del negocio.
- **Administración**: `/[slug]/admin/` -> Panel de control.

- **Shop**: Entidad principal que define el negocio (`id`, `slug`, `businessType`).
- **User**: Usuarios globales vinculados a Supabase Auth.
- **ShopMember**: Relación N:M que asigna un `Role` a un `User` dentro de un `Shop`.

### 2.1 Deduplicación de Consultas (Deduplicated Lookups)
Para optimizar el rendimiento y evitar múltiples llamadas a la base de datos en una misma solicitud (Layout + Page + Componentes), se utiliza **`react.cache`**.
- **`lib/shop.ts`**: Repositorio centralizado para obtener datos de la tienda.
    - `getShopBySlug(slug)`: Cacheado por request.
    - `getShopById(id)`: Cacheado por request.
- **Uso Obligatorio**: En Server Components, usa siempre `getShopBySlug` o `getShopById` en lugar de llamar directamente a `prisma.shop` para beneficiarte del cache de Next.js.

### 3. Aislamiento de Datos (Regla de Oro)
Cualquier consulta a la base de datos **DEBE** incluir el filtro de `shopId` en la misma query de Prisma. Esto aplica tanto a rutas de administración como a flujos públicos (ej. reservas).
- **Inseguro**: `findUnique({ where: { id } })` + check manual posterior.
- **Seguro**: `findUnique({ where: { id, shopId } })` o `findMany({ where: { id: { in: ids }, shopId } })`.
- **CRÍTICO**: El error más común es filtrar por ID pero olvidar el `shopId` en flujos de "Schedule".


### 4. Capa de Sanitización Obligatoria (Zod)
Para prevenir inyecciones y asegurar la integridad del multi-tenancy, **todos los Server Actions y APIs** deben ser validados con `zod`:
- **Validación Primaria**: Antes de procesar cualquier lógica, el input se pasa por un esquema estricto (`safeParse`).
- **Validación de Tenant**: El `shopId` verificado (desde la URL o sesión admin) se usa obligatoriamente en las queries.


```typescript
const validated = schema.parse({ ...formData, shopId: resolvedShopId });
```

## 4. Tipos de Negocio
El campo `BusinessType` en el modelo `Shop` define el comportamiento y estilo:
- `BARBERIA`
- `SALON_BELLEZA`
- `SPA`
- `CLINICA`

---
> [!NOTE]
> Este documento sirve como guía para agentes y desarrolladores para mantener la consistencia del multi-tenancy.
