import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { getRouter } from "@/lib/router-config";
import {
  MOCK_ROUTER_HOST,
  MOCK_ROUTER_NAME,
  MOCK_ROUTER_PORT,
  isMockRouterEnabled,
  resetMockState,
} from "@/lib/mock-router";
import { encrypt } from "@/lib/crypto";

/**
 * Creates (or re-uses) the built-in virtual router.
 *
 * Idempotent: calling it twice never produces a second demo router, and the
 * seed dataset is restored so repeated runs are reproducible.
 */
export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("router.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: guard.status, headers: rl.headers });

  if (!isMockRouterEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: "Mock router is disabled. Set MOCK_ROUTER_ENABLED=true to enable it.",
      },
      { status: 403, headers: rl.headers },
    );
  }

  let created = false;
  let router = await prisma.router.findFirst({
    where: { isMock: true },
    orderBy: { createdAt: "desc" },
  });

  if (!router) {
    router = await prisma.router.create({
      data: {
        name: MOCK_ROUTER_NAME,
        host: MOCK_ROUTER_HOST,
        port: MOCK_ROUTER_PORT,
        username: "mock",
        // Encrypted at rest like any other router credential.
        password: `enc:${encrypt("mock")}`,
        hotspotName: "hotspot1",
        dnsName: "mock.local",
        currency: "USD",
        autoReload: 10,
        isMock: true,
      },
    });
    created = true;
  }

  // Always restore the deterministic dataset when explicitly (re)creating.
  await resetMockState();

  const full = await getRouter(router.id);
  await auditLog({
    action: created ? "CREATE" : "REUSE",
    resource: "MOCK_ROUTER",
    resourceId: router.id,
    actorName: guard.session?.user?.name || undefined,
  });

  return NextResponse.json(
    {
      success: true,
      created,
      data: full ? { ...full, password: undefined } : null,
    },
    { status: created ? 201 : 200, headers: rl.headers },
  );
}