CREATE TYPE "NotificationSeverity" AS ENUM ('INFO','WARNING','CRITICAL');

CREATE TABLE "distribution_points" (
  "id" TEXT NOT NULL,
  "routerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "interfaceName" TEXT NOT NULL,
  "description" TEXT,
  "capacityMbps" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "distribution_points_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "distribution_points_routerId_interfaceName_key" ON "distribution_points"("routerId", "interfaceName");
CREATE INDEX "distribution_points_routerId_active_idx" ON "distribution_points"("routerId", "active");
ALTER TABLE "distribution_points" ADD CONSTRAINT "distribution_points_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "routers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "system_notifications" (
  "id" TEXT NOT NULL,
  "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "resource" TEXT,
  "resourceId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "system_notifications_severity_createdAt_idx" ON "system_notifications"("severity", "createdAt");
CREATE INDEX "system_notifications_readAt_createdAt_idx" ON "system_notifications"("readAt", "createdAt");
