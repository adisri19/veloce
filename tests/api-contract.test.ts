import { describe, it, expect } from "vitest";
import { apiSuccess, apiError } from "../src/lib/api";
import { StageTransitionSchema } from "../src/lib/validations/stage";
import { BulkOperationSchema } from "../src/lib/validations/bulk";
import { JobCreateSchema } from "../src/lib/validations/job";

describe("API Envelope and Schema Contract Tests", () => {
  it("formats success envelope according to specification §3.0", async () => {
    const data = { id: "test-123", name: "Candidate" };
    const meta = { warnings: ["NO_SCREENING_SCORECARD"] };
    const res = apiSuccess(data, meta);
    const json = await res.json();

    expect(json).toEqual({
      ok: true,
      data: { id: "test-123", name: "Candidate" },
      meta: { warnings: ["NO_SCREENING_SCORECARD"] },
    });
  });

  it("formats error envelope according to specification §3.0", async () => {
    const res = apiError(
      "VALIDATION_ERROR",
      "Stage move requires rejection reason",
      422,
      [{ path: ["rejectionReason"], message: "Required" }]
    );
    const json = await res.json();

    expect(json).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Stage move requires rejection reason",
        details: [{ path: ["rejectionReason"], message: "Required" }],
      },
    });
  });

  it("enforces stage transition validation rules on REJECTED", () => {
    const invalidWithoutReason = StageTransitionSchema.safeParse({
      toStage: "REJECTED",
    });
    expect(invalidWithoutReason.success).toBe(false);

    const validWithReason = StageTransitionSchema.safeParse({
      toStage: "REJECTED",
      rejectionReason: "SKILLS_MISMATCH",
      rejectionNotes: "Lacks required Kubernetes production experience",
    });
    expect(validWithReason.success).toBe(true);
  });

  it("enforces bulk operations schema validations", () => {
    const emptyIds = BulkOperationSchema.safeParse({
      ids: [],
      op: "MOVE_STAGE",
      payload: { toStage: "SCREENING" },
    });
    expect(emptyIds.success).toBe(false);

    const validBulk = BulkOperationSchema.safeParse({
      ids: ["app-1", "app-2"],
      op: "MOVE_STAGE",
      payload: { toStage: "SCREENING" },
    });
    expect(validBulk.success).toBe(true);
  });

  it("enforces job requisition salary and experience constraints", () => {
    const invalidSalary = JobCreateSchema.safeParse({
      title: "Backend Engineer",
      department: "Engineering",
      location: "San Francisco",
      description: "A complete description of this role...",
      requiredSkills: ["TypeScript"],
      salaryMin: 200000,
      salaryMax: 150000, // Invalid: max < min
      hiringManagerId: "hm-1",
    });
    expect(invalidSalary.success).toBe(false);

    const validJob = JobCreateSchema.safeParse({
      title: "Backend Engineer",
      department: "Engineering",
      location: "San Francisco",
      description: "A complete description of this role...",
      requiredSkills: ["TypeScript"],
      salaryMin: 150000,
      salaryMax: 200000,
      minExperienceYears: 3,
      maxExperienceYears: 7,
      hiringManagerId: "hm-1",
    });
    expect(validJob.success).toBe(true);
  });
});
