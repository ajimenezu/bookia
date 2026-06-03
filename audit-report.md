# PR Audit Report

## Input Sanitization (Missing Zod)
✅ Passed

## Unescaped raw HTML
- [ ] `app/page.tsx`
- [ ] `components/ui/chart.tsx`

## Prisma relation "set" during "create"
- [ ] `app/[slug]/admin/servicios/actions.ts`
- [ ] `app/schedule/actions.ts`

## Hardcoded Colors (UI/UX)
- [ ] `app/admin/perfil/cambiar-password/page.tsx` (Matched: bg-green-500, text-green-600)
- [ ] `app/layout.tsx` (Matched: #1a1a18)
- [ ] `components/auth/google-signin-button.tsx` (Matched: #4285F4, #34A853, #FBBC05...)
- [ ] `components/booking/steps/service-step.tsx` (Matched: rgba()
- [ ] `components/shop/profile-components.tsx` (Matched: bg-blue-500, text-blue-500, border-blue-500)
- [ ] `components/shop/shop-signup-form.tsx` (Matched: border-green-500, text-green-500, #4285F4...)
- [ ] `components/shop/shop-update-password-form.tsx` (Matched: border-green-500, text-green-500)
- [ ] `components/ui/chart.tsx` (Matched: #ccc, #ccc, #ccc...)
- [ ] `components/ui/toast.tsx` (Matched: text-red-300, text-red-50, ring-red-400)
- [ ] `lib/email/templates/booking-confirmation.ts` (Matched: #374151, #6b7280, #f3f4f6...)
- [ ] `lib/email/templates/booking-notification-staff.ts` (Matched: #374151, #6b7280, #374151...)
- [ ] `lib/email/theme.ts` (Matched: #e4ac59, #e4ac59, #080706...)

## Hardcoded Dictionary Labels (UI/UX)
- [ ] `app/[slug]/(landing)/page.tsx` (Matched: "STAFF")
- [ ] `app/[slug]/admin/citas/page.tsx` (Matched: "STAFF")
- [ ] `app/[slug]/admin/clientes/actions.ts` (Matched: "STAFF")
- [ ] `app/[slug]/admin/servicios/page.tsx` (Matched: "STAFF")
- [ ] `app/[slug]/admin/staff/actions.ts` (Matched: "STAFF")
- [ ] `app/[slug]/admin/staff/page.tsx` (Matched: "STAFF")
- [ ] `app/[slug]/schedule/page.tsx` (Matched: "STAFF")
- [ ] `app/[slug]/update-password/actions.ts` (Matched: "STAFF")
- [ ] `app/auth/actions.ts` (Matched: "STAFF")
- [ ] `app/schedule/actions.ts` (Matched: "STAFF")
- [ ] `components/admin/appointments/appointments-content.tsx` (Matched: "STAFF")
- [ ] `components/admin/create-user-modal.tsx` (Matched: 'STAFF')
- [ ] `components/admin/dashboard-content.tsx` (Matched: "Staff")
- [ ] `components/admin/dashboard-data-wrapper.tsx` (Matched: "STAFF")
- [ ] `components/booking/booking-flow.tsx` (Matched: "barber")
- [ ] `components/landing/dashboard-preview.tsx` (Matched: "Staff")
- [ ] `components/shop/shop-navbar.tsx` (Matched: "STAFF")
- [ ] `lib/auth-utils.ts` (Matched: "STAFF")
- [ ] `lib/availability.ts` (Matched: "STAFF")

## Missing Scrollability in Sheets/Panels
- [ ] `components/admin/appointments/appointment-detail-sheet.tsx`
- [ ] `components/admin/client-detail-sheet.tsx`
- [ ] `components/admin/staff-detail-sheet.tsx`
- [ ] `components/ui/sidebar.tsx`

## Admin History Lists limit (take: 5)
- [ ] `app/[slug]/admin/citas/page.tsx`
- [ ] `app/[slug]/admin/configuracion/page.tsx`
- [ ] `app/[slug]/admin/servicios/page.tsx`
- [ ] `components/admin/appointments/appointments-content.tsx`
- [ ] `components/admin/dashboard-data-wrapper.tsx`
- [ ] `components/admin/services-content.tsx`
- [ ] `components/admin/staff-content.tsx`

## Manual Price Calculation (DRY)
- [ ] `app/[slug]/admin/clientes/actions.ts`
- [ ] `app/schedule/actions.ts`
- [ ] `components/admin/admin-stats-container.tsx`
- [ ] `components/admin/appointments/appointment-detail-sheet.tsx`
- [ ] `components/admin/clientes-content.tsx`
- [ ] `components/booking/booking-flow.tsx`
- [ ] `components/landing/dashboard-preview.tsx`
- [ ] `lib/email/templates/booking-confirmation.ts`
- [ ] `lib/email/templates/booking-notification-staff.ts`

