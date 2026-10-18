import { prisma } from "../db";
import { Stage } from "../validations/common";
import { jsonOut } from "../db-compat";
import { computeSlaStatus } from "../sla";

export async function assertSeedInvariants(): Promise<void> {
  const [
    userCount,
    jobCount,
    candidateCount,
    applicationCount,
    transitionCount,
    scorecardCount,
    noteCount,
    interviewCount,
    ruleCount,
    auditCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.jobRequisition.count(),
    prisma.candidate.count(),
    prisma.application.count(),
    prisma.stageTransitionLog.count(),
    prisma.scorecard.count(),
    prisma.candidateNote.count(),
    prisma.interviewEvent.count(),
    prisma.automationRule.count(),
    prisma.auditLog.count(),
  ]);

  console.log("📊 Verifying Seed Counts:");
  console.log(`  Users: ${userCount} (required >= 7)`);
  console.log(`  Jobs: ${jobCount} (required 6)`);
  console.log(`  Candidates: ${candidateCount} (required 32)`);
  console.log(`  Applications: ${applicationCount} (required 32)`);
  console.log(`  Transitions: ${transitionCount} (required >= 60)`);
  console.log(`  Scorecards: ${scorecardCount} (required >= 45)`);
  console.log(`  Notes: ${noteCount} (required >= 50)`);
  console.log(`  Interviews: ${interviewCount} (required >= 12)`);
  console.log(`  Automation Rules: ${ruleCount} (required >= 2)`);
  console.log(`  Audit Logs: ${auditCount} (required >= 50)`);

  if (userCount < 7) throw new Error(`Invariant failed: expected >= 7 users, got ${userCount}`);
  if (jobCount !== 6) throw new Error(`Invariant failed: expected 6 jobs, got ${jobCount}`);
  if (candidateCount !== 32) throw new Error(`Invariant failed: expected 32 candidates, got ${candidateCount}`);
  if (applicationCount !== 32) throw new Error(`Invariant failed: expected 32 applications, got ${applicationCount}`);
  if (transitionCount < 60) throw new Error(`Invariant failed: expected >= 60 transitions, got ${transitionCount}`);
  if (scorecardCount < 45) throw new Error(`Invariant failed: expected >= 45 scorecards, got ${scorecardCount}`);
  if (noteCount < 50) throw new Error(`Invariant failed: expected >= 50 notes, got ${noteCount}`);
  if (interviewCount < 12) throw new Error(`Invariant failed: expected >= 12 interviews, got ${interviewCount}`);
  if (ruleCount < 2) throw new Error(`Invariant failed: expected >= 2 automation rules, got ${ruleCount}`);

  // Check exact stage distribution
  const expectedDistribution: Record<Stage, number> = {
    SOURCED: 3,
    APPLIED: 5,
    SCREENING: 5,
    TECHNICAL_INTERVIEW: 5,
    SYSTEM_DESIGN: 4,
    OFFER: 3,
    HIRED: 3,
    REJECTED: 3,
    WITHDRAWN: 1,
  };

  const applications = await prisma.application.findMany({
    include: { job: true },
  });

  const actualDistribution: Record<string, number> = {};
  for (const app of applications) {
    actualDistribution[app.currentStage] = (actualDistribution[app.currentStage] || 0) + 1;
  }

  console.log("🎯 Verifying Stage Distribution:");
  for (const [stage, expected] of Object.entries(expectedDistribution)) {
    const actual = actualDistribution[stage] || 0;
    console.log(`  ${stage}: ${actual} (expected ${expected})`);
    if (actual !== expected) {
      throw new Error(`Stage distribution mismatch for ${stage}: expected ${expected}, got ${actual}`);
    }
  }

  // Check SLA breached count
  let slaBreachedCount = 0;
  let slaWarningCount = 0;
  const now = new Date();

  for (const app of applications) {
    const slaDays = jsonOut<Record<string, number>>(app.job.slaDaysPerStage);
    const sla = computeSlaStatus(app.currentStage as Stage, app.stageEnteredAt, slaDays, now);
    if (sla.slaState === "BREACHED") slaBreachedCount++;
    if (sla.slaState === "WARNING") slaWarningCount++;
  }

  console.log(`⏰ SLA States: ${slaBreachedCount} breached, ${slaWarningCount} warning`);
  if (slaBreachedCount < 4) {
    throw new Error(`Invariant failed: expected at least 4 SLA breached apps, got ${slaBreachedCount}`);
  }
  if (slaWarningCount < 4) {
    throw new Error(`Invariant failed: expected at least 4 SLA warning apps, got ${slaWarningCount}`);
  }

  // Check Headcount consistency
  const jobs = await prisma.jobRequisition.findMany();
  for (const j of jobs) {
    const hiredApps = applications.filter((a) => a.jobId === j.id && a.currentStage === "HIRED");
    if (j.headcountFilled !== hiredApps.length) {
      throw new Error(
        `Headcount mismatch for job ${j.code}: headcountFilled is ${j.headcountFilled}, but ${hiredApps.length} applications are in HIRED stage.`
      );
    }
  }

  console.log("✅ All seed invariants verified successfully!");
}
