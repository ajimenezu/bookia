# Setup Guide

Follow these steps to get your local environment connected to Supabase and Prisma.

## 1. Supabase Project Configuration

1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Project Settings -> API** to get:
   - `Project URL`
   - `Anon Key`
3. Go to **Project Settings -> Database** to get:
   - **Connection Pooler URL (Transaction Mode):** For `DATABASE_URL` (usually port 6543).
   - **Direct Connection URL:** For `DIRECT_URL` (usually port 5432).

## 2. Environment Variables

Create a root `.env` file:

```env
# Prisma Connection Strings
DATABASE_URL="postgresql://postgres.[PROJ_ID]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJ_ID]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL="https://[PROJ_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

> [!IMPORTANT]
> Always use the connection pooler (port 6543) for the `DATABASE_URL` in serverless environments like Vercel to avoid hitting PostgreSQL connection limits.

## 3. Database Initialization

Once the `.env` is set up, run:

```bash
# Push schema to Supabase for the first time
npx prisma db push

# Generate the Prisma Client
npx prisma generate
```

## 4. Development Workflow

- **Schema Changes:** Modify `prisma/schema.prisma` then run `npx prisma db push`.
- **Viewing Data:** Run `npx prisma studio` to open a local UI for managing database records.
- **Server:** `npm run dev` to start the Next.js development server.
