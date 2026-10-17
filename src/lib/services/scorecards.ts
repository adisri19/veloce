import { prisma } from "../db";
import { ScorecardCreateInput } from "../validations/scorecard";
import { Actor } from "../auth";
import { logAudit } from "./audit";
import { dispatchAutomations } from "./automations";
import { NotFoundError, ConflictError } from "../api";
import { Stage, Recommendation } from "../validations/common";

export async function submitScorecard(
  applicationId: string,
  input: ScorecardCreateInput,
  actor: Actor
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundError(`Application ${applicationId} not found`);
  }

  const stage = (input.stage || application.currentStage) as Stage;

  // Check if this interviewer has already submitted for this application and stage
  const existing = await prisma.scorecard.findUnique({
    where: {
      applicationId_interviewerId_stage: {
        applicationId,
        interviewerId: actor.id,
        stage,
      },
    },
  });

  if (existing) {
    throw new ConflictError(
      "You have already submitted a scorecard for this candidate in this stage. Offer to edit existing submission.",
      { existingId: existing.id }
    );
  }

  const scorecard = await prisma.scorecard.create({
    data: {
      applicationId,
      interviewerId: actor.id,
      stage,
      technicalScore: input.technicalScore,
      architectureScore: input.architectureScore,
      problemSolvingScore: input.problemSolvingScore,
      communicationScore: input.communicationScore,
      cultureScore: input.cultureScore,
      overallRecommendation: input.overallRecommendation,
      strengths: input.strengths,
      concerns: input.concerns,
    },
    include: {
      interviewer: {
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      },
    },
  });

  await logAudit({
    entityType: "Scorecard",
    entityId: scorecard.id,
    action: "CREATED",
    actorId: actor.id,
    metadata: {
      applicationId,
      stage,
      recommendation: input.overallRecommendation,
    },
  });

  dispatchAutomations({
    trigger: "SCORECARD_SUBMITTED",
    applicationId,
    candidateId: application.candidateId,
    jobId: application.jobId,
    metadata: { recommendation: input.overallRecommendation },
  }).catch(console.error);

  return scorecard;
}

export { computeCalibrationMatrix, type CalibrationMatrix } from "../calibration";

