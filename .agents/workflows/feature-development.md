---
description: Comprehensive checklist for developing new features, including UI generation and admin routing.
---

# Feature & UI Development

## 0. Core AI Directives
- **Knowledge**: ALWAYS consult KIs/KB first. Use as few tokens as possible while maintaining high quality.
- **Planning**: ALWAYS present an Implementation Plan and ask necessary questions *before* proceeding with code changes.
- **Standards**: Strictly follow Next.js, React, Tailwind, Prisma, and Supabase best practices.
- **Holistic Design**: Ensure Security, UI/UX (premium glassmorphism), Accessibility, SEO, and current app patterns are integrated.

## 1. Routing & Guards
- **Location**: `app/[slug]/admin/[feature]/page.tsx`
- **Guard**: MUST use `await requireAdmin(shop.id)`
- **Redirection**: Use centralized logic in `lib/auth-utils.ts` for consistent redirection patterns.
- **Data Fetch**: Derive `shopId` from `params.slug` via DB.

## 2. Design System & Tokens
- **Colors**: Use `oklch` variables (e.g., `text-foreground`, `bg-primary`). NO hardcoded hex/rgb.
- **Glassmorphism**: Use `.glass-card` (`bg-background/50 backdrop-blur-md border border-border/50`) for panels.
- **Micro-animations**: Interactive elements require `hover:bg-accent/50 transition-colors`.
- **Icons & Fonts**: `lucide-react` (strokeWidth=1.5). Font: `Geist` (`font-sans`), `font-mono` for IDs.

## 3. Layout & Skeletons
- **Responsiveness**: Mobile-first (`flex-col` -> `md:flex-row`).
- **Loading State**: `loading.tsx` MUST perfectly match `page.tsx` skeleton layout.
- **UI Stability**: To prevent layout "jumping" when `Suspense` resolves, keep high-level layout elements (like headers and "Create" buttons) at the page level (Server Component) rather than inside the suspended Client Component.
- **Pagination**: Implement server-side pagination (10 per page) with infinite scroll for administrative lists (e.g., Client list).
- **IDs**: Use unique UUID/CUID for elements to ensure multi-tenant auto-fill isolation.

*(Refs: `admin_guidelines.md`, `ui_standards.md`)*
