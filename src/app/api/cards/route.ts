import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("printing.read");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const q = new URL(request.url).searchParams;
  const search = q.get("search")?.trim() || "";
  const source = q.get("source") || undefined;
  const status = q.get("status") || undefined;
  const where: any = {};
  if (source) where.source = source;
  if (status) where.status = status;
  if (search) where.OR = [{ username: { contains: search } }, { serialNumber: { contains: search } }, { macAddress: { contains: search } }, { profile: { contains: search } }];
  const data = await prisma.localCard.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
  return NextResponse.json({ success: true, data }, { headers: rl.headers });
}

export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("printing.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const b = await request.json();
  if (!b.username || typeof b.username !== "string") return NextResponse.json({ success: false, error: "username is required" }, { status: 400, headers: rl.headers });
  const data = await prisma.localCard.create({ data: {
    routerId: typeof b.routerId === "string" ? b.routerId : undefined,
    source: typeof b.source === "string" ? b.source : "HOTSPOT",
    username: b.username,
    password: typeof b.password === "string" ? b.password : undefined,
    serialNumber: typeof b.serialNumber === "string" && b.serialNumber ? b.serialNumber : undefined,
    profile: typeof b.profile === "string" ? b.profile : undefined,
    packageName: typeof b.packageName === "string" ? b.packageName : undefined,
    validity: typeof b.validity === "string" ? b.validity : undefined,
    price: Number.isFinite(Number(b.price)) ? Number(b.price) : undefined,
    status: typeof b.status === "string" ? b.status : "ACTIVE",
    macAddress: typeof b.macAddress === "string" ? b.macAddress : undefined,
  }});
  return NextResponse.json({ success: true, data }, { headers: rl.headers });
}

export async function DELETE(request: NextRequest) {
  const rl = withRateLimit("sensitive")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("printing.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400, headers: rl.headers });
  await prisma.localCard.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
  return NextResponse.json({ success: true }, { headers: rl.headers });
}
