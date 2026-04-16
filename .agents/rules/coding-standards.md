# Estándares de Código y Calidad

> [!IMPORTANT]
> **REGLA MAESTRA (AUDITORÍA AUTOMÁTICA)**: 
> Antes de dar por finalizada cualquier tarea de desarrollo o cambio significativo, el agente **DEBE** ejecutar y reportar los resultados de los workflows especializados:
> 1.  **`/code-review`**: Para validar calidad, sanitización y consistencia UI.
> 2.  **`/security-review`**: Para asegurar el aislamiento y protección del código.
3.  **`/check-consistency`**: Para verificar la sincronía entre Layout, Page y Skeletons.

## 0. Rendimiento y Caching (Request-Level)
- **`react.cache`**: Se debe usar `react.cache` en utilidades fundamentales que se llamen múltiples veces por renderizado.
    - **Dictionaries**: `getTerminology` en `lib/dictionaries.ts` está cacheado.
    - **Shop Lookups**: `getShopBySlug` y `getShopById` en `lib/shop.ts`.
- **Regla**: Nunca llamar a `prisma.shop` directamente desde un componente si existe una versión cacheada en `lib/`.

## 1. Organización del Código y Estándares JS/TS
- **Imports**: Los imports deben estar **siempre** en la parte superior del archivo. Nunca añadas imports dentro de funciones o en medio del código a menos que sea un `import()` dinámico justificado.
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
- **Iconografía Coherente**: Asegurar que los iconos hereden o declaren explícitamente el color del token de texto asociado para mantener el balance visual y la cohesión.

## 4. Estructura de Archivos y Reusabilidad
- **Patrón DRY (Don't Repeat Yourself)**: Antes de crear un componente, verifica si ya existe uno similar en `components/ui/` o en las carpetas de feature. Extrae lógica común a hooks o utilitarios.
- **Componentes React Reutilizables**: Sigue las mejores prácticas de React (Props claras, composición, separación de lógica y presentación) para maximizar la reutilización y minimizar la generación de código redundante.
- **Components Folder**: Separar componentes por responsabilidad (`admin/`, `booking/`, `shop/`).
- **Server Actions**: Usar archivos `actions.ts` en cada ruta para las mutaciones, manteniendo las páginas limpias.
    - **CRÍTICO: Validación Zod**: **Toda** Server Action debe validar sus inputs con un esquema de Zod (`safeParse`) antes de cualquier operación.
    - **Aislamiento Multi-tenant**: Si la acción requiere un `shopId`, este debe ser validado contra la sesión del usuario o inyectado desde una fuente confiable, nunca aceptado ciegamente desde el cliente sin verificación.
- **Gold Standard (Admin)**: Referencia `app/[slug]/admin/servicios/actions.ts`.
- **Gold Standard (Data Fetching)**: `app/[slug]/admin/layout.tsx` (Uso de `getShopBySlug`).

## 5. Navegación Narrativa y Deep Links
- **Pre-selección de Contexto**: Al navegar entre la Landing y el flujo de reserva, se deben usar parámetros de búsqueda (`?service=X`, `?staff=Y`) para mejorar la UX. 
- **Implementación**: El componente `BookingFlow` debe leer estos parámetros en su inicialización para pre-poblar el estado del formulario.

## 6. Filtrado de Métricas de Negocio
- **Ingresos Reales**: Cualquier cálculo de "Ingresos" o "Finance" debe excluir explícitamente los estados `CANCELLED` y `NO_SHOW`.
- **Conteo de Citas**: Al mostrar "Citas totales", se debe discriminar entre citas agendadas y citas que efectivamente generaron valor (excluyendo cancelaciones).
