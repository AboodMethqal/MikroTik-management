PRAGMA foreign_keys=OFF;
CREATE TABLE "local_cards" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "routerId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'HOTSPOT',
  "username" TEXT NOT NULL,
  "password" TEXT,
  "serialNumber" TEXT UNIQUE,
  "profile" TEXT,
  "packageName" TEXT,
  "validity" TEXT,
  "price" REAL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "macAddress" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "expiresAt" DATETIME,
  "deletedAt" DATETIME,
  "disabledAt" DATETIME,
  CONSTRAINT "local_cards_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "local_cards_routerId_createdAt_idx" ON "local_cards"("routerId", "createdAt");
CREATE INDEX "local_cards_username_idx" ON "local_cards"("username");
CREATE INDEX "local_cards_status_createdAt_idx" ON "local_cards"("status", "createdAt");
CREATE INDEX "local_cards_source_createdAt_idx" ON "local_cards"("source", "createdAt");

CREATE TABLE "daily_reports" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "routerId" TEXT NOT NULL,
  "reportDate" DATETIME NOT NULL,
  "activeUsers" INTEGER NOT NULL DEFAULT 0,
  "totalCards" INTEGER NOT NULL DEFAULT 0,
  "usedCards" INTEGER NOT NULL DEFAULT 0,
  "disabledCards" INTEGER NOT NULL DEFAULT 0,
  "sessions" INTEGER NOT NULL DEFAULT 0,
  "bytesIn" REAL NOT NULL DEFAULT 0,
  "bytesOut" REAL NOT NULL DEFAULT 0,
  "salesTotal" REAL NOT NULL DEFAULT 0,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "daily_reports_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "daily_reports_routerId_reportDate_key" ON "daily_reports"("routerId", "reportDate");
CREATE INDEX "daily_reports_reportDate_idx" ON "daily_reports"("reportDate");

CREATE TABLE "session_snapshots" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "routerId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "macAddress" TEXT,
  "address" TEXT,
  "server" TEXT,
  "uptime" TEXT,
  "bytesIn" REAL NOT NULL DEFAULT 0,
  "bytesOut" REAL NOT NULL DEFAULT 0,
  "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_snapshots_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "session_snapshots_routerId_recordedAt_idx" ON "session_snapshots"("routerId", "recordedAt");
CREATE INDEX "session_snapshots_macAddress_recordedAt_idx" ON "session_snapshots"("macAddress", "recordedAt");
CREATE INDEX "session_snapshots_username_recordedAt_idx" ON "session_snapshots"("username", "recordedAt");

ALTER TABLE "card_templates" ADD COLUMN "backgroundImage" TEXT;
PRAGMA foreign_keys=ON;
