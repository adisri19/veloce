import { describe, it, expect } from "vitest";
import { validateStageTransition } from "../src/lib/stage-rules";

describe("Stage Transition Rules", () => {
  const baseJob = {
    headcountTotal: 3,
    headcountFilled: 1,
  };

  it("permits standard forward progression", () => {
    const res = validateStageTransition({
      currentStage: "APPLIED",
      toStage: "SCREENING",
      userRole: "RECRUITER",
      job: baseJob,
    });
    expect(res.allowed).toBe(true);
    expect(res.isReorder).toBe(false);
  });

  it("detects same-stage move as reorder", () => {
    const res = validateStageTransition({
      currentStage: "SCREENING",
      toStage: "SCREENING",
      userRole: "RECRUITER",
      job: baseJob,
    });
    expect(res.allowed).toBe(true);
    expect(res.isReorder).toBe(true);
  });

  it("blocks transition to HIRED from non-OFFER stage", () => {
    const res = validateStageTransition({
      currentStage: "TECHNICAL_INTERVIEW",
      toStage: "HIRED",
      userRole: "RECRUITER",
      job: baseJob,
    });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("RULE_VIOLATION");
    expect(res.errorMessage).toContain("Candidates must be in OFFER stage to be hired");
  });

  it("allows transition from OFFER to HIRED when headcount available", () => {
    const res = validateStageTransition({
      currentStage: "OFFER",
      toStage: "HIRED",
      userRole: "HIRING_MANAGER",
      job: baseJob,
    });
    expect(res.allowed).toBe(true);
    expect(res.headcountDelta).toBe(1);
  });

  it("blocks HIRED when job headcount is already full", () => {
    const fullJob = {
      headcountTotal: 2,
      headcountFilled: 2,
    };
    const res = validateStageTransition({
      currentStage: "OFFER",
      toStage: "HIRED",
      userRole: "ADMIN",
      job: fullJob,
    });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("RULE_VIOLATION");
    expect(res.errorMessage).toContain("HEADCOUNT_FULL");
  });

  it("requires rejectionReason when moving to REJECTED", () => {
    const res = validateStageTransition({
      currentStage: "SCREENING",
      toStage: "REJECTED",
      userRole: "RECRUITER",
      job: baseJob,
    });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("RULE_VIOLATION");
  });

  it("allows REJECTED with valid rejectionReason", () => {
    const res = validateStageTransition({
      currentStage: "SCREENING",
      toStage: "REJECTED",
      userRole: "RECRUITER",
      rejectionReason: "SKILLS_MISMATCH",
      job: baseJob,
    });
    expect(res.allowed).toBe(true);
  });

  it("forbids INTERVIEWER from approving OFFER or HIRED", () => {
    const res = validateStageTransition({
      currentStage: "SYSTEM_DESIGN",
      toStage: "OFFER",
      userRole: "INTERVIEWER",
      job: baseJob,
    });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("FORBIDDEN");
  });

  it("allows only ADMIN to move candidates out of HIRED", () => {
    const recruiterRes = validateStageTransition({
      currentStage: "HIRED",
      toStage: "APPLIED",
      userRole: "RECRUITER",
      job: baseJob,
    });
    expect(recruiterRes.allowed).toBe(false);
    expect(recruiterRes.errorCode).toBe("FORBIDDEN");

    const adminRes = validateStageTransition({
      currentStage: "HIRED",
      toStage: "OFFER",
      userRole: "ADMIN",
      job: baseJob,
    });
    expect(adminRes.allowed).toBe(true);
    expect(adminRes.headcountDelta).toBe(-1);
  });
});
