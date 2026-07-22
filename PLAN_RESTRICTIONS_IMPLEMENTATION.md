# Implementation Plan: Subscription Plan Restrictions & Feature Gating

## Overview
This document outlines the architecture and implementation steps for introducing subscription plans (Starter, Growth, Scale) into the Bookia application. The goal is to enforce feature access and usage limits based on a shop's active plan, while providing an in-app request flow for upgrades.

## 1. Database Schema Updates
We will introduce a `PlanType` enum and an `UpgradeRequest` model to handle the new logic.

### `prisma/schema.prisma` Additions
```prisma
enum PlanType {
  STARTER
  GROWTH
  SCALE
}

enum UpgradeRequestStatus {
  PENDING
  REVIEWED
  RESOLVED
}

model Shop {
  // ... existing fields
  plan PlanType @default(STARTER)
  upgradeRequests UpgradeRequest[]
}

model UpgradeRequest {
  id            String               @id @default(cuid())
  shopId        String
  userId        String               @db.Uuid
  requestedPlan PlanType
  status        UpgradeRequestStatus @default(PENDING)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  
  shop          Shop                 @relation(fields: [shopId], references: [id], onDelete: Cascade)
  user          User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([shopId])
}
```

### Migration & Backfill Strategy
When the database migration is run, a custom data script will backfill existing shops:
- `barberia-demo` will be assigned the `STARTER` plan (for testing).
- All other existing shops will be grandfathered into the `SCALE` plan to prevent any immediate disruption to active users.

## 2. Centralized Feature Matrix
To allow for easy future expansion, all limits will be hardcoded in a centralized configuration file.

### `lib/config/plans.ts`
```typescript
import { PlanType } from "@prisma/client"

export type PlanFeatures = {
  maxStaff: number; // -1 for unlimited
  hasWhatsappReminders: boolean;
  hasReports: boolean;
  hasAbsences: boolean;
  hasMultiBranch: boolean;
}

export const PLAN_MATRIX: Record<PlanType, PlanFeatures> = {
  STARTER: { maxStaff: 3, hasWhatsappReminders: false, hasReports: false, hasAbsences: false, hasMultiBranch: false },
  GROWTH: { maxStaff: 8, hasWhatsappReminders: true, hasReports: true, hasAbsences: true, hasMultiBranch: false },
  SCALE: { maxStaff: -1, hasWhatsappReminders: true, hasReports: true, hasAbsences: true, hasMultiBranch: true },
}
```

## 3. Core Utilities & Backend Protection
We will build helper functions (`lib/utils/plan-limits.ts`) to verify access limits.

### Edge Case Handling: Downgrades
If a shop on `SCALE` (with 7 staff) is manually downgraded to `STARTER` (limit 3), we will implement the **Lenient Approach**:
- The existing 7 staff members remain active and are not deleted.
- However, the Shop Owner will be completely blocked from adding new staff until they manually delete enough staff to fall below the limit of 3.

### Server Actions Guards
Any protected server mutation (e.g., `createStaffMember`, `sendWhatsappReminder`) will first check the `PLAN_MATRIX`. If the limit is reached, it will throw a strict validation error to ensure server-side security.

## 4. Frontend UI & Role-Based Access Control (RBAC)
The user experience will gracefully handle limits and prompt for upgrades.

### In-App Upgrade Request Flow
Because direct payments are not yet enabled, the upgrade flow will be handled manually via the app:
1. When a limit is reached, an `UpgradePromptModal` is displayed.
2. The modal explains the restriction and shows a button: *"Solicitar mejora de plan"*.
3. Clicking the button calls a server action (`createUpgradeRequest`), which:
   - Saves the request in the database (`UpgradeRequest`).
   - Uses the existing `Resend` integration to immediately email the Bookia Dev Team (e.g., to an internal support email) with the shop details and requested plan.
4. The UI displays a success state: *"Tu solicitud ha sido enviada. El equipo se pondrá en contacto pronto."*

### Role-Based Visibility
- **Shop Owners (`OWNER`):** Will see the `UpgradePromptModal` and have the ability to make upgrade requests.
- **Regular Staff (`STAFF`):** Will NOT see upgrade prompts. If they hit a limit (e.g., trying to access a restricted feature), they will simply see a message: *"Límite alcanzado. Por favor, contacta al administrador de la sucursal."*

---
*Note for AI: When instructed to execute, read this file and begin implementing the steps exactly as outlined.*
