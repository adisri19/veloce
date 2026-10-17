import { prisma } from "../db";
import { fromList, toList, jsonIn, jsonOut } from "../db-compat";
import { CandidateCreateInput, CandidateUpdateInput, ParseAndScoreInput } from "../validations/candidate";
import { Actor } from "../auth";
import { logAudit } from "./audit";
import { NotFoundError, ForbiddenError } from "../api";
import { parseResume } from "../resume-parser";
import { computeAiMatchScore } from "../scoring-engine";
import { computeSlaStatus } from "../sla";
import { Stage } from "../validations/common";

export async function getCandidates(params?: { source?: string; tag?: string }) {
  const where: any = {};
  if (params?.source) where.source = params.source;
  if (params?.tag) where.tags = { contains: params.tag };

  const candidates = await prisma.candidate.findMany({
    where,
    include: {
      applications: {
        include: {
          job: { select: { id: true, code: true, title: true, department: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return candidates.map((c) => ({
    ...c,
    skills: toList(c.skills),
    tags: toList(c.tags),
  }));
}

export async function getCandidateById(id: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          job: true,
          scorecards: true,
        },
      },
    },
  });

  if (!candidate) {
    throw new NotFoundError(`Candidate ${id} not found`);
  }

  return {
    ...candidate,
    skills: toList(candidate.skills),
    tags: toList(candidate.tags),
  };
}

export async function createCandidate(input: CandidateCreateInput, actor: Actor) {
  if (actor.role === "INTERVIEWER") {
    throw new ForbiddenError("Interviewers cannot create candidate records");
  }

  const count = await prisma.candidate.count();
  const publicCode = `CAND-${1000 + count + 1}`;

  const candidate = await prisma.candidate.create({
    data: {
      publicCode,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      avatarUrl: input.avatarUrl || null,
      location: input.location,
      timezone: input.timezone,
      currentCompany: input.currentCompany,
      currentTitle: input.currentTitle,
      experienceYears: input.experienceYears || 0,
      expectedSalary: input.expectedSalary,
      noticePeriodDays: input.noticePeriodDays,
      linkedinUrl: input.linkedinUrl || null,
      githubUrl: input.githubUrl || null,
      portfolioUrl: input.portfolioUrl || null,
      resumeUrl: input.resumeUrl || null,
      parsedResumeText: input.parsedResumeText || "",
      skills: fromList(input.skills || []),
      tags: fromList(input.tags || []),
      source: input.source || "Inbound",
    },
  });

  await logAudit({
    entityType: "Candidate",
    entityId: candidate.id,
    action: "CREATED",
    actorId: actor.id,
    metadata: { publicCode: candidate.publicCode, fullName: candidate.fullName },
  });

  // If jobId is provided, create Application immediately
  let application = null;
  if (input.jobId) {
    const job = await prisma.jobRequisition.findUnique({ where: { id: input.jobId } });
    if (job) {
      const breakdown = computeAiMatchScore(
        {
          skills: input.skills || [],
          experienceYears: input.experienceYears || 0,
          expectedSalary: input.expectedSalary,
          noticePeriodDays: input.noticePeriodDays,
          currentTitle: input.currentTitle,
          currentCompany: input.currentCompany,
          parsedResumeText: input.parsedResumeText,
        },
        {
          title: job.title,
          requiredSkills: toList(job.requiredSkills),
          niceToHaveSkills: toList(job.niceToHaveSkills),
          domainKeywords: toList(job.domainKeywords),
          minExperienceYears: job.minExperienceYears,
          maxExperienceYears: job.maxExperienceYears,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        }
      );

      const lastCard = await prisma.application.findFirst({
        where: { currentStage: "APPLIED" },
        orderBy: { kanbanOrder: "desc" },
        select: { kanbanOrder: true },
      });

      application = await prisma.application.create({
        data: {
          candidateId: candidate.id,
          jobId: job.id,
          currentStage: "APPLIED",
          kanbanOrder: (lastCard?.kanbanOrder ?? 0) + 1000,
          aiMatchScore: breakdown.total,
          aiScoreBreakdown: jsonIn(breakdown),
          stageEnteredAt: new Date(),
        },
        include: { job: true },
      });

      await logAudit({
        entityType: "Application",
        entityId: application.id,
        action: "CREATED",
        actorId: actor.id,
        metadata: { candidateId: candidate.id, jobId: job.id },
      });
    }
  }

  return {
    candidate: {
      ...candidate,
      skills: toList(candidate.skills),
      tags: toList(candidate.tags),
    },
    application,
  };
}

export async function parseAndScoreCandidate(input: ParseAndScoreInput, actor: Actor) {
  const job = await prisma.jobRequisition.findUnique({
    where: { id: input.jobId },
  });

  if (!job) {
    throw new NotFoundError(`Job requisition ${input.jobId} not found`);
  }

  // 1. Parse text if provided
  let parsedFromText = input.resumeText ? parseResume(input.resumeText) : null;

  // 2. Merge with structured input (structured overrides parsed text)
  const mergedCandidate = {
    fullName: input.structured?.fullName || parsedFromText?.fullName || "New Candidate",
    email: input.structured?.email || parsedFromText?.email || `candidate-${Date.now()}@veloce.dev`,
    phone: input.structured?.phone || parsedFromText?.phone,
    currentTitle: input.structured?.currentTitle || parsedFromText?.currentTitle || "Software Engineer",
    currentCompany: input.structured?.currentCompany || parsedFromText?.currentCompany,
    skills: input.structured?.skills || parsedFromText?.skills || [],
    experienceYears: input.structured?.experienceYears ?? parsedFromText?.experienceYears ?? 3,
    expectedSalary: input.structured?.expectedSalary ?? null,
    noticePeriodDays: input.structured?.noticePeriodDays ?? 30,
    source: input.structured?.source || "Inbound",
    location: input.structured?.location || "Remote",
    linkedinUrl: input.structured?.linkedinUrl || parsedFromText?.linkedinUrl,
    githubUrl: input.structured?.githubUrl || parsedFromText?.githubUrl,
    parsedResumeText: input.resumeText || "",
  };

  // 3. Run scoring engine
  const breakdown = computeAiMatchScore(
    {
      skills: mergedCandidate.skills,
      experienceYears: mergedCandidate.experienceYears,
      expectedSalary: mergedCandidate.expectedSalary,
      noticePeriodDays: mergedCandidate.noticePeriodDays,
      currentTitle: mergedCandidate.currentTitle,
      currentCompany: mergedCandidate.currentCompany,
      parsedResumeText: mergedCandidate.parsedResumeText,
    },
    {
      title: job.title,
      requiredSkills: toList(job.requiredSkills),
      niceToHaveSkills: toList(job.niceToHaveSkills),
      domainKeywords: toList(job.domainKeywords),
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    }
  );

  let persisted = null;

  // 4. Persist if requested
  if (input.persist) {
    if (input.applicationId) {
      // Update existing application
      const app = await prisma.application.update({
        where: { id: input.applicationId },
        data: {
          aiMatchScore: breakdown.total,
          aiScoreBreakdown: jsonIn(breakdown),
        },
      });

      await logAudit({
        entityType: "Application",
        entityId: app.id,
        action: "RE_SCORED",
        actorId: actor.id,
        metadata: { score: breakdown.total },
      });
      persisted = { applicationId: app.id };
    } else {
      // Create new candidate & application
      const createRes = await createCandidate(
        {
          fullName: mergedCandidate.fullName,
          email: mergedCandidate.email,
          phone: mergedCandidate.phone,
          currentTitle: mergedCandidate.currentTitle,
          currentCompany: mergedCandidate.currentCompany,
          skills: mergedCandidate.skills,
          tags: [],
          experienceYears: mergedCandidate.experienceYears,
          expectedSalary: mergedCandidate.expectedSalary || undefined,
          noticePeriodDays: mergedCandidate.noticePeriodDays || undefined,
          source: mergedCandidate.source,
          location: mergedCandidate.location,
          linkedinUrl: mergedCandidate.linkedinUrl,
          githubUrl: mergedCandidate.githubUrl,
          parsedResumeText: mergedCandidate.parsedResumeText,
          jobId: job.id,
        },
        actor
      );
      persisted = createRes;
    }
  }

  return {
    parsed: mergedCandidate,
    scoreBreakdown: breakdown,
    persisted,
  };
}

export async function getApplicationDossier(applicationId: string, actor: Actor) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: true,
      job: {
        include: {
          hiringManager: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      },
      scorecards: {
        include: {
          interviewer: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
        orderBy: { submittedAt: "asc" },
      },
      interviews: {
        orderBy: { startTime: "asc" },
      },
      transitions: {
        include: {
          movedBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!application) {
    throw new NotFoundError(`Application ${applicationId} not found`);
  }

  // Fetch candidate notes respecting privacy rules
  // Private notes only visible to author, ADMIN, or RECRUITER
  const canSeeAllPrivate = actor.role === "ADMIN" || actor.role === "RECRUITER";
  const notes = await prisma.candidateNote.findMany({
    where: {
      applicationId,
      ...(canSeeAllPrivate ? {} : { OR: [{ isPrivate: false }, { authorId: actor.id }] }),
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Top level notes (where parentId is null)
  const rootNotes = notes.filter((n) => !n.parentId);

  // Fetch relevant audit logs for the dossier timeline
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Application",
      entityId: applicationId,
    },
    include: {
      actor: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const now = new Date();
  const slaDaysPerStage = jsonOut<Record<string, number>>(application.job.slaDaysPerStage);
  const slaStatus = computeSlaStatus(
    application.currentStage as Stage,
    application.stageEnteredAt,
    slaDaysPerStage,
    now
  );

  return {
    ...application,
    candidate: {
      ...application.candidate,
      skills: toList(application.candidate.skills),
      tags: toList(application.candidate.tags),
    },
    job: {
      ...application.job,
      requiredSkills: toList(application.job.requiredSkills),
      niceToHaveSkills: toList(application.job.niceToHaveSkills),
      domainKeywords: toList(application.job.domainKeywords),
      slaDaysPerStage,
    },
    interviews: application.interviews.map((iv) => ({
      ...iv,
      interviewerIds: toList(iv.interviewerIds),
    })),
    notes: rootNotes.map((n) => ({
      ...n,
      mentions: toList(n.mentions),
      replies: n.replies.map((r) => ({
        ...r,
        mentions: toList(r.mentions),
      })),
    })),
    auditLogs: auditLogs.map((a) => ({
      ...a,
      metadata: jsonOut(a.metadata),
    })),
    slaStatus,
    aiScoreBreakdown: jsonOut(application.aiScoreBreakdown),
  };
}
