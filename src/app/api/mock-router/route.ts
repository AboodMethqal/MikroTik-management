import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import {
  getMockStatus,
  isMockRouterEnabled,
  readMockState,
  resetMockState,
  setMockStatus,
} from "@/lib/mock-router";
import type { MockStatus } from "@/lib/mock-router-data";

const VALID: MockStatus[] = ["CONNECTED", "DISCONNECTED", "UNREACHABLE"];

function denied() {
  return NextResponse.json(
    { success: false, error: "Mock router is disabled (set MOCK_ROUTER_ENABLED=true)" },
    { status: 403 },
  );
}

/** Mock router control plane: inspect status, switch state, reset seed data. */
export async function GET(request: NextRequest) {
  const rl = withRateLimit("readonly")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("router.read");
  if (!guard.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: guard.status, headers: rl.headers });
  if (!isMockRouterEnabled()) return denied();

  const state = await readMockState();
  return NextResponse.json(
    {
      success: true,
      data: {
        enabled: true,
        status: await getMockStatus(),
        seedVersion: state.seedVersion,
        counts: {
          interfaces: state.interfaces.length,
          wirelessClients: state.wireless.length,
          hotspotUsers: state.hotspotUsers.length,
          hotspotProfiles: state.hotspotProfiles.length,
          hotspotActive: state.hotspotActive.length,
          hotspotHosts: state.hotspotHosts.length,
          hotspotCookies: state.hotspotCookies.length,
          hotspotBindings: state.hotspotBindings.length,
          pppSecrets: state.pppSecrets.length,
          pppActive: state.pppActive.length,
          dhcpLeases: state.dhcpLeases.length,
          userManagerUsers: state.userManagerUsers.length,
          userManagerProfiles: state.userManagerProfiles.length,
          blockedClients: state.hotspotBindings.filter((b) => b.type === "blocked" && b.disabled !== "true").length,
        },
        identity: state.identity,
        model: state.model,
        version: state.version,
      },
    },
    { headers: rl.headers },
  );
}

export async function POST(request: NextRequest) {
  const rl = withRateLimit("api")(request);
  if (!rl.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rl.headers });
  const guard = await requirePermission("router.write");
  if (!guard.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: guard.status, headers: rl.headers });
  if (!isMockRouterEnabled()) return denied();

  let body: { action?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400, headers: rl.headers });
  }

  if (body.action === "reset") {
    const state = await resetMockState();
    await auditLog({
      action: "RESET",
      resource: "MOCK_ROUTER",
      actorName: guard.session?.user?.name || undefined,
      details: { hotspotUsers: state.hotspotUsers.length },
    });
    return NextResponse.json(
      { success: true, message: "Mock router data reset to seed", status: state.status },
      { headers: rl.headers },
    );
  }

  if (body.action === "status") {
    const status = String(body.status || "").toUpperCase() as MockStatus;
    if (!VALID.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Use one of: ${VALID.join(", ")}` },
        { status: 400, headers: rl.headers },
      );
    }
    await setMockStatus(status);
    await auditLog({
      action: "STATUS",
      resource: "MOCK_ROUTER",
      actorName: guard.session?.user?.name || undefined,
      details: { status },
    });
    return NextResponse.json({ success: true, data: { status } }, { headers: rl.headers });
  }

  return NextResponse.json(
    { success: false, error: "Unknown action. Use 'reset' or 'status'." },
    { status: 400, headers: rl.headers },
  );
}