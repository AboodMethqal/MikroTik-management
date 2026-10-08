import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] || c));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return new NextResponse("Too many requests", { status: 429, headers: rl.headers });
  const guard = await requirePermission("sales.read");
  if (!guard.ok) return new NextResponse(guard.status === 401 ? "Unauthorized" : "Forbidden", { status: guard.status });
  const { id } = await params;
  const p = await prisma.pointOfSale.findUnique({ where: { id }, include: { ledger: { orderBy: { createdAt: "asc" } } } });
  if (!p) return new NextResponse("Not found", { status: 404 });
  let running = 0;
  const rows = p.ledger.map(entry => {
    const debit = Number(entry.debit); const credit = Number(entry.credit); running += debit - credit;
    return `<tr><td>${entry.createdAt.toISOString().slice(0,19).replace("T", " ")}</td><td>${escapeHtml(entry.type)}</td><td>${escapeHtml(entry.reference)}</td><td>${escapeHtml(entry.description || "")}</td><td>${debit.toFixed(2)}</td><td>${credit.toFixed(2)}</td><td>${running.toFixed(2)}</td></tr>`;
  }).join("");
  const totalDebit = p.ledger.reduce((s, x) => s + Number(x.debit), 0);
  const totalCredit = p.ledger.reduce((s, x) => s + Number(x.credit), 0);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>كشف حساب - ${escapeHtml(p.name)}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{margin-bottom:4px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}.box{border:1px solid #ddd;padding:12px;border-radius:8px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:right}th{background:#f3f3f3}@media print{button{display:none}}</style></head><body><button onclick="window.print()">طباعة / حفظ PDF</button><h1>كشف حساب نقطة البيع: ${escapeHtml(p.name)}</h1><div>${escapeHtml(p.phone || "")} ${escapeHtml(p.address || "")}</div><div class="summary"><div class="box">إجمالي المدين: ${totalDebit.toFixed(2)}</div><div class="box">إجمالي الدائن: ${totalCredit.toFixed(2)}</div><div class="box">الرصيد: ${(totalDebit-totalCredit).toFixed(2)}</div></div><table><thead><tr><th>التاريخ</th><th>النوع</th><th>المرجع</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`;
  return new NextResponse(html, { headers: { ...rl.headers, "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'" } });
}
