import { auth } from "@/lib/auth";
import { can, type AppRole } from "@/lib/permissions";

export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, status: 401, session: null };
  const role = ((session.user as { role?: AppRole }).role || "VIEWER") as AppRole;
  if (!can(role, permission)) return { ok: false as const, status: 403, session };
  return { ok: true as const, status: 200, session, role };
}
