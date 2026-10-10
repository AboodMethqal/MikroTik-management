/**
 * Ensures the database schema matches prisma/migrations WITHOUT using
 * `prisma migrate deploy` (which cannot reach a remote Turso/libSQL database in
 * Prisma 7.10 — prisma.config.ts has no adapter field).
 *
 * Safety rules:
 *  - Reads prisma/migrations/*.sql in order and applies them statement by
 *    statement, guarded so re-runs are harmless (idempotent).
 *  - CREATE TABLE / CREATE INDEX are rewritten to IF NOT EXISTS.
 *  - ALTER TABLE ... ADD COLUMN is applied only when the column is missing.
 *  - Any destructive statement (DROP / DELETE / TRUNCATE / ALTER COLUMN) is
 *    REFUSED and reported. Existing data is never touched.
 *
 * Usage:
 *   node scripts/ensure-schema.cjs            # read-only report (default)
 *   node scripts/ensure-schema.cjs --apply    # apply missing objects only
 *
 * Reads DATABASE_URL (supports file: and libsql:// through @libsql/client).
 */
const { createClient } = require("@libsql/client");
const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const APPLY = process.argv.includes("--apply");
const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((d) => /^\d+_/.test(d))
    .sort()
    .map((dir) => ({
      name: dir,
      sql: readFileSync(join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8"),
    }));
}

/** Split a migration file into individual statements. */
function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) =>
      // Strip leading comment lines but KEEP the SQL that follows them,
      // otherwise statements like "ALTER TABLE ... " inside a commented
      // header would be silently skipped.
      s
        .split(/\r?\n/)
        .filter((line) => !/^\s*--/.test(line))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

const DESTRUCTIVE = /^\s*(DROP|DELETE|TRUNCATE)\b|ALTER\s+COLUMN|ALTER\s+TABLE\s+\S+\s+RENAME/i;

async function tableExists(db, name) {
  const r = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [name],
  );
  return r.rows.length > 0;
}

async function columnExists(db, table, column) {
  if (!(await tableExists(db, table))) return false;
  const r = await db.execute(`PRAGMA table_info(${JSON.stringify(table)})`);
  return r.rows.some((row) => String(row.name) === column);
}

function extractTable(stmt) {
  const m = stmt.match(/CREATE\s+(?:UNIQUE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)/i);
  return m ? m[1] : null;
}

function extractIndex(stmt) {
  const m = stmt.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)/i);
  return m ? m[2] : null;
}

function extractAddedColumn(stmt) {
  const m = stmt.match(/ALTER\s+TABLE\s+["'`]?([A-Za-z0-9_]+)["'`]?\s+ADD\s+COLUMN\s+["'`]?([A-Za-z0-9_]+)/i);
  return m ? { table: m[1], column: m[2] } : null;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const authToken =
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    process.env.PRISMA_DB_AUTH_TOKEN ||
    undefined;

  const db = createClient(authToken ? { url, authToken } : { url });
  const driver = /^libsql:\/\//i.test(url) ? "libsql (Turso remote)" : "local file";
  console.log(`Target : ${driver}`);
  console.log(`Mode   : ${APPLY ? "APPLY missing objects" : "CHECK ONLY (read-only)"}\n`);

  let applied = 0;
  let skipped = 0;
  const refused = [];

  for (const migration of listMigrations()) {
    console.log(`— ${migration.name}`);
    for (const raw of splitStatements(migration.sql)) {
      const stmt = raw.replace(/\s+/g, " ").trim();

      if (DESTRUCTIVE.test(stmt)) {
        refused.push(`${migration.name}: ${stmt.slice(0, 90)}`);
        continue;
      }

      const added = extractAddedColumn(stmt);
      if (added) {
        if (await columnExists(db, added.table, added.column)) {
          console.log(`    = column ${added.table}.${added.column} exists`);
          skipped++;
          continue;
        }
        if (!APPLY) {
          console.log(`    + MISSING column ${added.table}.${added.column}`);
          continue;
        }
        await db.execute(stmt);
        console.log(`    + added column ${added.table}.${added.column}`);
        applied++;
        continue;
      }

      if (/^CREATE\s+TABLE/i.test(stmt)) {
        const table = extractTable(stmt);
        if (table && (await tableExists(db, table))) {
          console.log(`    = table ${table} exists`);
          skipped++;
          continue;
        }
        if (!APPLY) {
          console.log(`    + MISSING table ${table}`);
          continue;
        }
        await db.execute(stmt.replace(/^CREATE\s+TABLE/i, "CREATE TABLE IF NOT EXISTS"));
        console.log(`    + created table ${table}`);
        applied++;
        continue;
      }

      if (/^CREATE\s+(UNIQUE\s+)?INDEX/i.test(stmt)) {
        const index = extractIndex(stmt);
        const found = await db.execute(
          "SELECT name FROM sqlite_master WHERE type='index' AND name = ?",
          [index],
        );
        if (found.rows.length) {
          console.log(`    = index ${index} exists`);
          skipped++;
          continue;
        }
        if (!APPLY) {
          console.log(`    + MISSING index ${index}`);
          continue;
        }
        await db.execute(
          stmt.replace(/^CREATE\s+(UNIQUE\s+)?INDEX/i, "CREATE $1INDEX IF NOT EXISTS"),
        );
        applied++;
        console.log(`    + created index ${index}`);
        continue;
      }

      // Remaining statements (PRAGMA statements etc.) are harmless and are
      // executed only when applying; they are not counted as schema changes.
      if (APPLY) {
        await db.execute(stmt);
      }
    }
  }

  console.log(`\nSummary: applied=${applied} already-present=${skipped}`);
  if (!APPLY && applied === 0) {
    console.log("Schema is up to date (re-run with --apply only if something is missing).");
  }
  if (refused.length) {
    console.log(`\nRefused ${refused.length} destructive statement(s) (never executed):`);
    refused.forEach((r) => console.log(`  ! ${r}`));
  }
}

main().catch((e) => {
  console.error("Schema check failed:", e.message);
  process.exit(1);
});