import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { adminUserSchema, validateInput } from "@/lib/validations";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { can } from "@/lib/permissions";

async function guard() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return { session, allowed: !!session && can(role, "*") };
}

export async function GET(request: Request) {
  const rl = withRateLimit("readonly")(request); if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const g = await guard(); if (!g.session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: rl.headers }); if (!g.allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403, headers: rl.headers });
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, username: true, role: true, active: true, createdAt: true, lastLoginAt: true } });
  return NextResponse.json({ success: true, data: users }, { headers: rl.headers });
}

export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request); if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const g = await guard(); if (!g.session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: rl.headers }); if (!g.allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403, headers: rl.headers });
  const v = validateInput(adminUserSchema, await request.json()); if (!v.success) return NextResponse.json({ success: false, error: v.error }, { status: 400, headers: rl.headers });
  try {
    const user = await prisma.adminUser.create({ data: { username: v.data.username, passwordHash: hashPassword(v.data.password), role: v.data.role, active: v.data.active }, select: { id: true, username: true, role: true, active: true } });
    await auditLog({ action: "CREATE", resource: "ADMIN_USER", resourceId: user.id, actorName: g.session.user?.name || undefined, details: { username: user.username, role: user.role } });
    return NextResponse.json({ success: true, data: user }, { headers: rl.headers });
  } catch { return NextResponse.json({ success: false, error: "Username already exists or database error" }, { status: 409, headers: rl.headers }); }
}
