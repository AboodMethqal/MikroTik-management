import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const backupSchema = z.object({
  version: z.number(),
  pointOfSales: z.array(z.any()).default([]),
  cardTemplates: z.array(z.any()).default([]),
  localCards: z.array(z.any()).default([]),
  dailyReports: z.array(z.any()).default([]),
  sessionSnapshots: z.array(z.any()).default([]),
  distributionPoints: z.array(z.any()).default([]),
});

export async function POST(request: NextRequest) {
  const rl = withRateLimit("sensitive")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("*");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  try {
    const parsed = backupSchema.safeParse(await request.json());
    if (!parsed.success || parsed.data.version !== 1) return NextResponse.json({ success: false, error: "Invalid or unsupported backup" }, { status: 400, headers: rl.headers });
    const b = parsed.data;
    await prisma.$transaction(async tx => {
      for (const p of b.pointOfSales) {
        if (!p.id || !p.name) continue;
        await tx.pointOfSale.upsert({
          where: { id: String(p.id) },
          create: { id: String(p.id), name: String(p.name), phone: p.phone || undefined, address: p.address || undefined, openingBalance: Number(p.openingBalance || 0), creditLimit: Number(p.creditLimit || 0), active: p.active !== false },
          update: { name: String(p.name), phone: p.phone || undefined, address: p.address || undefined, creditLimit: Number(p.creditLimit || 0), active: p.active !== false },
        });
      }
      for (const c of b.localCards) {
        if (!c.id || !c.username) continue;
        await tx.localCard.upsert({ where: { id: String(c.id) }, create: { id: String(c.id), routerId: c.routerId || undefined, source: String(c.source || "HOTSPOT"), username: String(c.username), password: c.password || undefined, serialNumber: c.serialNumber || undefined, profile: c.profile || undefined, packageName: c.packageName || undefined, validity: c.validity || undefined, price: c.price == null ? undefined : Number(c.price), status: String(c.status || "ACTIVE"), macAddress: c.macAddress || undefined, createdAt: c.createdAt ? new Date(c.createdAt) : undefined, expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined, deletedAt: c.deletedAt ? new Date(c.deletedAt) : undefined, disabledAt: c.disabledAt ? new Date(c.disabledAt) : undefined }, update: { status: String(c.status || "ACTIVE"), packageName: c.packageName || undefined, validity: c.validity || undefined, price: c.price == null ? undefined : Number(c.price) } });
      }
      for (const r of b.dailyReports) {
        if (!r.id || !r.routerId || !r.reportDate) continue;
        await tx.dailyReport.upsert({ where: { id: String(r.id) }, create: { id: String(r.id), routerId: String(r.routerId), reportDate: new Date(r.reportDate), activeUsers: Number(r.activeUsers||0), totalCards: Number(r.totalCards||0), usedCards: Number(r.usedCards||0), disabledCards: Number(r.disabledCards||0), sessions: Number(r.sessions||0), bytesIn: Number(r.bytesIn||0), bytesOut: Number(r.bytesOut||0), salesTotal: Number(r.salesTotal||0), salesCount: Number(r.salesCount||0) }, update: { activeUsers: Number(r.activeUsers||0), totalCards: Number(r.totalCards||0), usedCards: Number(r.usedCards||0), disabledCards: Number(r.disabledCards||0), sessions: Number(r.sessions||0), bytesIn: Number(r.bytesIn||0), bytesOut: Number(r.bytesOut||0), salesTotal: Number(r.salesTotal||0), salesCount: Number(r.salesCount||0) } });
      }
      for (const t of b.cardTemplates) {
        if (!t.id || !t.name || typeof t.html !== "string") continue;
        await tx.cardTemplate.upsert({
          where: { id: String(t.id) },
          create: { id: String(t.id), name: String(t.name), description: t.description || undefined, html: String(t.html), css: t.css || undefined, paper: String(t.paper || "A4"), columns: Number(t.columns || 3), rows: Number(t.rows || 8), active: t.active !== false },
          update: { name: String(t.name), description: t.description || undefined, html: String(t.html), css: t.css || undefined, paper: String(t.paper || "A4"), columns: Number(t.columns || 3), rows: Number(t.rows || 8), active: t.active !== false },
        });
      }
    });
    await auditLog({ action: "IMPORT", resource: "BACKUP", actorName: guard.session?.user?.name || undefined });
    return NextResponse.json({ success: true, restored: { pointOfSales: b.pointOfSales.length, cardTemplates: b.cardTemplates.length, localCards: b.localCards.length, dailyReports: b.dailyReports.length }, warning: "السجل المالي والمستخدمون وكلمات مرور الراوتر لا يتم استبدالها تلقائيًا لحماية البيانات." }, { headers: rl.headers });
  } catch (error) { console.error(error); return NextResponse.json({ success: false, error: "Restore failed" }, { status: 500, headers: rl.headers }); }
}
