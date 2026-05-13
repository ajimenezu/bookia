---
description: Pre-commit PR audit covering Zod validation, code reusability, and UI consistency.
---

# PR Quality & Consistency Review

## 1. Input Sanitization (BLOCKING)
- **FAIL IF**: Server Action or API lacks `zod` schema validation for `formData`/`json`.
- **FAIL IF**: TypeScript types mismatch Zod schemas.
- **FAIL IF**: Unescaped raw HTML output.

## 2. UI/UX Consistency
- **Check**: `loading.tsx` precisely mimics `page.tsx` skeleton.
- **Check**: Mobile-first responsive design works flawlessly before desktop breakpoints.
- **Check**: Strictly uses OKLCH tokens (`bg-primary`, `text-muted`).
- **Check**: Admin history lists (e.g., appointments in client details) limited to **last 5 entries** in chronological order.
- **Check**: Side panels/Sheets containing long content (e.g., staff/client details) are explicitly **scrollable**.
- **Check**: Uses dynamic dictionary labels instead of hardcoded strings (e.g., "Staff" vs "Barber") to ensure business-type compatibility.

## 3. DRY & Reusability
- **Check**: Duplicated logic that exists in `components/admin/` or `ui/`.
- **Centralized Logic**: Appointment price calculations MUST use `@/lib/appointments.ts` (`calculateAppointmentPrice`) to handle snapshots and historical service arrays consistently.
- **Action**: Extract repeated chunks into reusable components.

**Result Scale**: PASSED | PENDING (Needs Refactoring) | FAILED (Security Risk)
