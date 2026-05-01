---
description: Comprehensive checklist for developing new features, including UI generation and admin routing.
---

# Feature & UI Development

## 1. Routing & Guards
- **Location**: `app/[slug]/admin/[feature]/page.tsx`
- **Guard**: MUST use `await requireAdmin(shop.id)`
- **Data Fetch**: Derive `shopId` from `params.slug` via DB.

## 2. Design System & Tokens
- **Colors**: Use `oklch` variables (e.g., `text-foreground`, `bg-primary`). NO hardcoded hex/rgb.
- **Glassmorphism**: Use `.glass-card` (`bg-background/50 backdrop-blur-md border border-border/50`) for panels.
- **Micro-animations**: Interactive elements require `hover:bg-accent/50 transition-colors`.
- **Icons & Fonts**: `lucide-react` (strokeWidth=1.5). Font: `Geist` (`font-sans`), `font-mono` for IDs.

## 3. Layout & Skeletons
- **Responsiveness**: Mobile-first (`flex-col` -> `md:flex-row`).
- **Loading State**: `loading.tsx` MUST perfectly match `page.tsx` skeleton layout.
- **IDs**: Use unique UUID/CUID for elements to ensure multi-tenant auto-fill isolation.

*(Refs: `admin_guidelines.md`, `ui_standards.md`)*
