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
  // Must stay wrapped: an unhandled database error would return a non-JSON
  // error page and break clients calling res.json() ("Unexpected end of JSON input").
  try {
    const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, username: true, role: true, active: true, createdAt: true, lastLoginAt: true } });
    return NextResponse.json({ success: true, data: users }, { headers: rl.headers });
  } catch (error) {
    console.error("Failed to list admin users:", error);
    return NextResponse.json({ success: false, error: "Failed to load admin users" }, { status: 500, headers: rl.headers });
  }
}

export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request); if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const g = await guard(); if (!g.session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: rl.headers }); if (!g.allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403, headers: rl.headers });
  const v = validateInput(adminUserSchema, await request.json()); if (!v.success) return NextResponse.json({ success: false, error: v.error }, { status: 400, headers: rl.headers });
  try {
    const user = await prisma.adminUser.create({ data: { username: v.data.username, passwordHash: hashPassword(v.data.password), role: v.data.role, active: v.data.active }, select: { id: true, username: true, role: true, active: true } });
    await auditLog({ action: "CREATE", resource: "ADMIN_USER", resourceId: user.id, actorName: g.session.user?.name || undefined, details: { username: user.username, role: user.role } });
    return NextResponse.json({ success: true, data: user }, { headers: rl.headers });
  } catch (error) {
    console.error("Failed to create admin user:", error);
    const isUnique = error instanceof Error && /unique|already exists/i.test(error.message);
    return NextResponse.json({ success: false, error: isUnique ? "Username already exists" : "Failed to create user" }, { status: isUnique ? 409 : 500, headers: rl.headers });
  }
}
