# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project knowledge base — `.agents/` (READ FIRST)

`.agents/` is the canonical, portable brain for this project (originally followed via the Antigravity editor). **Treat it as authoritative and consult it before non-trivial work** — these files are the source of truth; this CLAUDE.md only summarizes them.

- `.agents/rules/` — enforced conventions: `coding-standards.md`, `database-safety.md`, `staff-scheduling.md`.
- `.agents/docs/` — architecture knowledge: `architecture.md`, `auth-and-roles.md`, `booking-logic.md`, `design-system.md`.
- `.agents/workflows/` — operational checklists: `feature-development.md`, `security-audit.md`, `pr-review.md`, `booking-audit.md`, `devops.md`, `agent-maintenance.md`.

Many of these are written in Spanish; the codebase mixes Spanish (route names like `citas`/`clientes`/`servicios`, rule docs) and English. Match local context.

### Mandatory workflow protocol
- **Plan first.** For features/significant changes, present an implementation plan and ask open questions *before* writing code (`feature-development.md` §0).
- **Audit before finishing.** Before considering any significant change done, run the project's audit checklists and report results. In Claude Code these map to:
  - `/security-review` → enforces `.agents/workflows/security-audit.md` (multi-tenant isolation, RBAC, injection).
  - `/code-review` → enforces `.agents/workflows/pr-review.md` (Zod validation, DRY, UI consistency, Prisma data layer).
  - Manually verify consistency between `layout.tsx`, `page.tsx`, and `loading.tsx` skeletons.
- **Knowledge auto-update** (`agent-maintenance.md`): when you discover a new pattern/rule, update the relevant `.agents/` file locally in dense English bullets and tell the user — do **not** auto-commit/push.

## Commands

```bash
npm run dev          # next dev
npm run build        # prisma generate && next build
npm run start        # production server
npm run lint         # eslint .

npx prisma generate  # regenerate client (run after editing schema.prisma)
npx prisma db push   # push schema (prototyping). NEVER --force-reset without explicit user approval
npx prisma studio    # local DB browser
npx tsc --noEmit     # REAL typecheck — next.config.mjs ignoreBuildErrors means `build` won't catch type errors
```

### Local development — isolated Supabase (NEVER use prod, see `docs/LOCAL_DEV.md`)
Developers run a full local Supabase stack in Docker; prod creds live only in Vercel. Local config is in **`.env`** (both Prisma CLI and Next read it — do NOT keep a `.env.local` with prod values, it overrides `.env` and silently points the app at prod).

```bash
npm run supabase:start   # boot local Postgres + Auth + Studio (Docker)
cp .env.example .env     # local config (points at 127.0.0.1)
npm run db:reset         # Prisma migrate reset + db:seed (JWT hook + seed data)
npm run db:dump:prod     # OPTIONAL: read-only PROD_DB_URL → sanitized local seed
```
`db:migrate`/`db:reset`/`db:seed` are gated by `scripts/check-not-prod.js`, which aborts unless the DB host is localhost (override: `ALLOW_NON_LOCAL_DB=1`). Default login after seed: `admin@bookia.local` / `devpassword123`.

No test runner is configured (no Jest/Vitest/Playwright, no test files).

## Architecture

Multi-tenant booking/scheduling platform. Each tenant is a **Shop**; all data is scoped by `shopId`. Stack: Next.js 16 App Router, React 19, TypeScript, Prisma (PostgreSQL), Supabase Auth, Tailwind v4 + shadcn/ui (new-york), Resend, date-fns. Path alias `@/*` → root. (Details: `.agents/docs/architecture.md`.)

### Routing (multi-tenant via `[slug]`)
- All tenant logic lives under `app/[slug]/`; `slug` is the shop's readable id. Public pages: `(landing)`, `schedule`, `register`, `login`, `profile`, `forgot-password`, `update-password`. Admin: `app/[slug]/admin/{citas,clientes,servicios,staff,configuracion}`.
- Root-level: `app/page.tsx` (marketing), `app/demo`, `app/auth/*` (OAuth callback/confirm/signout — the only API routes).
- `proxy.ts` (Next 16 middleware, via `lib/supabase/proxy.ts`) hydrates the Supabase session on every request.

### Mutations = Server Actions (`actions.ts` per route)
Mutations live in `actions.ts` files, not REST APIs. Core booking engine: `app/schedule/actions.ts`. Gold-standard reference: `app/[slug]/admin/servicios/actions.ts`. **Every Server Action MUST:**
1. Validate inputs with a Zod schema (`safeParse`) before any logic.
2. Enforce tenant isolation (see below) — `requireAdmin(shopId)` for admin actions; for public actions verify membership manually.
3. Wrap Prisma `create`/`update`/`delete` in try/catch and log errors.

### The Golden Rule — tenant isolation (`.agents/workflows/security-audit.md`, BLOCKING)
Every query on `Shop`, `Service`, `Appointment`, `ShopMember`, `StaffSchedule`, `ShopSchedule`, `StaffTimeOff` must filter by `shopId` **in the Prisma query itself** — `where: { id, shopId }`, never `where: { id }` + a manual check after. `shopId` must come from session/verified slug, never trusted client input. The most common bug is filtering by id but forgetting `shopId` in the booking/schedule flow.

### Auth & roles (`lib/auth-utils.ts`, `.agents/docs/auth-and-roles.md`)
Supabase Auth owns identity (Supabase UUID = Prisma `User.id`); Prisma `ShopMember` (unique `[userId, shopId]`) grants a `Role` **per shop**. Roles: `SUPER_ADMIN` (global, bypasses shop filters) > `OWNER` > `STAFF` > `CUSTOMER`. A user can be OWNER of one shop and CUSTOMER of another.
- `getAdminUser()` (request-cached) → user + memberships + active shop. `getRedirectPath()` routes post-login (admin/owner/staff → `/[slug]/admin`, customer → `/[slug]`).
- `requireAdmin(shopId)` guards admin routes/actions — **always pass the verified `shopId`/slug**; calling it bare weakens isolation for multi-shop users.
- OWNER-only features: call `requireAdmin(shopId)` then check `session.isSuperAdmin || session.role === "OWNER"`.
- **Critical pattern — Super Admin in public actions** (e.g. `createBooking`): never trust the JWT `app_metadata.role` alone (DB role may not be in the claim). Use double coverage — `globalRoleFromJwt === "SUPER_ADMIN" || membership?.role === "SUPER_ADMIN"`. See `auth-and-roles.md` §5.
- JWT claims come from `supabase_multitenant_hook.sql`; `setup_super_admin.sql` promotes a super admin. Supabase clients: `lib/supabase/{server,client,service-role}.ts`.

### Shop data access (cached)
Resolve shops via `getShopBySlug()` / `getShopById()` in `lib/shop.ts` (both `react.cache`d per request). **Never call `prisma.shop` directly from a component** when a cached helper exists. Same applies to `getTerminology()` in `lib/dictionaries.ts`.

### Booking & availability (`lib/availability.ts`, `.agents/docs/booking-logic.md` + `workflows/booking-audit.md`)
- **Appointments are multi-service** (many-to-many `services`; singular `serviceId` is legacy ≈ first service). End time = `startTime + sum(durations)`. All time math in minutes → ms.
- **Snapshots:** `priceAtBooking` (sum at booking) and `serviceDetails` JSON preserve price/names historically. Always resolve via `lib/appointments.ts` (`calculateAppointmentPrice`) — don't recompute from live `Service` rows.
- **Conflict check** (`checkStaffConflict`): overlap is `startTime < app.endTime && endTime > app.startTime`, filtered by `shopId`, excluding `CANCELLED` and the edited appointment's own id.
- **Slot priority:** `StaffTimeOff` (blocks) > `StaffSchedule` (personal + breaks) > `ShopSchedule` (fallback). Only `APPROVED` staff schedules count.
- **Approval flow:** STAFF edits save `PENDING`; OWNER/SUPER_ADMIN edits save `APPROVED`. After approving/updating availability, `revalidatePath` so slots recompute.
- **`staffId === "auto"`** must verify ≥1 available member with `STAFF`/`OWNER` role.

### Status & revenue rules
`AppointmentStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW. **Exclude `CANCELLED` and `NO_SHOW` from all revenue and "real" appointment-count metrics.** Past appointments (`startTime < now`) must disable cancellation.

### Notifications
Use the centralized `triggerAppointmentNotifications(appointmentId, actionType, notifyStaff)` from `@/lib/email/trigger-notifications` for all appointment emails (`actionType`: `"CREATED" | "UPDATED" | "CANCELLED"`). Never hand-fetch staff/owner/customer emails to send directly.

## UI / design system (`.agents/docs/design-system.md` + `rules/coding-standards.md`)
- **Only OKLCH tokens** from `styles/globals.css` (`bg-primary`, `text-foreground`, `text-destructive`, …). Never hardcode hex/rgb or generic Tailwind colors (`text-red-500`). Per-shop theming via `getBusinessTokens` (`lib/tokens.ts`) + `BusinessThemeProvider`; `--primary` etc. may come from `CUSTOM_BUSINESS_TOKENS`.
- **Glassmorphism** (`.glass-card`, `.glass-input`) with micro-animations (`hover:bg-accent/50 transition-colors`). Mobile-first (`flex-col` → `md:flex-row`); use `md:`/`lg:` only to expand.
- **Every `page.tsx` needs a matching `loading.tsx`** whose skeleton mirrors the page exactly (avoids CLS). Keep headers / "Create" buttons at the Page (Server Component) level, outside suspended client components.
- **Terminology:** never hardcode "Staff"/"Cita"/etc. — use `getTerminology(businessType)` (includes grammatical-gender flags).
- Business icon via `getBusinessIcon()` (`lib/business-icons.ts`); lucide-react `strokeWidth=1.5`; Geist font.
- **No `window.confirm()`** for destructive actions — use shadcn `AlertDialog`.
- Admin lists: server-side pagination (10/page) + infinite scroll; history sub-lists (e.g. client's appointments) show last 5; long sheets/side panels must be scrollable; dropdowns sized to trigger via `w-[var(--radix-dropdown-menu-trigger-width)]`.

## TypeScript / Prisma conventions
- No `any` (define types, esp. for Prisma models); avoid `@ts-ignore`; imports at top of file.
- Load relations with explicit `include` — don't assume they're loaded.
- Prisma: `set` is only valid in `update`, never in a `create` payload — use `connect`/`create` for new records.
- Trazability (notes, status changes): use a related 1:N table with author + timestamp (e.g. `AppointmentNote`), not a flat text column.

## Database safety (`.agents/rules/database-safety.md`)
Data integrity is priority #1. **Never** reset the DB or mass-delete without explicit user approval — no `prisma db push --force-reset`, no `deleteMany({})` cleanups without confirming first. Verify `schema.prisma` changes before `db push`.

## Environment variables
Required in `.env`: `DATABASE_URL` (Supabase pooler, :6543), `DIRECT_URL` (direct, :5432, for migrations), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Also used: `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. See `docs/SETUP_GUIDE.md`.
