import { Recommendation } from "./validations/common";

export interface ScorecardLike {
  id: string;
  interviewerId: string;
  interviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  technicalScore: number;
  architectureScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  cultureScore: number;
  overallRecommendation: Recommendation | string;
  strengths?: string;
  concerns?: string;
  submittedAt?: string | Date;
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

export function computeCalibrationMatrix(scorecards: ScorecardLike[]): CalibrationMatrix {
  const interviewers = scorecards.map((s) => ({
    id: s.interviewer.id,
    name: s.interviewer.name,
    avatarUrl: s.interviewer.avatarUrl,
  }));

  const criteriaKeys: Array<{
    key: keyof Pick<
      ScorecardLike,
      | "technicalScore"
      | "architectureScore"
      | "problemSolvingScore"
      | "communicationScore"
      | "cultureScore"
    >;
    label: string;
  }> = [
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

    const avg =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;
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
    const rec = sc.overallRecommendation as Recommendation;
    recommendations[sc.interviewerId] = rec;
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
