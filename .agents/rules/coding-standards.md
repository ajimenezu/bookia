# Estándares de Código y Calidad

Para mantener la rapidez y la coherencia del proyecto Bookia, se deben seguir estas reglas:

## 1. Tipado de TypeScript
- **Prohibido el uso de `any`**: Siempre define interfaces o tipos específicos, especialmente para los modelos de Prisma.
- **Acceso Directo**: Evita el uso de `@ts-ignore` o casting forzado a menos que sea estrictamente necesario.

## 2. Desarrollo con Prisma
- **Includes Explícitos**: No asumas que las relaciones están cargadas. Usa siempre `include` de forma explícita.
- **Manejo de Errores**: Todas las mutaciones de base de datos (`update`, `create`, `delete`) deben manejarse con bloques try/catch y registrar errores.

## 3. Desarrollo de UI
- **Consistencia de Tokens**: Usa únicamente las variables CSS definidas en `globals.css`. Recuerda que `--primary` y otros pueden venir de `CUSTOM_BUSINESS_TOKENS`.
- **Mobile First**: Diseñar siempre para móvil primero. Usa breakpoints de Tailwind (`md:`, `lg:`) solo para expansión, no para corrección.
- **Loading & Skeleton Pattern**: Cada `page.tsx` **DEBE** tener su correspondiente `loading.tsx`. El layout del loading debe ser un "reflejo oscuro" (Skeleton) del de la página real para evitar saltos de layout (CLS).
- **Rich Aesthetics**: Los componentes deben ser modernos, con micro-animaciones y layouts dinámicos (Glassmorphism). No se aceptan diseños planos o minimalistas extremos sin textura visual.

## 4. Estructura de Archivos y Reusabilidad
- **Patrón DRY (Don't Repeat Yourself)**: Antes de crear un componente, verifica si ya existe uno similar en `components/ui/` o en las carpetas de feature. Extrae lógica común a hooks o utilitarios.
- **Componentes React Reutilizables**: Sigue las mejores prácticas de React (Props claras, composición, separación de lógica y presentación) para maximizar la reutilización y minimizar la generación de código redundante.
- **Components Folder**: Separar componentes por responsabilidad (`admin/`, `booking/`, `shop/`).
- **Server Actions**: Usar archivos `actions.ts` en cada ruta para las mutaciones, manteniendo las páginas limpias.

---
> [!WARNING]
> Cualquier código que use `text-white` o `bg-black` directamente en vez de los tokens de color será rechazado en la revisión de arquitectura.
