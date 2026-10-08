CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN','ADMIN','NETWORK_ADMIN','SALES_MANAGER','CASHIER','VIEWER');
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED','VOIDED','REFUNDED');
CREATE TYPE "LedgerEntryType" AS ENUM ('OPENING_BALANCE','SALE','PAYMENT','ADJUSTMENT','REFUND');
CREATE TABLE "admin_users" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt" TIMESTAMP(3),
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");
CREATE INDEX "admin_users_active_idx" ON "admin_users"("active");
ALTER TABLE "sales" ADD COLUMN "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "sales" ADD COLUMN "createdBy" TEXT;
CREATE INDEX "sales_status_createdAt_idx" ON "sales"("status","createdAt");
ALTER TABLE "payments" ADD COLUMN "createdBy" TEXT;
CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "pointOfSaleId" TEXT NOT NULL,
  "saleId" TEXT,
  "paymentId" TEXT,
  "type" "LedgerEntryType" NOT NULL,
  "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "reference" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ledger_entries_saleId_key" UNIQUE ("saleId"),
  CONSTRAINT "ledger_entries_paymentId_key" UNIQUE ("paymentId"),
  CONSTRAINT "ledger_entries_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "point_of_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ledger_entries_pointOfSaleId_createdAt_idx" ON "ledger_entries"("pointOfSaleId","createdAt");
CREATE INDEX "ledger_entries_type_createdAt_idx" ON "ledger_entries"("type","createdAt");
ALTER TABLE "audit_logs" ADD COLUMN "actorId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "actorName" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "userAgent" TEXT;
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId","createdAt");
INSERT INTO "ledger_entries" ("id","pointOfSaleId","type","debit","credit","reference","description","createdAt")
SELECT 'opening-' || p."id", p."id", 'OPENING_BALANCE', p."openingBalance", 0, 'OPENING-' || p."id", 'Opening balance migrated from point of sale', p."createdAt"
FROM "point_of_sales" p
WHERE p."openingBalance" > 0
  AND NOT EXISTS (SELECT 1 FROM "ledger_entries" l WHERE l."pointOfSaleId" = p."id" AND l."type" = 'OPENING_BALANCE');
INSERT INTO "ledger_entries" ("id","pointOfSaleId","saleId","type","debit","credit","reference","description","createdAt","createdBy")
SELECT 'sale-' || s."id", s."pointOfSaleId", s."id", 'SALE', s."total", 0, s."reference", s."note", s."createdAt", s."createdBy"
FROM "sales" s
WHERE s."status" = 'COMPLETED'
  AND NOT EXISTS (SELECT 1 FROM "ledger_entries" l WHERE l."saleId" = s."id");
INSERT INTO "ledger_entries" ("id","pointOfSaleId","paymentId","type","debit","credit","reference","description","createdAt","createdBy")
SELECT 'payment-' || p."id", p."pointOfSaleId", p."id", 'PAYMENT', 0, p."amount", 'PAY-' || p."id", p."note", p."createdAt", p."createdBy"
FROM "payments" p
WHERE NOT EXISTS (SELECT 1 FROM "ledger_entries" l WHERE l."paymentId" = p."id");

-- Link optional router reference on sales without deleting sales when a router is removed.
ALTER TABLE "sales" ADD CONSTRAINT "sales_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
