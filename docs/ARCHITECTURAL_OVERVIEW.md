# Architectural Overview

This document outlines the high-level architecture of the Booking Demo application, focusing on data flow, authentication, and multitenancy.

## 🏗 System Architecture

The application is built on the **Next.js App Router** architecture, leveraging **Prisma** as the ORM and **Supabase** for Backend-as-a-Service (DB & Auth).

### Data Flow
1. **Server Components:** Most pages are implemented as Server Components to fetch data directly from the Supabase PostgreSQL database using Prisma.
2. **Server Actions:** Mutations (like booking an appointment or logging in) are handled via Server Actions (`app/auth/actions.ts`), ensuring secure, server-side execution.
3. **ORM Layer:** `lib/prisma.ts` provides a global Prisma client instance, ensuring efficient connection pooling.

## 🔐 Authentication & RBAC

We use **Supabase Auth** for identity management, combined with a custom `User` table in Prisma to manage application-level roles.

### Roles (Enums)
- **SUPER_ADMIN:** Global system access, bypasses shop-specific constraints.
- **OWNER:** Full access to shop settings, staff management, and financial summaries.
- **STAFF:** Access to personal schedule and appointment management.
- **CUSTOMER:** Access to booking history (future implementation) and profile.

### Redirect Logic
Upon successful login (`signIn` action), the application fetches the user's role from the database and redirects:
- `SUPER_ADMIN` / `OWNER` / `STAFF` -> `/admin`
- `CUSTOMER` -> `/schedule`

## 🏢 Multitenancy

The schema supports multitenancy through the `Shop` model. 
- All `User`, `Service`, and `Appointment` records are tied to a `ShopId`.
- This allows the platform to theoretically support multiple independent businesses on the same infrastructure.

## 🛠 Shared Libraries
- **@prisma/client:** Type-safe database access.
- **@supabase/ssr:** Helpers for using Supabase in Next.js Server Components and Server Actions.
- **lucide-react:** Consistent iconography across the dashboard.

## 💾 Data Fetching Standards
- **Centralized Logic:** Core business calculations, such as schedule availability and database conflict checking, are centralized within `lib/` utilities (e.g., `lib/availability.ts`). This prevents duplication across Server Actions and ensures consistency.
- **Server Components:** Utilized by default for secure, fast read-only rendering, delegating mutations exclusively to Server Actions.
