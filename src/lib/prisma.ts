import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export type DatabaseDriver = "sqlite" | "libsql" | "postgres";

/**
 * Picks the driver adapter from the active DATABASE_URL.
 *
 *  file: / plain path ......... local SQLite  -> @prisma/adapter-better-sqlite3
 *  libsql:// / https:// / ws(s):// ......... Turso / libSQL -> @prisma/adapter-libsql
 *  postgres:// / postgresql:// ... PostgreSQL (future option, see below)
 *
 * PostgreSQL is intentionally NOT handled here: the generated client comes from
 * `prisma/schema.prisma` (datasource provider = "sqlite"), so a Postgres URL
 * cannot be served by it. The PostgreSQL configuration is preserved in
 * `prisma/schema.postgresql.prisma` + `prisma/migrations-postgresql/` +
 * `src/lib/prisma.postgresql.ts`, and switching to it later requires generating
 * the client from that schema. We fail loudly instead of silently misbehaving.
 */
export function detectDatabaseDriver(url: string): DatabaseDriver {
  const value = String(url || "").trim();
  if (/^libsql:\/\//i.test(value)) return "libsql";
  if (/^(https?|wss?):\/\//i.test(value)) return "libsql";
  if (/^postgres(ql)?:\/\//i.test(value)) return "postgres";
  return "sqlite";
}

/** Turso/libSQL auth token, supporting the common Vercel/Turso env names. */
function resolveAuthToken(): string | undefined {
  return (
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    process.env.PRISMA_DB_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN ||
    undefined
  );
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const driver = detectDatabaseDriver(url);

  if (driver === "libsql") {
    const authToken = resolveAuthToken();
    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter });
  }

  if (driver === "postgres") {
    throw new Error(
      "DATABASE_URL points to PostgreSQL, but the generated Prisma client uses the SQLite schema. " +
        "To use PostgreSQL: generate the client from prisma/schema.postgresql.prisma and apply " +
        "prisma/migrations-postgresql/. The PostgreSQL configuration is preserved in the repository.",
    );
  }

  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;