import { prisma } from "../db";
import { fromList, toList, jsonIn, jsonOut } from "../db-compat";
import { JobCreateInput, JobUpdateInput } from "../validations/job";
import { Actor } from "../auth";
import { logAudit } from "./audit";
import { NotFoundError, RuleViolationError, ForbiddenError } from "../api";
import { computeAiMatchScore } from "../scoring-engine";
import { Stage, TERMINAL_STAGES } from "../validations/common";

export async function getJobs(params?: { department?: string; status?: string }) {
  const where: any = {};
  if (params?.department) where.department = params.department;
  if (params?.status) where.status = params.status;

  const jobs = await prisma.jobRequisition.findMany({
    where,
    include: {
      hiringManager: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      applications: {
        select: {
          id: true,
          currentStage: true,
          aiMatchScore: true,
          isArchived: true,
        },
      },
    },
    orderBy: { openedAt: "desc" },
  });

  const now = new Date();

  return jobs.map((job) => {
    const stageCounts: Record<string, number> = {};
    let totalScore = 0;
    const activeApps = job.applications.filter((a) => !a.isArchived);

    for (const app of activeApps) {
      stageCounts[app.currentStage] = (stageCounts[app.currentStage] || 0) + 1;
      totalScore += app.aiMatchScore;
    }

    const avgScore = activeApps.length > 0 ? Math.round(totalScore / activeApps.length) : 0;
    const daysOpen = Math.max(1, Math.floor((now.getTime() - job.openedAt.getTime()) / (24 * 3600 * 1000)));

    return {
      id: job.id,
      code: job.code,
      title: job.title,
      department: job.department,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      description: job.description,
      requiredSkills: toList(job.requiredSkills),
      niceToHaveSkills: toList(job.niceToHaveSkills),
      domainKeywords: toList(job.domainKeywords),
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      headcountTotal: job.headcountTotal,
      headcountFilled: job.headcountFilled,
      status: job.status,
      priority: job.priority,
      slaDaysPerStage: jsonOut(job.slaDaysPerStage),
      hiringManager: job.hiringManager,
      openedAt: job.openedAt.toISOString(),
      closedAt: job.closedAt ? job.closedAt.toISOString() : null,
      activeApplicationsCount: activeApps.length,
      stageCounts,
      avgMatchScore: avgScore,
      daysOpen,
    };
  });
}

export async function getJobById(id: string) {
  const job = await prisma.jobRequisition.findUnique({
    where: { id },
    include: {
      hiringManager: true,
      applications: {
        include: {
          candidate: true,
          scorecards: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError(`Job requisition ${id} not found`);
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "JobRequisition", entityId: id },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    ...job,
    requiredSkills: toList(job.requiredSkills),
    niceToHaveSkills: toList(job.niceToHaveSkills),
    domainKeywords: toList(job.domainKeywords),
    slaDaysPerStage: jsonOut(job.slaDaysPerStage),
    auditLogs,
  };
}

export async function createJob(input: JobCreateInput, actor: Actor) {
  if (actor.role === "INTERVIEWER") {
    throw new ForbiddenError("Interviewers cannot create job requisitions");
  }

  // Generate code if not provided
  let code = input.code;
  if (!code) {
    const count = await prisma.jobRequisition.count();
    code = `REQ-2026-${String(count + 1).padStart(2, "0")}`;
  }

  const job = await prisma.jobRequisition.create({
    data: {
      code,
      title: input.title,
      department: input.department,
      location: input.location,
      workMode: input.workMode,
      employmentType: input.employmentType,
      description: input.description,
      requiredSkills: fromList(input.requiredSkills),
      niceToHaveSkills: fromList(input.niceToHaveSkills),
      domainKeywords: fromList(input.domainKeywords),
      minExperienceYears: input.minExperienceYears,
      maxExperienceYears: input.maxExperienceYears,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      currency: input.currency,
      headcountTotal: input.headcountTotal,
      status: input.status,
      priority: input.priority,
      slaDaysPerStage: jsonIn(input.slaDaysPerStage),
      hiringManagerId: input.hiringManagerId,
    },
  });

  await logAudit({
    entityType: "JobRequisition",
    entityId: job.id,
    action: "CREATED",
    actorId: actor.id,
    metadata: { code: job.code, title: job.title },
  });

  return job;
}

export async function updateJob(id: string, input: JobUpdateInput, actor: Actor) {
  const existing = await prisma.jobRequisition.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError(`Job requisition ${id} not found`);
  }

  if (actor.role === "HIRING_MANAGER" && existing.hiringManagerId !== actor.id) {
    throw new ForbiddenError("Hiring managers can only edit their own jobs");
  }
  if (actor.role === "INTERVIEWER") {
    throw new ForbiddenError("Interviewers cannot edit job requisitions");
  }

  const checkRescoreCriteria =
    input.requiredSkills !== undefined ||
    input.niceToHaveSkills !== undefined ||
    input.domainKeywords !== undefined ||
    input.minExperienceYears !== undefined ||
    input.maxExperienceYears !== undefined ||
    input.salaryMin !== undefined ||
    input.salaryMax !== undefined;

  const updatedJob = await prisma.jobRequisition.update({
    where: { id },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.department ? { department: input.department } : {}),
      ...(input.location ? { location: input.location } : {}),
      ...(input.workMode ? { workMode: input.workMode } : {}),
      ...(input.employmentType ? { employmentType: input.employmentType } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.requiredSkills ? { requiredSkills: fromList(input.requiredSkills) } : {}),
      ...(input.niceToHaveSkills ? { niceToHaveSkills: fromList(input.niceToHaveSkills) } : {}),
      ...(input.domainKeywords ? { domainKeywords: fromList(input.domainKeywords) } : {}),
      ...(input.minExperienceYears !== undefined ? { minExperienceYears: input.minExperienceYears } : {}),
      ...(input.maxExperienceYears !== undefined ? { maxExperienceYears: input.maxExperienceYears } : {}),
      ...(input.salaryMin !== undefined ? { salaryMin: input.salaryMin } : {}),
      ...(input.salaryMax !== undefined ? { salaryMax: input.salaryMax } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.headcountTotal !== undefined ? { headcountTotal: input.headcountTotal } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.slaDaysPerStage ? { slaDaysPerStage: jsonIn(input.slaDaysPerStage) } : {}),
      ...(input.hiringManagerId ? { hiringManagerId: input.hiringManagerId } : {}),
    },
  });

  let rescoreSummary: { rescoreCount: number; movedTenPointsCount: number } | null = null;

  // Re-scoring trigger: rescores every non-terminal application for this job
  if (checkRescoreCriteria) {
    const nonTerminalApps = await prisma.application.findMany({
      where: {
        jobId: id,
        currentStage: { notIn: TERMINAL_STAGES },
      },
      include: { candidate: true },
    });

    const jobRequirements = {
      title: updatedJob.title,
      requiredSkills: toList(updatedJob.requiredSkills),
      niceToHaveSkills: toList(updatedJob.niceToHaveSkills),
      domainKeywords: toList(updatedJob.domainKeywords),
      minExperienceYears: updatedJob.minExperienceYears,
      maxExperienceYears: updatedJob.maxExperienceYears,
      salaryMin: updatedJob.salaryMin,
      salaryMax: updatedJob.salaryMax,
    };

    let movedCount = 0;
    for (const app of nonTerminalApps) {
      const breakdown = computeAiMatchScore(
        {
          skills: toList(app.candidate.skills),
          experienceYears: app.candidate.experienceYears,
          expectedSalary: app.candidate.expectedSalary,
          noticePeriodDays: app.candidate.noticePeriodDays,
          currentTitle: app.candidate.currentTitle,
          currentCompany: app.candidate.currentCompany,
          parsedResumeText: app.candidate.parsedResumeText,
        },
        jobRequirements
      );

      if (Math.abs(breakdown.total - app.aiMatchScore) >= 10) {
        movedCount++;
      }

      await prisma.application.update({
        where: { id: app.id },
        data: {
          aiMatchScore: breakdown.total,
          aiScoreBreakdown: jsonIn(breakdown),
        },
      });
    }

    rescoreSummary = {
      rescoreCount: nonTerminalApps.length,
      movedTenPointsCount: movedCount,
    };

    await logAudit({
      entityType: "JobRequisition",
      entityId: id,
      action: "JOB_RESCORED",
      actorId: actor.id,
      metadata: rescoreSummary,
    });
  }

  await logAudit({
    entityType: "JobRequisition",
    entityId: id,
    action: "UPDATED",
    actorId: actor.id,
    metadata: { changes: Object.keys(input) },
  });

  return {
    job: updatedJob,
    rescoreSummary,
  };
}

export async function deleteJob(id: string, actor: Actor) {
  if (actor.role !== "ADMIN") {
    throw new ForbiddenError("Only ADMIN can delete job requisitions");
  }

  const appCount = await prisma.application.count({ where: { jobId: id } });
  if (appCount > 0) {
    throw new RuleViolationError(
      `Cannot delete job with ${appCount} existing applications. Please close or archive the requisition instead.`
    );
  }

  await prisma.jobRequisition.delete({ where: { id } });

  await logAudit({
    entityType: "JobRequisition",
    entityId: id,
    action: "DELETED",
    actorId: actor.id,
    metadata: { id },
  });
}
