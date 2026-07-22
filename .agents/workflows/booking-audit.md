---
description: Audit checklist for appointment availability and scheduling logic.
---

# Booking & Availability Audit

## 1. Collision Rules (`checkStaffConflict`)
- **Check**: Intersection logic uses `startTime: { lt: endTime }` AND `endTime: { gt: startTime }`.
- **Check**: Excludes current appointment ID on edits (`excludeAppointmentId`).
- **Check**: Excludes appointments with `CANCELLED` status.

## 2. Slot Generation (`getAvailableSlots`)
- **Timezone**: Must use `America/Costa_Rica`. Use `toCRDate(new Date())` to filter today's past slots.
- **Priority**: 
  1. `StaffTimeOff` (Blocking)
  2. `StaffSchedule` (Personal + Breaks)
  3. `ShopSchedule` (Fallback)

## 3. "Staff Auto" Assignment
- **Check**: If `staffId === "auto"`, verifies AT LEAST ONE staff member is available.
- **Check**: Filters only members with `STAFF` or `OWNER` roles.
- **Check**: Validates that staff is explicitly assigned to the requested service(s).
- **Check**: Skips staff selection UI entirely if only 1 eligible staff member exists.

## 4. Service Constraints
- **Check**: Public listing queries MUST filter out "hidden" services, while internal admin booking flows may still schedule them.
- **Check**: Booking flow strictly enforces category constraints (cannot mix categories).

*(Ref: `booking_engine.md`)*
