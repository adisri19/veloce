import { Stage } from "@/lib/validations/common";
import { SlaState } from "@/lib/sla";

export interface ApplicationListItem {
  id: string;
  currentStage: Stage;
  kanbanOrder: number;
  aiMatchScore: number;
  stageEnteredAt: string;
  daysInStage: number;
  slaDays: number;
  slaState: SlaState;
  candidate: {
    id: string;
    publicCode: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    currentTitle: string | null;
    currentCompany: string | null;
    experienceYears: number;
    expectedSalary: number | null;
    skills: string[];
    tags: string[];
    source: string;
    location: string | null;
  };
  job: {
    id: string;
    code: string;
    title: string;
    department: string;
  };
  scorecardCount: number;
  avgScorecard: number | null;
  lastNoteAt: string | null;
  appliedAt: string;
  version: number;
}

export interface ApplicationListFacets {
  stages: Record<Stage, number>;
  departments: Record<string, number>;
  sources: Record<string, number>;
  jobs: { id: string; code: string; title: string; count: number }[];
  slaBreached: number;
}

export interface ApplicationListResult {
  items: ApplicationListItem[];
  facets: ApplicationListFacets;
  totals: {
    filtered: number;
    all: number;
  };
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface AnalyticsDashboardData {
  kpis: {
    activePipeline: number;
    activePipelineDelta: number;
    openHeadcount: {
      filled: number;
      total: number;
      pct: number;
    };
    meanTimeToHireDays: number;
    meanTimeToHireDelta: number;
    offerAcceptanceRate: number;
    activeSlaBreaches: {
      total: number;
      critical: number;
      warning: number;
    };
  };
  funnel: {
    stages: {
      stage: Stage;
      reached: number;
      stepConversionPct: number;
      cumulativePct: number;
      dropOff: number;
      inFlight: number;
      rejected: number;
      withdrawn: number;
    }[];
    dropOffMatrix: Record<string, Record<string, number>>;
  };
  velocity: {
    stage: Stage;
    avgDays: number;
    medianDays: number;
    p90Days: number;
    slaTargetDays: number;
    breachRatePct: number;
    isBottleneck: boolean;
  }[];
  slaRadar: {
    applicationId: string;
    candidateName: string;
    candidateCode: string;
    jobTitle: string;
    jobCode: string;
    stage: Stage;
    daysInStage: number;
    slaDays: number;
    overByDays: number;
    hiringManagerName: string;
  }[];
  sourceAttribution: {
    source: string;
    volume: number;
    highScoreCount: number;
    highScoreRatio: number;
    interviewReached: number;
    offerReached: number;
    interviewToOfferPct: number;
    hires: number;
  }[];
  requisitionHealth: {
    id: string;
    code: string;
    title: string;
    status: string;
    headcountTotal: number;
    headcountFilled: number;
    daysOpen: number;
    activeByStage: Record<Stage, number>;
    slaBreaches: number;
    avgMatchScore: number;
    healthScore: number;
    healthLabel: "HEALTHY" | "AT_RISK" | "CRITICAL" | "FILLED" | "ON_HOLD";
  }[];
  needsAttention: {
    id: string;
    applicationId: string;
    candidateName: string;
    candidateCode: string;
    jobTitle: string;
    jobCode: string;
    stage: Stage;
    type: "SLA_BREACH" | "MISSING_SCORECARD";
    severity: "CRITICAL" | "WARNING";
    reason: string;
    daysOverdue: number;
    owedBy?: string[];
  }[];
}
