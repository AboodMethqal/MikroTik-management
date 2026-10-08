import { NextResponse } from "next/server";
import { getRouterSession } from "@/lib/session";
import { auth } from "@/lib/auth";
export async function GET() {
  if (!(await auth())) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const s = await getRouterSession();
  if (!s) return NextResponse.json({ success: false, error: "No active router session" }, { status: 404 });
  return NextResponse.json({ success: true, data: { id: s.id, name: s.name, host: s.host, port: s.port, hotspotName: s.hotspotName, currency: s.currency } });
}
