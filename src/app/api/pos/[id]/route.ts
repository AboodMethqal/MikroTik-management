import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/authz";
import { posSchema, validateInput } from "@/lib/validations";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("pos.read");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const { id } = await params;
  const p = await prisma.pointOfSale.findUnique({ where: { id }, include: { sales: { include: { items: true }, orderBy: { createdAt: "desc" } }, payments: { orderBy: { createdAt: "desc" } }, ledger: { orderBy: { createdAt: "asc" } } } });
  if (!p) return NextResponse.json({ success: false, error: "Point of sale not found" }, { status: 404, headers: rl.headers });
  const debit = p.ledger.reduce((s, x) => s + Number(x.debit), 0);
  const credit = p.ledger.reduce((s, x) => s + Number(x.credit), 0);
  return NextResponse.json({ success: true, data: {
    ...p,
    openingBalance: Number(p.openingBalance), creditLimit: Number(p.creditLimit),
    sales: p.sales.map(x => ({ ...x, total: Number(x.total), items: x.items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), total: Number(i.total) })) })),
    payments: p.payments.map(x => ({ ...x, amount: Number(x.amount) })),
    ledger: p.ledger.map(x => ({ ...x, debit: Number(x.debit), credit: Number(x.credit) })),
    salesTotal: debit, paymentsTotal: credit, balance: debit - credit,
  } }, { headers: rl.headers });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = withRateLimit("api")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("pos.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const { id } = await params;
  const v = validateInput(posSchema, await request.json());
  if (!v.success) return NextResponse.json({ success: false, error: v.error }, { status: 400, headers: rl.headers });
  try {
    const existing = await prisma.pointOfSale.findUnique({ where: { id }, include: { ledger: { take: 1 } } });
    if (!existing) return NextResponse.json({ success: false, error: "Point of sale not found" }, { status: 404, headers: rl.headers });
    if (existing.openingBalance.toString() !== v.data.openingBalance.toString() && existing.ledger.length > 0) {
      return NextResponse.json({ success: false, error: "لا يمكن تغيير الرصيد الافتتاحي بعد وجود حركات مالية" }, { status: 409, headers: rl.headers });
    }
    const p = await prisma.pointOfSale.update({ where: { id }, data: v.data });
    await auditLog({ action: "UPDATE", resource: "POS", resourceId: id, actorName: guard.session?.user?.name || undefined });
    return NextResponse.json({ success: true, data: { ...p, openingBalance: Number(p.openingBalance), creditLimit: Number(p.creditLimit) } }, { headers: rl.headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update point of sale" }, { status: 500, headers: rl.headers });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = withRateLimit("sensitive")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("pos.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const { id } = await params;
  try {
    const existing = await prisma.pointOfSale.findUnique({ where: { id }, include: { sales: { take: 1 }, payments: { take: 1 }, ledger: { take: 1 } } });
    if (!existing) return NextResponse.json({ success: false, error: "Point of sale not found" }, { status: 404, headers: rl.headers });
    if (existing.sales.length || existing.payments.length || existing.ledger.length) return NextResponse.json({ success: false, error: "لا يمكن حذف نقطة بيع لديها سجلات مالية. عطّلها بدلًا من ذلك." }, { status: 409, headers: rl.headers });
    await prisma.pointOfSale.delete({ where: { id } });
    await auditLog({ action: "DELETE", resource: "POS", resourceId: id, actorName: guard.session?.user?.name || undefined });
    return NextResponse.json({ success: true }, { headers: rl.headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Cannot delete point of sale" }, { status: 500, headers: rl.headers });
  }
}
