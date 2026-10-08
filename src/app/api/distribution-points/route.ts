import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { distributionPointSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return NextResponse.json({ success:false, error:"Too many requests" }, { status:429, headers:rl.headers });
  const guard = await requirePermission("network.read");
  if (!guard.ok) return NextResponse.json({ success:false, error:guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status:guard.status, headers:rl.headers });
  const data = await prisma.distributionPoint.findMany({ include:{ router:{ select:{ id:true, name:true, host:true } } }, orderBy:{ name:"asc" } });
  return NextResponse.json({ success:true, data }, { headers:rl.headers });
}

export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request);
  if (!rl.allowed) return NextResponse.json({ success:false, error:"Too many requests" }, { status:429, headers:rl.headers });
  const guard = await requirePermission("network.write");
  if (!guard.ok) return NextResponse.json({ success:false, error:guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status:guard.status, headers:rl.headers });
  const parsed = distributionPointSchema.safeParse(await request.json().catch(()=>({})));
  if (!parsed.success) return NextResponse.json({ success:false, error:parsed.error.issues.map(x=>x.message).join(", ") }, { status:400, headers:rl.headers });
  try {
    const data = await prisma.distributionPoint.create({ data:parsed.data });
    await auditLog({ action:"CREATE", resource:"DISTRIBUTION_POINT", resourceId:data.id, actorName:guard.session?.user?.name || undefined, details:parsed.data });
    return NextResponse.json({ success:true, data }, { status:201, headers:rl.headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create distribution point";
    return NextResponse.json({ success:false, error:message.includes("Unique constraint") ? "هذا المنفذ مسجل مسبقًا لهذا الراوتر" : "تعذر إنشاء قطعة التوزيع" }, { status:409, headers:rl.headers });
  }
}
