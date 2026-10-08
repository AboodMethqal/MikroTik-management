import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedClient } from "@/lib/session";
import { getRouters } from "@/lib/router-config";
import { withRateLimit } from "@/lib/rate-limit";

function dayStart(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export async function GET(request: NextRequest) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const { client, error } = await getAuthenticatedClient();
  if (!client) return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401, headers: rl.headers });
  try {
    const routers = await getRouters();
    const routerId = routers[0]?.id || "local";
    const [users, active, localCards, sales] = await Promise.all([
      client.getHotspotUsers(),
      client.getHotspotActive(),
      prisma.localCard.findMany({ where: { routerId }, select: { status: true } }),
      prisma.sale.findMany({ where: { createdAt: { gte: dayStart() } }, select: { total: true } }),
    ]);
    const activeRows = active as unknown as Array<Record<string,string>>;
    const bytesIn = activeRows.reduce((s,u)=>s+num(u["bytes-in"]),0);
    const bytesOut = activeRows.reduce((s,u)=>s+num(u["bytes-out"]),0);
    const reportDate = dayStart();
    const report = await prisma.dailyReport.upsert({
      where: { routerId_reportDate: { routerId, reportDate } },
      create: { routerId, reportDate, activeUsers: active.length, totalCards: users.length, usedCards: users.filter((u:any)=>u["bytes-in"] || u["bytes-out"] || u["uptime"]).length, disabledCards: localCards.filter(c=>c.status==="DISABLED").length, sessions: active.length, bytesIn, bytesOut, salesTotal: sales.reduce((s,x)=>s+x.total,0), salesCount: sales.length },
      update: { activeUsers: active.length, totalCards: users.length, usedCards: users.filter((u:any)=>u["bytes-in"] || u["bytes-out"] || u["uptime"]).length, disabledCards: localCards.filter(c=>c.status==="DISABLED").length, sessions: active.length, bytesIn, bytesOut, salesTotal: sales.reduce((s,x)=>s+x.total,0), salesCount: sales.length },
    });
    await prisma.sessionSnapshot.createMany({ data: activeRows.map(u=>({ routerId, username: u.user || "-", macAddress: u["mac-address"] || null, address: u.address || null, server: u.server || null, uptime: u.uptime || null, bytesIn: num(u["bytes-in"]), bytesOut: num(u["bytes-out"]) })) });
    await client.disconnect();
    const history = await prisma.dailyReport.findMany({ where: { routerId }, orderBy: { reportDate: "desc" }, take: 31 });
    return NextResponse.json({ success: true, data: { report, history, localCards: { total: localCards.length, active: localCards.filter(c=>c.status==="ACTIVE").length, disabled: localCards.filter(c=>c.status==="DISABLED").length }, activeSessions: active.length } }, { headers: rl.headers });
  } catch (e) { await client.disconnect().catch(()=>undefined); console.error(e); return NextResponse.json({ success:false,error:"Failed to build report"},{status:500,headers:rl.headers}); }
}
