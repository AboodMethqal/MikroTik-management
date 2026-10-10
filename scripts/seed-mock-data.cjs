/**
 * Seeds the application-side (Prisma) data that pairs with the mock router:
 * distribution points, points of sale, sales, payments and ledger entries.
 *
 * These tables belong to the application, not to RouterOS, so they live in the
 * database exactly like real production data. Everything is deterministic and
 * references the mock router so it can be reset safely.
 *
 * Usage: node scripts/seed-mock-data.cjs   (development / testing only)
 */
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const DAY = 24 * 60 * 60 * 1000;
function dayStart(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + offset * DAY);
}

async function main() {
  const router = await prisma.router.findFirst({ where: { isMock: true } });
  if (!router) {
    console.log("No mock router found. Create it first from Admin Settings.");
    return;
  }
  console.log(`Seeding app data for mock router ${router.name} (${router.id})`);

  // ---- Distribution points (mapped to interfaces that really have clients) ----
  const existingDp = await prisma.distributionPoint.count({ where: { routerId: router.id } });
  if (existingDp === 0) {
    await prisma.distributionPoint.createMany({
      data: [
        { routerId: router.id, name: "DP-A — المبنى الرئيسي", interfaceName: "wlan1", description: "AP 5GHz - المبنى الرئيسي", capacityMbps: 200, active: true },
        { routerId: router.id, name: "DP-B — المبنى الخلفي", interfaceName: "wlan2", description: "AP 2.4GHz - المبنى الخلفي", capacityMbps: 100, active: true },
        { routerId: router.id, name: "DP-C — منطقة خارجية", interfaceName: "wlan3", description: "AP 5GHz - Outdoor", capacityMbps: 150, active: true },
        { routerId: router.id, name: "DP-D — قطاع سلكي 1", interfaceName: "ether2", description: "عمود سلكي 10.20.1.0/24", capacityMbps: 300, active: true },
        { routerId: router.id, name: "DP-E — قطاع سلكي 2", interfaceName: "ether3", description: "عمود سلكي 10.20.2.0/24", capacityMbps: 300, active: true },
      ],
    });
    console.log("  + 5 distribution points (3 wireless + 2 wired)");
  }

  // ---- Points of sale ----
  // The ledger treats a positive opening balance as an outstanding amount the
  // point of sale is already carrying, so creditLimit must stay well above it
  // (otherwise every new sale is rejected by the credit-limit rule).
  const posDefs = [
    { name: "نقطة البيع الرئيسية", phone: "+967770000001", address: "الشارع الرئيسي", openingBalance: 100000, creditLimit: 2000000 },
    { name: "نقطة بيع الفرع", phone: "+967770000002", address: "الفرع الثاني", openingBalance: 50000, creditLimit: 1500000 },
  ];
  const poss = [];
  for (const def of posDefs) {
    let pos = await prisma.pointOfSale.findFirst({ where: { name: def.name } });
    if (!pos) {
      pos = await prisma.pointOfSale.create({ data: def });
      await prisma.ledgerEntry.create({
        data: {
          pointOfSaleId: pos.id,
          type: "OPENING_BALANCE",
          debit: def.openingBalance,
          credit: 0,
          reference: `OPENING-${pos.id}`,
          description: "الرصيد الافتتاحي (بيانات تجريبية)",
        },
      });
      console.log(`  + POS ${def.name}`);
    }
    poss.push(pos);
  }

  // ---- Sales, payments, ledger ----
  const salesCount = await prisma.sale.count();
  if (salesCount === 0) {
    const profiles = [
      { cardType: "هوت سبوت", profile: "1HOUR", price: 2000 },
      { cardType: "هوت سبوت", profile: "DAILY", price: 10000 },
      { cardType: "User Manager", profile: "UM-1D", price: 12000 },
    ];
    let made = 0;
    for (let d = 20; d >= 0; d--) {
      // Fewer sales on older days so reports/filtering have a realistic shape.
      const count = d === 0 ? 4 : 1 + ((d * 7) % 5);
      for (let i = 0; i < count; i++) {
        const pos = poss[(d + i) % poss.length];
        const p = profiles[(d + i) % profiles.length];
        const qty = 1 + ((d + i) % 4);
        const unit = p.price;
        const total = qty * unit;
        const createdAt = new Date(dayStart(-d).getTime() + 9 * 60 * 60 * 1000 + i * 47 * 60 * 1000);
        const reference = `SAL-SEED-${d}-${i}`;
        const sale = await prisma.sale.create({
          data: {
            pointOfSaleId: pos.id,
            routerId: router.id,
            reference,
            note: "بيع تجريبي (mock seed)",
            total,
            status: "COMPLETED",
            createdAt,
            createdBy: "seed",
            items: {
              create: [{ cardType: p.cardType, username: null, profile: p.profile, quantity: qty, unitPrice: unit, total }],
            },
          },
        });
        await prisma.ledgerEntry.create({
          data: {
            pointOfSaleId: pos.id,
            saleId: sale.id,
            type: "SALE",
            debit: total,
            credit: 0,
            reference,
            description: "بيع كروت (بيانات تجريبية)",
            createdAt,
            createdBy: "seed",
          },
        });
        // POS 1 stays partially open (debt), POS 2 is settled.
        const payRatio = pos.id === poss[0].id ? 0.6 : 1;
        const amount = Math.round((total * payRatio) / 500) * 500;
        if (amount > 0) {
          const payment = await prisma.payment.create({
            data: {
              pointOfSaleId: pos.id,
              amount,
              note: "دفعة تجريبية",
              createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
              createdBy: "seed",
            },
          });
          await prisma.ledgerEntry.create({
            data: {
              pointOfSaleId: pos.id,
              paymentId: payment.id,
              type: "PAYMENT",
              debit: 0,
              credit: amount,
              reference: `PAY-${payment.id}`,
              description: "تحصيل (بيانات تجريبية)",
              createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
              createdBy: "seed",
            },
          });
        }
        made++;
      }
    }
    console.log(`  + ${made} sales with ledger entries and payments`);
  }

  // ---- Historical daily reports + session snapshots (for the reports pages) ----
  // Upsert per day: the app itself writes today's row when /api/reports/summary
  // is opened, so a blanket "count() === 0" check would skip the history.
  let reportMade = 0;
  for (let d = 29; d >= 0; d--) {
    const reportDate = dayStart(-d);
    const exists = await prisma.dailyReport.findUnique({
      where: { routerId_reportDate: { routerId: router.id, reportDate } },
    });
    if (exists) continue;
    const base = 120_000_000 + (29 - d) * 3_500_000;
    const salesOfDay = await prisma.sale.aggregate({
      where: { createdAt: { gte: reportDate, lt: new Date(reportDate.getTime() + DAY) } },
      _sum: { total: true },
      _count: { _all: true },
    });
    await prisma.dailyReport.create({
      data: {
        routerId: router.id,
        reportDate,
        activeUsers: 8 + ((d * 3) % 12),
        totalCards: 120,
        usedCards: 40 + ((d * 5) % 60),
        disabledCards: 5 + (d % 8),
        sessions: 20 + ((d * 7) % 30),
        bytesIn: base,
        bytesOut: Math.round(base * 0.42),
        salesTotal: Number(salesOfDay._sum.total || 0),
        salesCount: salesOfDay._count._all,
      },
    });
    reportMade++;
  }
  if (reportMade) console.log(`  + ${reportMade} daily reports`);

  // Session snapshots for the per-client consumption report.
  const snapshots = await prisma.sessionSnapshot.count({ where: { routerId: router.id } });
  if (snapshots === 0) {
    const macs = ["DC:2C:6A:00:00:11", "DC:2C:6A:00:00:12", "E8:94:F6:00:10:21", "E8:94:F6:00:10:22", "A4:2B:B0:10:00:05", "A4:2B:B0:10:00:06"];
    for (let i = 0; i < macs.length; i++) {
      for (let d = 6; d >= 0; d--) {
        await prisma.sessionSnapshot.create({
          data: {
            routerId: router.id,
            username: `test${String((i + 1) * 7).padStart(3, "0")}`,
            macAddress: macs[i],
            address: `10.5.50.${20 + i}`,
            server: "hotspot1",
            uptime: `${2 + i}h`,
            bytesIn: 80_000_000 * (i + 1) * (1 + (6 - d) * 0.1),
            bytesOut: 25_000_000 * (i + 1) * (1 + (6 - d) * 0.08),
            recordedAt: new Date(dayStart(-d).getTime() + 20 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log("  + session snapshots for client reports");
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());