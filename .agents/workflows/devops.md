---
description: Deployment, migrations, and database syncing commands.
---

# DevOps & Migrations

## 1. Sync Prisma Client
Run before local testing or deployments:
// turbo
```bash
npx prisma generate
```

## 2. Apply Migrations (Prototyping)
Pushes schema to DB without creating migration history:
// turbo
```bash
npx prisma db push
```

## 3. Build Verification
Force client generation in build environment to catch errors:
// turbo
```bash
npm run build
```

> [!CAUTION]
> Always verify `schema.prisma` changes before running `db push` to prevent data loss.
