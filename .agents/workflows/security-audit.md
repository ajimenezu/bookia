---
description: Critical security and data isolation audit checklist for PRs and new features.
---

# Security & Isolation Audit

## 1. Multi-Tenant Isolation (BLOCKING)
- **FAIL IF**: DB query on `Service`, `Appointment`, `ShopMember`, `StaffSchedule`, `ShopSchedule`, or `StaffTimeOff` lacks `where: { shopId }`.
- **FAIL IF**: `shopId` is sourced from untrusted client input instead of session (`auth()`) or verified slug.

## 2. SQL & Query Injection
- **FAIL IF**: `prisma.$queryRaw` uses direct template literals instead of parameterized variables.

## 3. Authorization (RBAC)
- **FAIL IF**: `admin/` route lacks `requireAdmin(shop.id)`.
- **FAIL IF**: Public booking route fails to validate service `shopId` against shop `slug`.
- **FAIL IF**: Sensitive data (emails, financials) exposed to unauthorized roles.

*(Refs: `isolation_guidelines.md`, `audit_rules.md`)*
