PRAGMA foreign_keys=OFF;

CREATE TABLE "routers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL DEFAULT 8728,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "hotspotName" TEXT,
  "dnsName" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "autoReload" INTEGER NOT NULL DEFAULT 10,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "distribution_points" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "routerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "interfaceName" TEXT NOT NULL,
  "description" TEXT,
  "capacityMbps" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "distribution_points_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "system_notifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "resource" TEXT,
  "resourceId" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "admin_config" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL
);

CREATE TABLE "admin_users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ADMIN',
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "lastLoginAt" DATETIME
);

CREATE TABLE "point_of_sales" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "openingBalance" REAL NOT NULL DEFAULT 0,
  "creditLimit" REAL NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "sales" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pointOfSaleId" TEXT NOT NULL,
  "routerId" TEXT,
  "reference" TEXT NOT NULL,
  "note" TEXT,
  "total" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  CONSTRAINT "sales_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "point_of_sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "sales_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "sale_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "saleId" TEXT NOT NULL,
  "cardType" TEXT NOT NULL,
  "username" TEXT,
  "profile" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" REAL NOT NULL DEFAULT 0,
  "total" REAL NOT NULL DEFAULT 0,
  CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pointOfSaleId" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  CONSTRAINT "payments_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "point_of_sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pointOfSaleId" TEXT NOT NULL,
  "saleId" TEXT,
  "paymentId" TEXT,
  "type" TEXT NOT NULL,
  "debit" REAL NOT NULL DEFAULT 0,
  "credit" REAL NOT NULL DEFAULT 0,
  "reference" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  CONSTRAINT "ledger_entries_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "point_of_sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "card_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "html" TEXT NOT NULL,
  "css" TEXT,
  "paper" TEXT NOT NULL DEFAULT 'A4',
  "columns" INTEGER NOT NULL DEFAULT 3,
  "rows" INTEGER NOT NULL DEFAULT 8,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "actorName" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "details" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "distribution_points_routerId_interfaceName_key" ON "distribution_points"("routerId", "interfaceName");
CREATE INDEX "distribution_points_routerId_active_idx" ON "distribution_points"("routerId", "active");
CREATE INDEX "system_notifications_severity_createdAt_idx" ON "system_notifications"("severity", "createdAt");
CREATE INDEX "system_notifications_readAt_createdAt_idx" ON "system_notifications"("readAt", "createdAt");
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");
CREATE INDEX "admin_users_active_idx" ON "admin_users"("active");
CREATE INDEX "point_of_sales_active_idx" ON "point_of_sales"("active");
CREATE UNIQUE INDEX "sales_reference_key" ON "sales"("reference");
CREATE INDEX "sales_pointOfSaleId_createdAt_idx" ON "sales"("pointOfSaleId", "createdAt");
CREATE INDEX "sales_routerId_createdAt_idx" ON "sales"("routerId", "createdAt");
CREATE INDEX "sales_status_createdAt_idx" ON "sales"("status", "createdAt");
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX "payments_pointOfSaleId_createdAt_idx" ON "payments"("pointOfSaleId", "createdAt");
CREATE UNIQUE INDEX "ledger_entries_saleId_key" ON "ledger_entries"("saleId");
CREATE UNIQUE INDEX "ledger_entries_paymentId_key" ON "ledger_entries"("paymentId");
CREATE INDEX "ledger_entries_pointOfSaleId_createdAt_idx" ON "ledger_entries"("pointOfSaleId", "createdAt");
CREATE INDEX "ledger_entries_type_createdAt_idx" ON "ledger_entries"("type", "createdAt");
CREATE INDEX "card_templates_active_idx" ON "card_templates"("active");
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

PRAGMA foreign_keys=ON;
