# Arquitectura Multi-tenant en Bookia

Este proyecto está diseñado para soportar múltiples negocios (Barberías, Spas, etc.) bajo una sola base de código, aislando los datos y la personalización visual.

## 1. Identificación del Tenant (Slug)
Toda la lógica de usuario y administración reside bajo el segmento dinámico `app/[slug]/`.
- El `slug` es el identificador único legible del negocio.
- **Acceso Directo**: `/[slug]/` -> Landing page del negocio.
- **Administración**: `/[slug]/admin/` -> Panel de control.

## 2. Modelos Core (Prisma)
- **Shop**: Entidad principal que define el negocio (`id`, `slug`, `businessType`).
- **User**: Usuarios globales vinculados a Supabase Auth.
- **ShopMember**: Relación N:M que asigna un `Role` a un `User` dentro de un `Shop`.

## 3. Aislamiento de Datos (Regla de Oro)
Cualquier consulta a la base de datos **DEBE** incluir el filtro de `shopId` en la misma query de Prisma. 
- **Inseguro**: `findUnique({ where: { id } })` + check manual posterior.
- **Seguro**: `findUnique({ where: { id, shopId } })`.

## 4. Capa de Sanitización Obligatoria (Zod)
Para prevenir inyecciones y asegurar la integridad del multi-tenancy, todos los inputs de usuario deben ser validados con `zod`:
- **Validación Primaria**: Antes de procesar cualquier lógica, el input se pasa por un esquema estricto.
- **Inyección de Tenant**: El `shopId` verificado se inyecta en el objeto de datos **antes** de la validación final.

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
