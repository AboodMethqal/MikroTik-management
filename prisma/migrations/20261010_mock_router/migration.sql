-- Built-in virtual (mock) MikroTik router support.
-- Adds an explicit flag so a mock router can never be confused with a real
-- device, plus a table holding the mock router's persistent state.

ALTER TABLE "routers" ADD COLUMN "isMock" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "mock_router_state" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "data" TEXT NOT NULL,
    "seedVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);