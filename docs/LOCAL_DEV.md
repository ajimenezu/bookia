# Local Development — isolated from production

Developers run a **full local Supabase stack** (Postgres + Auth + Storage + Studio)
in Docker. Nobody connects to the production database from their machine, so a stray
migration, reset, or test booking can never touch real data.

> **The rule:** production credentials live **only in Vercel**. Your machine talks to
> `localhost` Supabase, period. Multiple safety layers enforce this (below).

---

## One-time setup

**Prerequisites:** Docker Desktop running. (Optional, only for refreshing seed data
from prod: `psql`/`pg_dump` via `brew install libpq`.)

```bash
npm install                 # installs the pinned supabase CLI (devDependency)
npm run supabase:start      # boots local Postgres + Auth + Studio (first run pulls images)
cp .env.example .env        # local config — points at localhost Supabase
npm run db:reset            # builds schema (Prisma) + JWT hook + seed data
npm run dev
```

Then log in at `http://localhost:3000` with the bootstrap super admin:

| email                | password         |
| -------------------- | ---------------- |
| `admin@bookia.local` | `devpassword123` |

Useful local URLs (also via `npm run supabase:status`):

- Studio (DB browser): http://127.0.0.1:54323
- Mailpit (captures auth/transactional emails): http://127.0.0.1:54324
- API: http://127.0.0.1:54321 · Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### ⚠️ Remove production creds from your machine

Next.js loads `.env.local` **with higher priority than `.env`**. If you still have a
`.env.local` holding production values, the running app will silently hit production
even though Prisma uses local. **Delete it** (or strip the prod values):

```bash
rm .env.local   # prod creds belong in Vercel only
```

If you ever genuinely need a prod value, pull it on demand with the Vercel CLI
(`vercel env pull`) and remove it when done — don't let it persist.

---

## Daily commands

| Command                   | What it does                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `npm run supabase:start`  | Start the local stack                                              |
| `npm run supabase:stop`   | Stop it (data persists in the Docker volume)                       |
| `npm run supabase:status` | Show local URLs + API keys                                         |
| `npm run dev`             | Run the app against local Supabase                                 |
| `npm run db:migrate`      | Create/apply a new Prisma migration locally (`prisma migrate dev`) |
| `npm run db:reset`        | Drop, re-apply all migrations, re-apply hook + reload seed         |
| `npm run db:seed`         | Re-apply the JWT hook + load `supabase/seed/seed.sql`              |
| `npm run db:studio`       | Prisma Studio against local                                        |

---

## Safety layers (why this is hard to get wrong)

1. **`scripts/check-not-prod.js`** runs `pre` every `db:migrate` / `db:reset` /
   `db:seed` and **aborts unless the DB host is `localhost`/`127.0.0.1`**. It reads
   the same `.env` Prisma uses. Override only for a deliberate remote run:
   `ALLOW_NON_LOCAL_DB=1 npm run …`.
2. **`.env`, not `.env.local`** — one file drives both Prisma and Next, so the app and
   migrations always agree on the target DB.
3. **Prisma's own guard** additionally blocks `migrate reset` in some automated
   contexts.
4. **No `--force-reset`** appears in any script (per `.agents/rules/database-safety.md`).

---

## Realistic data: sanitized production snapshot

The default seed is just a bootstrap admin + demo shop. To work with production-shaped
data **without copying real PII**, regenerate the seed from prod (read-only):

```bash
npm run supabase:start
npm run db:reset                 # start from a clean local schema
PROD_DB_URL="postgresql://READONLY_USER:***@db.<ref>.supabase.co:5432/postgres" \
  npm run db:dump:prod
```

What `scripts/dump-prod-sanitized.sh` does:

1. Copies prod **public** data into your **local** DB (read-only on prod).
2. **Anonymizes** in place — emails → `userXXXX@example.com`, names/phones scrubbed.
3. **Synthesizes auth users** so every account is loginable with the shared dev
   password (`devpassword123`), keeping original UUIDs so all FKs hold.
4. Re-exports the **clean** DB to `supabase/seed/seed.sql` (portable INSERTs).

Only the scrubbed `seed.sql` is shared/committed — raw prod rows never leave your local
DB and are overwritten on the next `npm run db:reset`. After a dump, log in as
`admin@bookia.local` / `devpassword123`, or any `userXXXX@example.com` /
`devpassword123`.

> Use a **read-only** prod role for `PROD_DB_URL`. The script reads prod; it never
> writes to it. `supabase/seed/seed.sql` should be reviewed before committing to
> confirm no PII slipped through new columns.

---

## Auth parity note

Production's multi-tenant JWT hook (`supabase_multitenant_hook.sql`) is reproduced
locally: registered in `supabase/config.toml` (`[auth.hook.custom_access_token]`) and
installed (with the `supabase_auth_admin` grants prod set via dashboard) by `db:seed`
from `supabase/sql/access-token-hook.sql`. So local logins get the same
`app_metadata.role` / `shop_id` claims as production.
