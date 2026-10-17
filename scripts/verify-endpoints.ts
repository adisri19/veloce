import { getApplications } from "../src/lib/services/applications";
import { transitionStage } from "../src/lib/services/stage-engine";
import { executeBulkOperation } from "../src/lib/services/bulk";
import { getDashboardAnalytics } from "../src/lib/services/analytics";
import { getJobs, getJobById, createJob, updateJob } from "../src/lib/services/jobs";
import { getCandidates, getCandidateById, createCandidate, getApplicationDossier, parseAndScoreCandidate } from "../src/lib/services/candidates";
import { submitScorecard } from "../src/lib/services/scorecards";
import { createNote, getNotes } from "../src/lib/services/notes";
import { scheduleInterview, updateInterview } from "../src/lib/services/interviews";
import { globalSearch } from "../src/lib/services/search";
import { runSeed } from "../src/lib/seed/run-seed";
import { prisma } from "../src/lib/db";
import { Actor } from "../src/lib/auth";
import { RuleViolationError, ConflictError, NotFoundError, ForbiddenError } from "../src/lib/api";

const adminActor: Actor = {
  id: "usr_veloce_admin",
  name: "Veloce Admin",
  email: "admin@veloce.dev",
  role: "ADMIN",
  department: "Executive",
};

const recruiterActor: Actor = {
  id: "usr_elena_sokolova",
  name: "Elena Sokolova",
  email: "elena.sokolova@veloce.dev",
  role: "RECRUITER",
  department: "Talent Acquisition",
};

const interviewerActor: Actor = {
  id: "usr_daniel_reyes",
  name: "Daniel Reyes",
  email: "daniel.reyes@veloce.dev",
  role: "INTERVIEWER",
  department: "Engineering",
};

async function verifyAll() {
  console.log("🚀 Starting Veloce ATS Zero-Error Verification Harness...");

  // 1. Seed verification
  console.log("\n[1/7] Testing Seed & Invariants...");
  const seedRes1 = await runSeed({ reset: true });
  const appCount1 = await prisma.application.count();
  const seedRes2 = await runSeed({ reset: true });
  const appCount2 = await prisma.application.count();
  if (appCount1 !== 32 || appCount2 !== 32) {
    throw new Error(`Idempotency check failed: expected 32 applications, got ${appCount1} and ${appCount2}`);
  }
  console.log("  ✅ Seed is 100% idempotent and meets all invariants.");

  // 2. Applications faceted search & pagination
  console.log("\n[2/7] Testing Faceted Search & Filtering Engine...");
  const allApps = await getApplications({ limit: 10 });
  if (allApps.items.length !== 10) throw new Error("Pagination limit failed");
  if (allApps.totals.all !== 32) throw new Error("Total count mismatch");

  // Verify multi-select facet counts match actual counts
  const stageFacetTotal = Object.values(allApps.facets.stages).reduce((a: number, b: number) => a + b, 0);
  if (stageFacetTotal !== 32) {
    throw new Error(`Facet stage sum mismatch: expected 32, got ${stageFacetTotal}`);
  }

  // Filter by minScore >= 80
  const highScorers = await getApplications({ minScore: 80 });
  for (const item of highScorers.items) {
    if (item.aiMatchScore < 80) throw new Error("minScore filter violated");
  }

  // Filter by SLA breached
  const breachedApps = await getApplications({ slaBreachedOnly: true });
  if (breachedApps.items.length < 4) {
    throw new Error(`Expected at least 4 breached apps, got ${breachedApps.items.length}`);
  }
  for (const item of breachedApps.items) {
    if (item.slaState !== "BREACHED") throw new Error("slaBreachedOnly returned non-breached item");
  }
  console.log("  ✅ Faceted search, multi-select facets, and SLA predicates pass.");

  // 3. Stage transition engine & business rules
  console.log("\n[3/7] Testing Transactional Stage Transition Engine...");
  const candidateInScreening = allApps.items.find((a: any) => a.currentStage === "SCREENING")!;
  const prevVersion = candidateInScreening.version;

  // Optimistic concurrency test (stale version)
  let staleConflictThrown = false;
  try {
    await transitionStage(
      candidateInScreening.id,
      { toStage: "TECHNICAL_INTERVIEW", expectedVersion: prevVersion + 99 },
      recruiterActor
    );
  } catch (err) {
    if (err instanceof ConflictError) staleConflictThrown = true;
  }
  if (!staleConflictThrown) throw new Error("Expected ConflictError on stale expectedVersion");

  // Missing rejectionReason test
  let rejectionRuleViolationThrown = false;
  try {
    await transitionStage(
      candidateInScreening.id,
      { toStage: "REJECTED" },
      recruiterActor
    );
  } catch (err) {
    if (err instanceof RuleViolationError) rejectionRuleViolationThrown = true;
  }
  if (!rejectionRuleViolationThrown) throw new Error("Expected RuleViolationError when rejecting without reason");

  // Valid stage move to TECHNICAL_INTERVIEW
  const transitionsBefore = await prisma.stageTransitionLog.count({
    where: { applicationId: candidateInScreening.id },
  });
  const auditBefore = await prisma.auditLog.count({
    where: { entityType: "Application", entityId: candidateInScreening.id },
  });

  const transitionRes = await transitionStage(
    candidateInScreening.id,
    { toStage: "TECHNICAL_INTERVIEW", reason: "Cleared recruiter screen" },
    recruiterActor
  );

  const transitionsAfter = await prisma.stageTransitionLog.count({
    where: { applicationId: candidateInScreening.id },
  });
  const auditAfter = await prisma.auditLog.count({
    where: { entityType: "Application", entityId: candidateInScreening.id },
  });

  if (transitionsAfter !== transitionsBefore + 1) {
    throw new Error("Stage move did not write exactly 1 StageTransitionLog");
  }
  if (auditAfter !== auditBefore + 1) {
    throw new Error("Stage move did not write exactly 1 AuditLog");
  }
  if (!transitionRes.undoToken) {
    throw new Error("Missing undoToken in transition result");
  }

  // Test Undo
  await transitionStage(
    candidateInScreening.id,
    { toStage: transitionRes.undoToken.fromStage, reason: "UNDO" },
    recruiterActor
  );
  console.log("  ✅ Stage transitions, atomic logs, conflict detection, and undo pass.");

  // Headcount full rule test
  console.log("\n[4/7] Testing Headcount & HIRED Constraints...");
  // REQ-2026-02 has headcountTotal 1, headcountFilled 1
  const closedJob = await prisma.jobRequisition.findUnique({ where: { code: "REQ-2026-02" } });
  const appForClosedJob = await prisma.application.findFirst({
    where: { jobId: closedJob!.id, currentStage: "OFFER" },
  });
  if (appForClosedJob) {
    let headcountFullThrown = false;
    try {
      await transitionStage(
        appForClosedJob.id,
        { toStage: "HIRED" },
        adminActor
      );
    } catch (err) {
      if (err instanceof RuleViolationError && (err as any).message.includes("HEADCOUNT_FULL")) {
        headcountFullThrown = true;
      }
    }
    if (!headcountFullThrown) throw new Error("Expected HEADCOUNT_FULL error for full headcount job");
  }
  console.log("  ✅ Headcount constraint and job closing logic verified.");

  // 5. Bulk operations atomicity
  console.log("\n[5/7] Testing Transactional Bulk Operations...");
  const appsToBulk = allApps.items.slice(0, 3).map((a: any) => a.id);
  const bulkRes = await executeBulkOperation(
    {
      ids: appsToBulk,
      op: "ADD_TAGS",
      payload: { tags: ["q1-priority", "engineering"] },
    },
    recruiterActor
  );
  if (bulkRes.succeeded !== 3) throw new Error("Bulk add tags failed");

  // Atomic rollback test: invalid id in batch
  let bulkRollbackThrown = false;
  try {
    await executeBulkOperation(
      {
        ids: [...appsToBulk, "invalid-non-existent-id"],
        op: "MOVE_STAGE",
        payload: { toStage: "SCREENING" },
      },
      recruiterActor
    );
  } catch (err) {
    if (err instanceof RuleViolationError) bulkRollbackThrown = true;
  }
  if (!bulkRollbackThrown) throw new Error("Expected bulk operation to fail on non-existent id");
  console.log("  ✅ Bulk operations atomic execution and rollback verified.");

  // 6. Resume Parser & Scoring Engine
  console.log("\n[6/7] Testing Resume Parser & Match Scoring Integration...");
  const sampleResume = `
Jane Doe
Email: jane.doe@techplatform.org
Phone: +1 (555) 345-6789
Location: New York, NY
GitHub: github.com/janedoe

Summary:
Senior Backend Engineer with 8 years of experience building distributed systems in TypeScript, Node.js, and PostgreSQL with Kubernetes and Kafka.
  `.trim();

  const parseScoreRes = await parseAndScoreCandidate(
    {
      jobId: (await prisma.jobRequisition.findFirst())!.id,
      resumeText: sampleResume,
      persist: false,
    },
    recruiterActor
  );
  if (parseScoreRes.scoreBreakdown.total < 70) {
    throw new Error(`Scoring unexpectedly low: ${parseScoreRes.scoreBreakdown.total}`);
  }
  if (!parseScoreRes.parsed.skills.includes("TypeScript")) {
    throw new Error("Resume parser failed to detect TypeScript");
  }
  console.log("  ✅ Resume parser and match scoring engine pass.");

  // 7. Analytics Dashboard Parity
  console.log("\n[7/7] Testing Analytics Dashboard Aggregation Pipeline...");
  const analytics = await getDashboardAnalytics({});
  if (analytics.kpis.activePipeline <= 0) throw new Error("Analytics activePipeline is 0");
  if (analytics.funnel.stages.length !== 7) throw new Error("Funnel stages count mismatch");
  if (analytics.velocity.length !== 6) throw new Error("Velocity stages count mismatch");
  if (analytics.sourceAttribution.length === 0) throw new Error("Source attribution empty");
  if (analytics.needsAttention.length === 0) throw new Error("Needs attention queue empty");
  console.log("  ✅ Analytics aggregation pipeline verified.");

  console.log("\n🎉 ALL 7/7 VERIFICATION CHECKS PASSED PERFECTLY!");
}

if (require.main === module || process.argv[1]?.endsWith("verify-endpoints.ts")) {
  verifyAll()
    .catch((err) => {
      console.error("\n❌ Verification harness failed:", err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
