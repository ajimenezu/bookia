---
description: Guía rápida para añadir una nueva característica administrativa dentro del panel multi-tenant.
---

# Generar Nueva Característica Admin

Este workflow ayuda a un desarrollador a crear una vista administrativa en `[slug]/admin/` siguiendo todas las reglas de acceso y diseño.

## Paso 1: Crear la Ruta
Toda página administrativa nueva debe estar bajo la ruta dinámica `[slug]`.

1.  Crear carpeta en `app/[slug]/admin/nombre-feature/`.
2.  Crear `page.tsx` con el componente de la página.
3.  Cargar parámetros de la página.

## Paso 2: Validar Admin
Siempre debe requerir una sesión de administración válida.

```typescript
import { requireAdmin } from "@/lib/auth-utils";

export default async function FeaturePage({ params }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  await requireAdmin(shop.id);
  // ... resto de la lógica ...
}
```

## Paso 3: Componentes de UI
Usa los componentes premium existentes para mantener la coherencia.

- **Sidebar**: Ya está configurada para el panel admin.
- **Formularios**: Usa `shadcn/ui` y los estilos de Glassmorphism definidos.
- **Skeletons**: No olvides crear un archivo `loading.tsx` para cada ruta nueva.

---
> [!NOTE]
> Al terminar, ejecuta `/check-consistency` para asegurar que tu nueva feature cumple con todas las reglas de diseño y seguridad.
