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

## 3. Aislamiento de Datos
Cualquier consulta a la base de datos **DEBE** incluir el filtro de `shopId`.
```typescript
// Ejemplo de consulta segura
const services = await prisma.service.findMany({
  where: { shopId: shop.id }
});
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
