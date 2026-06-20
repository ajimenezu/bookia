# Database Safety Rules

Completamente prohibido reiniciar la base de datos o borrar datos sin preguntar explícitamente al usuario.

## Reglas Críticas
1. **No usar `--force-reset`**: Nunca ejecutar `npx prisma db push --force-reset` o similares sin aprobación previa del usuario.
2. **Consultas de Escritura**: No ejecutar scripts que realicen borrados masivos (`deleteMany({})`) sin confirmar.
3. **Historial sobre Campos Planos**: Para registros que requieran trazabilidad (ej. notas, comentarios, cambios de estado), preferir siempre una tabla relacionada (1:N) con autor y timestamp en lugar de un único campo de texto en el modelo principal.
4. **Migraciones**: Seguir siempre el proceso de despliegue controlado de migraciones si el entorno es de producción o compartido.

## Local development isolation (NEVER develop against prod)

- Developers run a **full local Supabase stack** (Docker): `npm run supabase:start`. Config in `supabase/config.toml`.
- Local config lives in **`.env`** (Prisma CLI + Next both read it); prod credentials live **only in Vercel**. A `.env.local` with prod values is a footgun — in Next it overrides `.env`, silently pointing the app at prod. Remove it.
- **`scripts/check-not-prod.js`** runs as a `pre` hook on `db:migrate`/`db:reset`/`db:seed` and aborts unless the DB host is `localhost`/`127.0.0.1`. Override only with `ALLOW_NON_LOCAL_DB=1` for a deliberate remote run.
- Schema is built by **Prisma migrations** (not `supabase db reset`); `npm run db:reset` = migrate reset + `db:seed`. `db:seed` applies the JWT hook (`supabase/sql/access-token-hook.sql`, mirrors prod `supabase_multitenant_hook.sql` + the `supabase_auth_admin` grants) then loads `supabase/seed/seed.sql`.
- **Sanitized prod data:** `npm run db:dump:prod` (needs read-only `PROD_DB_URL`) copies prod public data → local, anonymizes PII, synthesizes loginable auth users (shared password `devpassword123`), and re-exports a scrubbed `supabase/seed/seed.sql`. Only the scrubbed file is shared.
- **auth.users gotcha:** manual `auth.users` inserts MUST set the token columns (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`) to `''` (NOT NULL) — otherwise GoTrue login fails with "Database error querying schema".
- Full walkthrough: `docs/LOCAL_DEV.md`.

---
> [!IMPORTANT]
> La integridad de los datos es la prioridad #1. Siempre que se necesite una limpieza de DB para sincronizar esquemas, se debe proponer primero al usuario.
