import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/authz";
import { validateInput, paymentSchema, posSchema, saleSchema } from "@/lib/validations";
import { withRateLimit } from "@/lib/rate-limit";

const serializePos = (p: any) => ({
  ...p,
  openingBalance: Number(p.openingBalance),
  creditLimit: Number(p.creditLimit),
});
const toAmount = (value: number) => Number(value);

async function balanceFor(tx: any, pointOfSaleId: string) {
  const rows = await tx.ledgerEntry.findMany({
    where: { pointOfSaleId },
    select: { debit: true, credit: true },
  });
  return rows.reduce((b: number, row: any) => b + Number(row.debit || 0) - Number(row.credit || 0), 0);
}

export async function GET(request: NextRequest) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("pos.read");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });
  try {
    const points = await prisma.pointOfSale.findMany({ orderBy: { createdAt: "desc" } });
    const data = await Promise.all(points.map(async (p) => {
      const balance = await balanceFor(prisma, p.id);
      const totals = await prisma.ledgerEntry.aggregate({ where: { pointOfSaleId: p.id }, _sum: { debit: true, credit: true } });
      return { ...serializePos(p), salesTotal: Number(totals._sum.debit || 0), paymentsTotal: Number(totals._sum.credit || 0), balance: Number(balance) };
    }));
    return NextResponse.json({ success: true, data }, { headers: rl.headers });
  } catch (error) {
    console.error("POS list failed", error);
    return NextResponse.json({ success: false, error: "Failed to load points of sale" }, { status: 500, headers: rl.headers });
  }
}

export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("pos.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" }, { status: guard.status, headers: rl.headers });

  try {
    const body = await request.json();
    const type = body.type || "pos";

    if (type === "pos") {
      const v = validateInput(posSchema, body);
      if (!v.success) return NextResponse.json({ success: false, error: v.error }, { status: 400, headers: rl.headers });
      const created = await prisma.$transaction(async (tx) => {
        const p = await tx.pointOfSale.create({ data: v.data });
        if (v.data.openingBalance > 0) {
          await tx.ledgerEntry.create({ data: {
            pointOfSaleId: p.id, type: "OPENING_BALANCE", debit: toAmount(v.data.openingBalance), credit: 0,
            reference: `OPENING-${p.id}`, description: "الرصيد الافتتاحي", createdBy: guard.session?.user?.name || undefined,
          }});
        }
        return p;
      }, { isolationLevel: "Serializable" });
      await auditLog({ action: "CREATE", resource: "POS", resourceId: created.id, actorName: guard.session?.user?.name || undefined, details: { name: created.name } });
      return NextResponse.json({ success: true, data: serializePos(created) }, { headers: rl.headers });
    }

    if (type === "sale") {
      const v = validateInput(saleSchema, body);
      if (!v.success) return NextResponse.json({ success: false, error: v.error }, { status: 400, headers: rl.headers });
      const total = v.data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      if (!Number.isFinite(total) || total <= 0) return NextResponse.json({ success: false, error: "Sale total must be greater than zero" }, { status: 400, headers: rl.headers });
      const result = await prisma.$transaction(async (tx) => {
        const point = await tx.pointOfSale.findUnique({ where: { id: v.data.pointOfSaleId } });
        if (!point || !point.active) throw new Error("POS_NOT_FOUND");
        const currentBalance = await balanceFor(tx, point.id);
        const projected = currentBalance + toAmount(total);
        if (Number(point.creditLimit) > 0 && projected > toAmount(Number(point.creditLimit))) throw new Error("CREDIT_LIMIT");
        const reference = `SAL-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${cryptoRandom(6)}`;
        const sale = await tx.sale.create({ data: {
          pointOfSaleId: point.id, routerId: v.data.routerId, reference, note: v.data.note, total: toAmount(total), createdBy: guard.session?.user?.name || undefined,
          items: { create: v.data.items.map(i => ({ ...i, unitPrice: toAmount(i.unitPrice), total: toAmount(i.quantity * i.unitPrice) })) },
        }});
        await tx.ledgerEntry.create({ data: {
          pointOfSaleId: point.id, saleId: sale.id, type: "SALE", debit: toAmount(total), credit: 0, reference,
          description: v.data.note || "بيع كروت", createdBy: guard.session?.user?.name || undefined,
        }});
        return sale;
      }, { isolationLevel: "Serializable" });
      await auditLog({ action: "CREATE", resource: "SALE", resourceId: result.id, actorName: guard.session?.user?.name || undefined, details: { reference: result.reference, total } });
      return NextResponse.json({ success: true, data: { ...result, total: Number(result.total) } }, { headers: rl.headers });
    }

    if (type === "payment") {
      const v = validateInput(paymentSchema, body);
      if (!v.success) return NextResponse.json({ success: false, error: v.error }, { status: 400, headers: rl.headers });
      const result = await prisma.$transaction(async (tx) => {
        const point = await tx.pointOfSale.findUnique({ where: { id: v.data.pointOfSaleId } });
        if (!point || !point.active) throw new Error("POS_NOT_FOUND");
        const outstanding = await balanceFor(tx, point.id);
        const amount = toAmount(v.data.amount);
        if (outstanding <= 0) throw new Error("NO_OUTSTANDING");
        if (amount > outstanding) throw new Error("PAYMENT_EXCEEDS_BALANCE");
        const payment = await tx.payment.create({ data: { ...v.data, amount, createdBy: guard.session?.user?.name || undefined } });
        await tx.ledgerEntry.create({ data: {
          pointOfSaleId: point.id, paymentId: payment.id, type: "PAYMENT", debit: 0, credit: amount,
          reference: `PAY-${payment.id}`, description: v.data.note || "تحصيل", createdBy: guard.session?.user?.name || undefined,
        }});
        return payment;
      }, { isolationLevel: "Serializable" });
      await auditLog({ action: "CREATE", resource: "PAYMENT", resourceId: result.id, actorName: guard.session?.user?.name || undefined, details: { amount: v.data.amount, pointOfSaleId: v.data.pointOfSaleId } });
      return NextResponse.json({ success: true, data: { ...result, amount: Number(result.amount) } }, { headers: rl.headers });
    }

    return NextResponse.json({ success: false, error: "Unknown POS operation" }, { status: 400, headers: rl.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "POS operation failed";
    const map: Record<string, [string, number]> = {
      POS_NOT_FOUND: ["نقطة البيع غير موجودة أو غير فعالة", 404],
      CREDIT_LIMIT: ["تم تجاوز الحد الائتماني", 409],
      NO_OUTSTANDING: ["لا يوجد رصيد مستحق", 409],
      PAYMENT_EXCEEDS_BALANCE: ["قيمة الدفعة أكبر من الرصيد المستحق", 409],
    };
    const [errorText, status] = map[message] || ["POS operation failed", 500];
    console.error("POS operation failed", error);
    return NextResponse.json({ success: false, error: errorText }, { status, headers: rl.headers });
  }
}

function cryptoRandom(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
