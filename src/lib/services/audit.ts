import { prisma } from "../db";
import { jsonIn } from "../db-compat";

export interface LogAuditOptions {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  tx?: any; // Prisma transaction client
}

/**
 * Append-only audit logger. Writes directly inside a transaction if provided.
 */
export async function logAudit({
  entityType,
  entityId,
  action,
  actorId,
  metadata = {},
  ipAddress = null,
  tx,
}: LogAuditOptions): Promise<void> {
  const db = tx || prisma;
  await db.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorId: actorId || null,
      metadata: jsonIn(metadata),
      ipAddress: ipAddress || null,
    },
  });
}
