import { prisma, isSqlite } from "../db";
import { StageTransitionInput } from "../validations/stage";
import { Actor } from "../auth";
import { validateStageTransition } from "../stage-rules";
import { computeFractionalIndex } from "../fractional-index";
import { logAudit } from "./audit";
import { dispatchAutomations } from "./automations";
import { NotFoundError, ConflictError, RuleViolationError, ForbiddenError } from "../api";
import { Stage } from "../validations/common";

export interface StageTransitionResult {
  application: any;
  transitionLog: any | null;
  warnings: string[];
  undoToken: {
    applicationId: string;
    fromStage: Stage;
    previousOrder: number;
    version: number;
  };
}

export async function transitionStage(
  applicationId: string,
  input: StageTransitionInput,
  actor: Actor
): Promise<StageTransitionResult> {
  const { toStage, beforeId, afterId, reason, rejectionReason, rejectionNotes, expectedVersion } = input;

  const result = await prisma.$transaction(
    async (tx: any) => {
      // 1. Fetch application with job and scorecards
      // On Postgres, row-level locks can be used; SQLite serializes writes automatically.
      const app = await tx.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
          scorecards: true,
        },
      });

      if (!app) {
        throw new NotFoundError(`Application with ID ${applicationId} not found`);
      }

      // Check optimistic concurrency version
      if (expectedVersion !== undefined && app.version !== expectedVersion) {
        throw new ConflictError(
          "Application was updated by someone else. Please refresh and try again.",
          { currentVersion: app.version, expectedVersion }
        );
      }

      const currentStage = app.currentStage as Stage;

      // 2. Transition rules validation
      const ruleResult = validateStageTransition({
        currentStage,
        toStage,
        userRole: actor.role,
        rejectionReason,
        job: {
          headcountTotal: app.job.headcountTotal,
          headcountFilled: app.job.headcountFilled,
        },
        scorecardCount: app.scorecards.length,
      });

      if (!ruleResult.allowed) {
        if (ruleResult.errorCode === "FORBIDDEN") {
          throw new ForbiddenError(ruleResult.errorMessage);
        }
        throw new RuleViolationError(ruleResult.errorMessage);
      }

      // 3. Headcount updates if entering or leaving HIRED
      if (ruleResult.headcountDelta && ruleResult.headcountDelta !== 0) {
        await tx.jobRequisition.update({
          where: { id: app.job.id },
          data: {
            headcountFilled: { increment: ruleResult.headcountDelta },
            ...(ruleResult.closeJob
              ? { status: "CLOSED", closedAt: new Date() }
              : {}),
          },
        });
      }

      // 4. Fractional ordering calculation within destination column
      const columnItems = await tx.application.findMany({
        where: {
          currentStage: toStage,
          isArchived: false,
        },
        select: { id: true, kanbanOrder: true },
        orderBy: { kanbanOrder: "asc" },
      });

      const orderResult = computeFractionalIndex(columnItems, app.id, beforeId, afterId);

      // If rebalance is required, update all items in the column
      if (orderResult.needsRebalance && orderResult.rebalancedItems) {
        for (const rebalanced of orderResult.rebalancedItems) {
          if (rebalanced.id !== app.id) {
            await tx.application.update({
              where: { id: rebalanced.id },
              data: { kanbanOrder: rebalanced.kanbanOrder },
            });
          }
        }
      }

      const now = new Date();
      let transitionLogRow = null;

      // 5. If moving between different stages, write StageTransitionLog
      if (!ruleResult.isReorder) {
        const elapsedSeconds = Math.max(
          0,
          Math.floor((now.getTime() - app.stageEnteredAt.getTime()) / 1000)
        );

        transitionLogRow = await tx.stageTransitionLog.create({
          data: {
            applicationId: app.id,
            fromStage: currentStage,
            toStage,
            movedById: actor.id,
            durationInPreviousStageSeconds: elapsedSeconds,
            reason: reason || (rejectionReason ? `Rejected: ${rejectionReason}` : null),
            timestamp: now,
          },
        });
      }

      // 6. Update Application row
      const updatedApp = await tx.application.update({
        where: { id: app.id },
        data: {
          currentStage: toStage,
          kanbanOrder: orderResult.newOrder,
          stageEnteredAt: ruleResult.isReorder ? app.stageEnteredAt : now,
          version: { increment: 1 },
          rejectionReason: toStage === "REJECTED" ? rejectionReason : null,
          rejectionNotes: toStage === "REJECTED" ? rejectionNotes : null,
        },
        include: {
          candidate: true,
          job: true,
        },
      });

      // 7. Audit log inside the transaction
      await logAudit({
        entityType: "Application",
        entityId: app.id,
        action: ruleResult.isReorder ? "REORDERED" : "STAGE_CHANGED",
        actorId: actor.id,
        metadata: {
          fromStage: currentStage,
          toStage,
          orderBefore: app.kanbanOrder,
          orderAfter: orderResult.newOrder,
          reason,
          warnings: ruleResult.warnings,
          headcountDelta: ruleResult.headcountDelta,
        },
        tx,
      });

      return {
        updatedApp,
        transitionLogRow,
        warnings: ruleResult.warnings || [],
        undoToken: {
          applicationId: app.id,
          fromStage: currentStage,
          previousOrder: app.kanbanOrder,
          version: updatedApp.version,
        },
      };
    },
    { timeout: 10000 }
  );

  // 8. Outside transaction: dispatch automations (best effort)
  if (result.updatedApp.currentStage !== result.undoToken.fromStage) {
    dispatchAutomations({
      trigger: "STAGE_ENTERED",
      applicationId: result.updatedApp.id,
      candidateId: result.updatedApp.candidateId,
      jobId: result.updatedApp.jobId,
      toStage: result.updatedApp.currentStage,
      matchScore: result.updatedApp.aiMatchScore,
    }).catch(console.error);

    if (result.updatedApp.currentStage === "HIRED") {
      dispatchAutomations({
        trigger: "HIRED",
        applicationId: result.updatedApp.id,
        candidateId: result.updatedApp.candidateId,
        jobId: result.updatedApp.jobId,
      }).catch(console.error);
    }
  }

  return {
    application: result.updatedApp,
    transitionLog: result.transitionLogRow,
    warnings: result.warnings,
    undoToken: result.undoToken,
  };
}
