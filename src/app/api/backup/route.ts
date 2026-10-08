import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRouters } from "@/lib/router-config";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const rl = withRateLimit("sensitive")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("*");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const [routers, pos, sales, payments, ledger, templates, cards, reports, sessions, points, notifications] = await Promise.all([
    getRouters(), prisma.pointOfSale.findMany(), prisma.sale.findMany({ include: { items: true }}), prisma.payment.findMany(), prisma.ledgerEntry.findMany(), prisma.cardTemplate.findMany(), prisma.localCard.findMany(), prisma.dailyReport.findMany(), prisma.sessionSnapshot.findMany({ orderBy: { recordedAt: "desc" }, take: 10000 }), prisma.distributionPoint.findMany(), prisma.systemNotification.findMany(),
  ]);
  const payload = {
    version: 1, exportedAt: new Date().toISOString(),
    routers: routers.map(r => ({ id: r.id, name: r.name, host: r.host, port: r.port, username: r.username, hotspotName: r.hotspotName, dnsName: r.dnsName, currency: r.currency, autoReload: r.autoReload })),
    pointOfSales: pos, sales, payments, ledger, cardTemplates: templates, localCards: cards, dailyReports: reports, sessionSnapshots: sessions, distributionPoints: points, notifications,
  };
  await auditLog({ action: "EXPORT", resource: "BACKUP", actorName: guard.session?.user?.name || undefined });
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { ...rl.headers, "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="mikhmon-backup-${new Date().toISOString().slice(0,10)}.json"`, "cache-control": "no-store" } });
}
