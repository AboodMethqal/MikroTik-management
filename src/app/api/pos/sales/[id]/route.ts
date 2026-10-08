import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = withRateLimit("sensitive")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("pos.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action === "refund" ? "REFUNDED" : body.action === "void" ? "VOIDED" : null;
  if (!action) return NextResponse.json({ success: false, error: "action must be void or refund" }, { status: 400, headers: rl.headers });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id } });
      if (!sale || sale.status !== "COMPLETED") throw new Error("SALE_NOT_FOUND");
      await tx.sale.update({ where: { id }, data: { status: action } });
      if (action === "REFUNDED") {
        await tx.ledgerEntry.create({ data: { pointOfSaleId: sale.pointOfSaleId, type: "REFUND", debit: 0, credit: sale.total, reference: `REFUND-${sale.reference}`, description: `Refund for ${sale.reference}`, createdBy: guard.session?.user?.name || undefined } });
      } else {
        await tx.ledgerEntry.create({ data: { pointOfSaleId: sale.pointOfSaleId, type: "ADJUSTMENT", debit: 0, credit: sale.total, reference: `VOID-${sale.reference}`, description: `Void ${sale.reference}`, createdBy: guard.session?.user?.name || undefined } });
      }
      return sale;
    }, { isolationLevel: "Serializable" });
    await auditLog({ action, resource: "SALE", resourceId: id, actorName: guard.session?.user?.name || undefined, details: { reference: result.reference } });
    return NextResponse.json({ success: true, data: { id, status: action } }, { headers: rl.headers });
  } catch (error) {
    const status = error instanceof Error && error.message === "SALE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ success: false, error: status === 404 ? "Sale not found or already closed" : "Failed to close sale" }, { status, headers: rl.headers });
  }
}
