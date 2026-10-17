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

export interface CalibrationMatrix {
  interviewerColumns: { id: string; name: string; avatarUrl: string | null }[];
  criteriaRows: {
    criterion: string;
    ratings: Record<string, number>;
    average: number;
    spread: number;
    hasDisagreement: boolean;
  }[];
  recommendations: Record<string, Recommendation>;
  calibrationNeeded: boolean;
  divergingInterviewers: string[];
}

export function computeCalibrationMatrix(scorecards: any[]): CalibrationMatrix {
  const interviewers = scorecards.map((s) => ({
    id: s.interviewer.id,
    name: s.interviewer.name,
    avatarUrl: s.interviewer.avatarUrl,
  }));

  const criteriaKeys = [
    { key: "technicalScore", label: "Technical Competency" },
    { key: "architectureScore", label: "Systems Architecture" },
    { key: "problemSolvingScore", label: "Problem Solving & Algorithmic" },
    { key: "communicationScore", label: "Communication & Collaboration" },
    { key: "cultureScore", label: "Values & Culture Alignment" },
  ];

  let maxSpreadAcrossAll = 0;
  const criteriaRows = criteriaKeys.map(({ key, label }) => {
    const ratings: Record<string, number> = {};
    const values: number[] = [];

    for (const sc of scorecards) {
      const val = sc[key] as number;
      ratings[sc.interviewerId] = val;
      values.push(val);
    }

    const avg = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
    const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
    if (spread > maxSpreadAcrossAll) maxSpreadAcrossAll = spread;

    return {
      criterion: label,
      ratings,
      average: avg,
      spread,
      hasDisagreement: spread >= 2,
    };
  });

  const recommendations: Record<string, Recommendation> = {};
  let hasYes = false;
  let hasNo = false;
  const divergingNames = new Set<string>();

  for (const sc of scorecards) {
    recommendations[sc.interviewerId] = sc.overallRecommendation as Recommendation;
    const rec = sc.overallRecommendation;
    if (rec === "YES" || rec === "STRONG_YES") {
      hasYes = true;
    }
    if (rec === "NO" || rec === "STRONG_NO") {
      hasNo = true;
    }
  }

  if (hasYes && hasNo) {
    for (const sc of scorecards) {
      divergingNames.add(sc.interviewer.name);
    }
  } else {
    for (const row of criteriaRows) {
      if (row.hasDisagreement) {
        for (const sc of scorecards) {
          divergingNames.add(sc.interviewer.name);
        }
      }
    }
  }

  const calibrationNeeded = (hasYes && hasNo) || maxSpreadAcrossAll >= 2;

  return {
    interviewerColumns: interviewers,
    criteriaRows,
    recommendations,
    calibrationNeeded,
    divergingInterviewers: Array.from(divergingNames),
  };
}
