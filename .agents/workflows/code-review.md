---
description: Agente de Code Review para asegurar calidad visual, consistencia y seguridad básica (Sanitización).
---

# Agente de Code Review (Auditoría de Calidad)

Este workflow analiza el código nuevo para asegurar que cumple con los estándares del proyecto Bookia.

## 1. Sanitización de Inputs (CRÍTICO - BLOQUEANTE)
El primer paso de cualquier revisión es asegurar que no entren datos "sucios" al sistema.

- **Checklist**:
  - [ ] ¿Toda Server Action o API usa un esquema de `zod` para validar los `formData` o `json` recibidos?
  - [ ] ¿Los tipos de TypeScript coinciden con las validaciones de Zod?
  - [ ] ¿Se están escapando caracteres especiales si se imprimen directamente en el HTML?

> [!CAUTION]
> **Bloqueo Inmediato**: Cualquier PR o código que use `params` o `body` directamente sin validación de esquema debe ser rechazado.

## 2. Consistencia UI/UX (Suele ser Sugerencia)
Mantener la estética premium y la sincronía de carga.

- **Sync Check**: ¿Existe un `loading.tsx` que sea el "Skeleton" exacto de `page.tsx`?
- **Mobile First**: ¿El diseño funciona perfectamente en móviles antes de aplicar `md:` o `lg:`?
- **Design Tokens**: ¿Se usa OKLCH (`bg-primary`, `text-muted`) en lugar de colores estáticos?

## 3. Reusabilidad y DRY
- **Checklist**:
  - [ ] ¿Se está duplicando lógica que ya existe en `components/admin/` o `ui/`?
  - [ ] ¿Se pueden extraer partes del código a componentes más pequeños y reutilizables?

---
> [!TIP]
> Al terminar la revisión, proporciona un resumen claro: **PASSED**, **PENDING (Needs Refactoring)** o **FAILED (Security Risk)**.
