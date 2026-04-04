---
description: Flujo para verificar que los nuevos componentes siguen el diseño y arquitectura multi-tenant.
---

# Verificación de Consistencia (Diseño y Estructura)

Este workflow ayuda a revisar el código nuevo para asegurar que cumple con los estándares del proyecto.

## 1. Análisis de Componentes UI
Revisar el uso de tokens CSS variables y la estética del componente.

1.  Identificar archivos nuevos en `components/`.
2.  Verificar que no haya colores hardcodeados (no hex, no rbg, no `text-white`).
3.  Comprobar el uso de OKLCH.

## 2. Validación de Multi-tenancy
Asegurar que todas las consultas a la DB están filtradas correctamente.

1.  Revisar Server Actions o Pages dinámicas.
2.  Confirmar que se use `prisma.shop.findFirst({ where: { slug } })` o similar.
3.  Validar que todas las mutaciones tengan `shopId`.

## 3. Validación de Skeletons (Loading)
Asegurar que la experiencia de carga es fluida.

1.  Verificar que exista un `loading.tsx` por cada `page.tsx`.
2.  Comprobar que el Layout estructural de `loading.tsx` sea idéntico al de `page.tsx`.
3.  Validar que se usen componentes `<Skeleton />` en lugar de spinners o pantallas en blanco.

---
> [!TIP]
> Cualquier componente que use un `ID` genérico debe ser reemplazado por un UUID o CUID descriptivo para asegurar que el navegador identifique cada tienda por separado.
