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
- **Multi-Service Appointments:** The `Appointment` model has an implicit many-to-many relationship with `Service` (`services Service[]`), allowing clients to book multiple services natively in a single continuous appointment duration. The combined price is statically snapshotted via the `priceAtBooking` property to preserve historical financial records.

## 🛠 Shared Libraries
- **@prisma/client:** Type-safe database access.
- **@supabase/ssr:** Helpers for using Supabase in Next.js Server Components and Server Actions.
- **lucide-react:** Consistent iconography across the dashboard.

## 💾 Development Standards
- **Component Reusability:** Complex UI elements must be abstracted into reusable units in `components/`. For example, Admin views utilize abstracted modules like `<CalendarView />`, `<ListView />`, and `<StatusBadge />` instead of monolithic page files.
- **Centralized Logic:** Core business calculations, such as schedule availability and complex date-ranges, are centralized within `lib/` utilities (e.g., `lib/availability.ts`, `lib/appointments.ts`). This prevents duplication and tightly couples data-gathering capabilities.
- **Server Components:** Utilized by default for secure, fast read-only rendering, delegating mutations exclusively to Server Actions.
