CREATE TABLE IF NOT EXISTS "point_of_sales" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "creditLimit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "point_of_sales_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "point_of_sales_active_idx" ON "point_of_sales"("active");

CREATE TABLE IF NOT EXISTS "sales" (
  "id" TEXT NOT NULL,
  "pointOfSaleId" TEXT NOT NULL,
  "routerId" TEXT,
  "reference" TEXT NOT NULL,
  "note" TEXT,
  "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_reference_key" UNIQUE ("reference"),
  CONSTRAINT "sales_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "point_of_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "sales_pointOfSaleId_createdAt_idx" ON "sales"("pointOfSaleId","createdAt");
CREATE INDEX IF NOT EXISTS "sales_routerId_createdAt_idx" ON "sales"("routerId","createdAt");

CREATE TABLE IF NOT EXISTS "sale_items" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "cardType" TEXT NOT NULL,
  "username" TEXT,
  "profile" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
  CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "sale_items_saleId_idx" ON "sale_items"("saleId");

CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT NOT NULL,
  "pointOfSaleId" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "point_of_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "payments_pointOfSaleId_createdAt_idx" ON "payments"("pointOfSaleId","createdAt");

CREATE TABLE IF NOT EXISTS "card_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "html" TEXT NOT NULL,
  "css" TEXT,
  "paper" TEXT NOT NULL DEFAULT 'A4',
  "columns" INTEGER NOT NULL DEFAULT 3,
  "rows" INTEGER NOT NULL DEFAULT 8,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "card_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "card_templates_active_idx" ON "card_templates"("active");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource","resourceId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
