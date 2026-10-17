import { Stage, RoleType, RejectionReason } from "./validations/common";

export interface StageTransitionValidationInput {
  currentStage: Stage;
  toStage: Stage;
  userRole: RoleType;
  rejectionReason?: RejectionReason;
  job: {
    headcountTotal: number;
    headcountFilled: number;
  };
  scorecardCount?: number;
}

export interface StageTransitionValidationResult {
  allowed: boolean;
  isReorder: boolean;
  errorCode?: "FORBIDDEN" | "RULE_VIOLATION";
  errorMessage?: string;
  warnings?: string[];
  headcountDelta?: number;
  closeJob?: boolean;
}

export function validateStageTransition(
  input: StageTransitionValidationInput
): StageTransitionValidationResult {
  const { currentStage, toStage, userRole, rejectionReason, job, scorecardCount = 0 } = input;

  // 1. Same-stage move is a pure reorder
  if (currentStage === toStage) {
    return {
      allowed: true,
      isReorder: true,
      warnings: [],
      headcountDelta: 0,
    };
  }

  // 2. Role permissions: moving to OFFER, HIRED, or REJECTED requires ADMIN, HIRING_MANAGER, or RECRUITER
  const privilegedStages: Stage[] = ["OFFER", "HIRED", "REJECTED"];
  if (privilegedStages.includes(toStage) && userRole === "INTERVIEWER") {
    return {
      allowed: false,
      isReorder: false,
      errorCode: "FORBIDDEN",
      errorMessage: `Role ${userRole} cannot transition application to ${toStage}`,
    };
  }

  // 3. Moving out of HIRED is allowed only for ADMIN
  if (currentStage === "HIRED" && userRole !== "ADMIN") {
    return {
      allowed: false,
      isReorder: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only ADMIN can move candidates out of HIRED stage",
    };
  }

  // 4. HIRED is reachable ONLY from OFFER
  if (toStage === "HIRED" && currentStage !== "OFFER") {
    return {
      allowed: false,
      isReorder: false,
      errorCode: "RULE_VIOLATION",
      errorMessage: `Cannot move to HIRED from ${currentStage}. Candidates must be in OFFER stage to be hired.`,
    };
  }

  // 5. REJECTED requires rejectionReason
  if (toStage === "REJECTED" && !rejectionReason) {
    return {
      allowed: false,
      isReorder: false,
      errorCode: "RULE_VIOLATION",
      errorMessage: "Rejection reason is required when moving to REJECTED stage",
    };
  }

  // 6. Headcount check for HIRED
  let headcountDelta = 0;
  let closeJob = false;

  if (toStage === "HIRED") {
    if (job.headcountFilled >= job.headcountTotal) {
      return {
        allowed: false,
        isReorder: false,
        errorCode: "RULE_VIOLATION",
        errorMessage: "HEADCOUNT_FULL: Job requisition headcount is already fully filled",
      };
    }
    headcountDelta = 1;
    if (job.headcountFilled + 1 >= job.headcountTotal) {
      closeJob = true;
    }
  } else if (currentStage === "HIRED") {
    // Moving out of HIRED decrements headcount
    headcountDelta = -1;
  }

  // 7. Warnings: moving to TECHNICAL_INTERVIEW or later with 0 scorecards
  const warnings: string[] = [];
  const lateStages: Stage[] = ["TECHNICAL_INTERVIEW", "SYSTEM_DESIGN", "OFFER", "HIRED"];
  if (lateStages.includes(toStage) && scorecardCount === 0 && currentStage === "APPLIED") {
    warnings.push("NO_SCREENING_SCORECARD");
  }

  return {
    allowed: true,
    isReorder: false,
    warnings,
    headcountDelta,
    closeJob,
  };
}
