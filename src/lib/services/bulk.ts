import { prisma } from "../db";
import { BulkOperationInput } from "../validations/bulk";
import { Actor } from "../auth";
import { validateStageTransition } from "../stage-rules";
import { logAudit } from "./audit";
import { RuleViolationError, ForbiddenError } from "../api";
import { Stage } from "../validations/common";
import { toList, fromList } from "../db-compat";

export interface BulkOperationResult {
  succeeded: number;
  items: any[];
}

export async function executeBulkOperation(
  input: BulkOperationInput,
  actor: Actor
): Promise<BulkOperationResult> {
  const { ids, op, payload } = input;

  // Enforce RBAC
  if (actor.role === "INTERVIEWER") {
    throw new ForbiddenError(`Role ${actor.role} cannot perform bulk operations`);
  }

  return await prisma.$transaction(
    async (tx: any) => {
      // 1. Fetch all applications
      const apps = await tx.application.findMany({
        where: { id: { in: ids } },
        include: {
          job: true,
          candidate: true,
          scorecards: true,
        },
      });

      if (apps.length !== ids.length) {
        const foundIds = new Set(apps.map((a: any) => a.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        throw new RuleViolationError("Some applications could not be found", {
          missingIds: missing,
        });
      }

      const errors: { id: string; code: string; message: string }[] = [];

      // 2. Pre-validate all items
      if (op === "MOVE_STAGE" || op === "REJECT") {
        const targetStage: Stage = op === "MOVE_STAGE" ? (payload as any).toStage : "REJECTED";
        const rejectionReason = op === "REJECT" ? (payload as any).rejectionReason : undefined;

        // Track simulated headcount additions per job
        const jobHeadcountDeltas: Record<string, number> = {};

        for (const app of apps) {
          const currentStage = app.currentStage as Stage;
          const currentFilled = app.job.headcountFilled + (jobHeadcountDeltas[app.job.id] || 0);

          const validation = validateStageTransition({
            currentStage,
            toStage: targetStage,
            userRole: actor.role,
            rejectionReason,
            job: {
              headcountTotal: app.job.headcountTotal,
              headcountFilled: currentFilled,
            },
            scorecardCount: app.scorecards.length,
          });

          if (!validation.allowed) {
            errors.push({
              id: app.id,
              code: validation.errorCode || "RULE_VIOLATION",
              message: validation.errorMessage || "Stage transition forbidden",
            });
          } else if (validation.headcountDelta) {
            jobHeadcountDeltas[app.job.id] =
              (jobHeadcountDeltas[app.job.id] || 0) + validation.headcountDelta;
          }
        }
      }

      // If any item failed validation, abort and roll back whole batch
      if (errors.length > 0) {
        throw new RuleViolationError("Bulk operation failed validation", errors);
      }

      // 3. Execute modifications
      const updatedItems: any[] = [];
      const now = new Date();

      if (op === "MOVE_STAGE" || op === "REJECT") {
        const targetStage: Stage = op === "MOVE_STAGE" ? (payload as any).toStage : "REJECTED";
        const reason = (payload as any).reason || (op === "REJECT" ? (payload as any).rejectionReason : null);

        // Find current max kanbanOrder in destination stage
        const lastCard = await tx.application.findFirst({
          where: { currentStage: targetStage },
          orderBy: { kanbanOrder: "desc" },
          select: { kanbanOrder: true },
        });

        let currentOrder = (lastCard?.kanbanOrder ?? 0) + 1000;

        for (const app of apps) {
          const fromStage = app.currentStage as Stage;
          const elapsed = Math.max(
            0,
            Math.floor((now.getTime() - app.stageEnteredAt.getTime()) / 1000)
          );

          if (fromStage !== targetStage) {
            await tx.stageTransitionLog.create({
              data: {
                applicationId: app.id,
                fromStage,
                toStage: targetStage,
                movedById: actor.id,
                durationInPreviousStageSeconds: elapsed,
                reason,
                timestamp: now,
              },
            });

            if (targetStage === "HIRED") {
              await tx.jobRequisition.update({
                where: { id: app.job.id },
                data: { headcountFilled: { increment: 1 } },
              });
            } else if (fromStage === "HIRED") {
              await tx.jobRequisition.update({
                where: { id: app.job.id },
                data: { headcountFilled: { decrement: 1 } },
              });
            }
          }

          const updated = await tx.application.update({
            where: { id: app.id },
            data: {
              currentStage: targetStage,
              kanbanOrder: currentOrder,
              stageEnteredAt: fromStage === targetStage ? app.stageEnteredAt : now,
              version: { increment: 1 },
              rejectionReason: op === "REJECT" ? (payload as any).rejectionReason : null,
              rejectionNotes: op === "REJECT" ? (payload as any).rejectionNotes : null,
            },
          });

          currentOrder += 1000;

          await logAudit({
            entityType: "Application",
            entityId: app.id,
            action: "STAGE_CHANGED",
            actorId: actor.id,
            metadata: {
              bulkOp: op,
              fromStage,
              toStage: targetStage,
              reason,
            },
            tx,
          });

          updatedItems.push(updated);
        }
      } else if (op === "ADD_TAGS") {
        const tagsToAdd = (payload as any).tags.map((t: string) => t.trim().toLowerCase());
        for (const app of apps) {
          const existing = toList(app.candidate.tags).map((t) => t.toLowerCase());
          const merged = Array.from(new Set([...existing, ...tagsToAdd]));
          await tx.candidate.update({
            where: { id: app.candidate.id },
            data: { tags: fromList(merged) },
          });

          await logAudit({
            entityType: "Candidate",
            entityId: app.candidate.id,
            action: "TAGS_ADDED",
            actorId: actor.id,
            metadata: { addedTags: tagsToAdd },
            tx,
          });
          updatedItems.push(app);
        }
      } else if (op === "REMOVE_TAGS") {
        const tagsToRemove = new Set((payload as any).tags.map((t: string) => t.trim().toLowerCase()));
        for (const app of apps) {
          const existing = toList(app.candidate.tags);
          const filtered = existing.filter((t) => !tagsToRemove.has(t.toLowerCase()));
          await tx.candidate.update({
            where: { id: app.candidate.id },
            data: { tags: fromList(filtered) },
          });

          await logAudit({
            entityType: "Candidate",
            entityId: app.candidate.id,
            action: "TAGS_REMOVED",
            actorId: actor.id,
            metadata: { removedTags: Array.from(tagsToRemove) },
            tx,
          });
          updatedItems.push(app);
        }
      } else if (op === "ARCHIVE" || op === "UNARCHIVE") {
        const isArchived = op === "ARCHIVE";
        for (const app of apps) {
          const updated = await tx.application.update({
            where: { id: app.id },
            data: {
              isArchived,
              version: { increment: 1 },
            },
          });

          await logAudit({
            entityType: "Application",
            entityId: app.id,
            action: isArchived ? "ARCHIVED" : "UNARCHIVED",
            actorId: actor.id,
            metadata: { reason: (payload as any).reason },
            tx,
          });
          updatedItems.push(updated);
        }
      }

      // 4. Write summary audit log for the bulk operation
      await logAudit({
        entityType: "Application",
        entityId: ids[0] || "bulk",
        action: `BULK_${op}`,
        actorId: actor.id,
        metadata: {
          count: ids.length,
          applicationIds: ids,
          payload,
        },
        tx,
      });

      return {
        succeeded: updatedItems.length,
        items: updatedItems,
      };
    },
    { timeout: 15000 }
  );
}
