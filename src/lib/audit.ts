import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function auditLog(input: {
  action: string;
  resource: string;
  resourceId?: string;
  actorId?: string;
  actorName?: string;
  details?: unknown;
}) {
  try {
    const h = await headers();
    await prisma.auditLog.create({
      data: {
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        actorId: input.actorId,
        actorName: input.actorName,
        ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined,
        userAgent: h.get("user-agent") || undefined,
        details: input.details === undefined ? undefined : JSON.stringify(input.details),
      },
    });
  } catch (error) {
    // Auditing must never make the business operation fail.
    console.error("Audit log failed", error);
  }
}
