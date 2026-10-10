/**
 * Removes transactions created while testing (POS sales, payments and their
 * ledger entries) and restores each point of sale to its seeded opening
 * balance. Seeded demo data (`createdBy = "seed"`) is preserved.
 *
 * Usage: node scripts/reset-test-transactions.cjs
 */
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main() {
  const testSales = await prisma.sale.findMany({
    where: { NOT: { createdBy: "seed" } },
    select: { id: true, createdBy: true },
  });
  const testPayments = await prisma.payment.findMany({
    where: { NOT: { createdBy: "seed" } },
    select: { id: true, createdBy: true },
  });

  let removedLedger = 0;
  for (const s of testSales) {
    const r = await prisma.ledgerEntry.deleteMany({ where: { saleId: s.id } });
    removedLedger += r.count;
  }
  for (const p of testPayments) {
    const r = await prisma.ledgerEntry.deleteMany({ where: { paymentId: p.id } });
    removedLedger += r.count;
  }
  const delSales = await prisma.sale.deleteMany({ where: { NOT: { createdBy: "seed" } } });
  const delPayments = await prisma.payment.deleteMany({ where: { NOT: { createdBy: "seed" } } });

  console.log(`Removed ${delSales.count} sales, ${delPayments.count} payments, ${removedLedger} ledger entries`);

  // Show the resulting balances so the state is verifiable.
  for (const pos of await prisma.pointOfSale.findMany()) {
    const rows = await prisma.ledgerEntry.findMany({
      where: { pointOfSaleId: pos.id },
      select: { debit: true, credit: true },
    });
    const balance = rows.reduce((b, r) => b + Number(r.debit || 0) - Number(r.credit || 0), 0);
    console.log(`  ${pos.name}: balance=${balance} creditLimit=${pos.creditLimit}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());