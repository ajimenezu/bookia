#!/usr/bin/env node
/**
 * Prod guard — refuses to run destructive DB commands against anything that
 * isn't the local Supabase stack.
 *
 * Wired as the `pre*` hook for db:reset / db:migrate / db:seed (see package.json),
 * so `prisma migrate reset`, `migrate dev`, and seed loads can ONLY ever touch a
 * localhost database. This is the backstop for .agents/rules/database-safety.md:
 * a stray reset can never reach the production Supabase project.
 *
 * Override (ONLY when you truly mean to target a remote DB, e.g. a CI job):
 *   ALLOW_NON_LOCAL_DB=1 npm run <script>
 */

// Mirror Prisma's resolution: shell env wins, otherwise read the .env file
// (Prisma CLI auto-loads .env — NOT .env.local — so the guard checks the same source).
function fromEnvFile(key) {
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(process.cwd(), ".env");
    if (!fs.existsSync(file)) return "";
    const line = fs
      .readFileSync(file, "utf8")
      .split("\n")
      .find((l) => l.trim().startsWith(`${key}=`));
    if (!line) return "";
    return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

const url =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  fromEnvFile("DIRECT_URL") ||
  fromEnvFile("DATABASE_URL") ||
  "";

if (!url) {
  console.error("\n\x1b[31m✖ check-not-prod:\x1b[0m DIRECT_URL / DATABASE_URL is not set.");
  console.error("  Point your env at the local Supabase DB before running DB commands.\n");
  process.exit(1);
}

let host = "";
try {
  // postgresql://user:pass@host:port/db  -> host
  host = new URL(url).hostname;
} catch {
  console.error("\n\x1b[31m✖ check-not-prod:\x1b[0m could not parse the DB connection string.\n");
  process.exit(1);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const isLocal = LOCAL_HOSTS.has(host);

if (isLocal) {
  process.exit(0);
}

if (process.env.ALLOW_NON_LOCAL_DB === "1") {
  console.warn(
    `\n\x1b[33m⚠ check-not-prod:\x1b[0m target host is "${host}" (non-local) but ALLOW_NON_LOCAL_DB=1 is set — proceeding.\n`
  );
  process.exit(0);
}

console.error(`
\x1b[41m\x1b[37m REFUSING TO RUN — non-local database \x1b[0m

  Target DB host: \x1b[1m${host}\x1b[0m

  This command (migrate / reset / seed) is destructive and is only allowed
  against the LOCAL Supabase stack (localhost / 127.0.0.1).

  Your env is pointing at a remote database — likely PRODUCTION. Aborting to
  protect the data (see .agents/rules/database-safety.md).

  To work locally:   npm run supabase:start   (then use the local DIRECT_URL)
  Intentional remote run (rare): prefix with ALLOW_NON_LOCAL_DB=1
`);
process.exit(1);
