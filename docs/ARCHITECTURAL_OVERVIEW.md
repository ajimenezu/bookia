# Architectural Overview

This document outlines the high-level architecture of the Booking Demo application, focusing on data flow, authentication, and multitenancy.

## 🏗 System Architecture

The application is built on the **Next.js App Router** architecture, leveraging **Prisma** as the ORM and **Supabase** for Backend-as-a-Service (DB & Auth).

### Data Flow
1. **Server Components:** Most pages are implemented as Server Components to fetch data directly from the Supabase PostgreSQL database using Prisma.
2. **Server Actions:** Mutations (like booking an appointment or logging in) are handled via Server Actions (`app/auth/actions.ts`, `app/schedule/actions.ts`), ensuring secure, server-side execution.
3. **Data Access Layer:** We use dedicated utility files under `lib/` (e.g., `lib/appointments.ts`, `lib/availability.ts`, `lib/date-utils.ts`) to centralize complex Prisma queries and business logic. This drastically cleans up Server Components and Actions.
4. **ORM Layer:** `lib/prisma.ts` provides a global Prisma client instance, ensuring efficient connection pooling.

## 🔐 Authentication & RBAC

We use **Supabase Auth** for identity management, combined with a custom `User` and `ShopMember` tables in Prisma to manage application-level roles.

### Roles & Shop Memberships
A single `User` can have multiple different roles across different `Shop` instances using the `ShopMember` table.
- **SUPER_ADMIN:** (Global User Role) Global system access, bypasses shop-specific constraints.
- **OWNER:** (ShopMember Role) Full access to shop settings, staff management, and financial summaries.
- **STAFF:** (ShopMember Role) Access to personal schedule and appointment management.
- **CUSTOMER:** (ShopMember/Global Role) Access to booking history and profile.

### Redirect Logic
Upon successful login (`signIn` action), the application fetches the user's role and memberships context:
- `SUPER_ADMIN` / `OWNER` / `STAFF` -> `/admin` or `/[slug]/admin`
- `CUSTOMER` -> `/schedule`

## 🏢 Multitenancy & Data Models

The schema supports multitenancy through the `Shop` model. 
- **Shop Association:** All `User` (via `ShopMember`), `Service`, and `Appointment` records are tied to a `ShopId`. This allows the platform to support multiple independent businesses on the same infrastructure.
- **Multi-Service Appointments:** The `Appointment` model supports multiple services via an implicit many-to-many relationship. To preserve historical records against future price or service name changes, we implement a **Historical Snapshotting** pattern:
  - `priceAtBooking`: The total price at the moment of creation.
  - `serviceDetails`: A JSON array storing the exact names and prices of services at that moment.
  - **Resolution Rule**: Use `@/lib/appointments.ts` to resolve data in order: Snapshot > Relation > Legacy Fallback.

## 🎨 Dynamic Experience & Terminology
The platform is designed to be business-agnostic:
- **Terminology System**: The `getTerminology(businessType)` utility translates generic concepts (e.g., "Service", "Staff") into business-specific terms (e.g., "Corte", "Barbero") used throughout the UI.
- **Shop Theming**: Shop-specific `oklch` tokens are injected into the `:root` via `BusinessThemeProvider` to ensure all components, including Radix Portals, reflect the brand's identity.

## 🛠 Shared Libraries
- **@prisma/client:** Type-safe database access.
- **@supabase/ssr:** Helpers for using Supabase in Next.js Server Components and Server Actions.
- **lucide-react:** Consistent iconography across the dashboard.

## 💾 Development Standards
- **Validation**: Strict **Zod schemas** required for all Server Actions to prevent malformed data and cross-tenant leakage.
- **Timezone**: All application logic operates on `America/Costa_Rica` time. Absolute dates are stored as UTC but always interpreted via `@/lib/date-utils`.
- **Layout Stability**: Stable UI elements (headers, actions) must remain in Server Components to avoid "jumping" layouts during `Suspense` data resolution.
