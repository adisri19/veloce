import { prisma, isSqlite } from "../db";
import { toList, jsonOut } from "../db-compat";
import { ApplicationQuery, parseSortParam, SortField } from "../validations/application-query";
import { Stage, ALL_STAGES, ACTIVE_STAGES, TERMINAL_STAGES } from "../validations/common";
import { computeSlaStatus, SlaState } from "../sla";

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

/**
 * Builds Prisma where clause excluding one facet field (for multi-select faceted counting)
 */
function buildWhereClause(
  query: Partial<ApplicationQuery>,
  excludeField?: "stages" | "departments" | "sources" | "jobs" | "slaBreached"
): any {
  const andClauses: any[] = [];

  // Archived filter
  if (!query.includeArchived) {
    andClauses.push({ isArchived: false });
  }

  // Stages
  if (excludeField !== "stages" && query.stages && query.stages.length > 0) {
    andClauses.push({ currentStage: { in: query.stages } });
  }

  // Jobs
  if (excludeField !== "jobs" && query.jobIds && query.jobIds.length > 0) {
    andClauses.push({ jobId: { in: query.jobIds } });
  }

  // Departments
  if (excludeField !== "departments" && query.departments && query.departments.length > 0) {
    andClauses.push({ job: { department: { in: query.departments } } });
  }

  // Min Score
  if (query.minScore !== undefined) {
    andClauses.push({ aiMatchScore: { gte: query.minScore } });
  }

  // Max Experience
  if (query.maxExperience !== undefined) {
    andClauses.push({ candidate: { experienceYears: { lte: query.maxExperience } } });
  }

  // Sources
  if (excludeField !== "sources" && query.sources && query.sources.length > 0) {
    andClauses.push({ candidate: { source: { in: query.sources } } });
  }

  // Tags
  if (query.tags && query.tags.length > 0) {
    if (isSqlite) {
      // In SQLite tags is JSON string array
      const tagConditions = query.tags.map((t) => ({
        candidate: { tags: { contains: t } },
      }));
      andClauses.push({ OR: tagConditions });
    } else {
      andClauses.push({ candidate: { tags: { hasSome: query.tags } } });
    }
  }

  // Text search (q)
  if (query.q && query.q.trim()) {
    const tokens = query.q
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    for (const token of tokens) {
      andClauses.push({
        OR: [
          { candidate: { fullName: { contains: token } } },
          { candidate: { email: { contains: token } } },
          { candidate: { currentTitle: { contains: token } } },
          { candidate: { currentCompany: { contains: token } } },
          { candidate: { parsedResumeText: { contains: token } } },
          isSqlite
            ? { candidate: { skills: { contains: token } } }
            : { candidate: { skills: { has: token } } },
          { notes: { some: { content: { contains: token } } } },
        ],
      });
    }
  }

  return andClauses.length > 0 ? { AND: andClauses } : {};
}

export async function getApplications(query: Partial<ApplicationQuery> = {}): Promise<ApplicationListResult> {
  const now = new Date();
  const where = buildWhereClause(query);

  // Total in system
  const totalAllPromise = prisma.application.count();

  // Load all candidates matching base filters to do SLA evaluation & faceting
  // Notice: For production with millions, SQL window queries are used. For ATS pipeline sizes (< 5,000 apps),
  // fetching matching application summaries for faceting guarantees 100% exact Parity between Postgres and SQLite.
  const matchingApps = await prisma.application.findMany({
    where,
    include: {
      candidate: {
        select: {
          id: true,
          publicCode: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          currentTitle: true,
          currentCompany: true,
          experienceYears: true,
          expectedSalary: true,
          skills: true,
          tags: true,
          source: true,
          location: true,
        },
      },
      job: {
        select: {
          id: true,
          code: true,
          title: true,
          department: true,
          slaDaysPerStage: true,
        },
      },
      scorecards: {
        select: {
          technicalScore: true,
          architectureScore: true,
          problemSolvingScore: true,
          communicationScore: true,
          cultureScore: true,
        },
      },
      notes: {
        select: {
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Calculate SLA and annotate
  let annotated = matchingApps.map((app) => {
    const slaDaysPerStage = jsonOut<Record<string, number>>(app.job.slaDaysPerStage);
    const slaStatus = computeSlaStatus(
      app.currentStage as Stage,
      app.stageEnteredAt,
      slaDaysPerStage,
      now
    );

    // Compute average scorecard
    let avgScorecard: number | null = null;
    if (app.scorecards.length > 0) {
      let sum = 0;
      let count = 0;
      for (const sc of app.scorecards) {
        sum +=
          sc.technicalScore +
          sc.architectureScore +
          sc.problemSolvingScore +
          sc.communicationScore +
          sc.cultureScore;
        count += 5;
      }
      avgScorecard = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
    }

    const item: ApplicationListItem = {
      id: app.id,
      currentStage: app.currentStage as Stage,
      kanbanOrder: app.kanbanOrder,
      aiMatchScore: app.aiMatchScore,
      stageEnteredAt: app.stageEnteredAt.toISOString(),
      daysInStage: slaStatus.daysInStage,
      slaDays: slaStatus.slaDays,
      slaState: slaStatus.slaState,
      candidate: {
        id: app.candidate.id,
        publicCode: app.candidate.publicCode,
        fullName: app.candidate.fullName,
        email: app.candidate.email,
        avatarUrl: app.candidate.avatarUrl,
        currentTitle: app.candidate.currentTitle,
        currentCompany: app.candidate.currentCompany,
        experienceYears: app.candidate.experienceYears,
        expectedSalary: app.candidate.expectedSalary,
        skills: toList(app.candidate.skills),
        tags: toList(app.candidate.tags),
        source: app.candidate.source,
        location: app.candidate.location,
      },
      job: {
        id: app.job.id,
        code: app.job.code,
        title: app.job.title,
        department: app.job.department,
      },
      scorecardCount: app.scorecards.length,
      avgScorecard,
      lastNoteAt: app.notes[0]?.createdAt ? app.notes[0].createdAt.toISOString() : null,
      appliedAt: app.appliedAt.toISOString(),
      version: app.version,
    };

    return item;
  });

  // If slaBreachedOnly is active, filter
  if (query.slaBreachedOnly) {
    annotated = annotated.filter((a) => a.slaState === "BREACHED");
  }

  const filteredTotal = annotated.length;

  // Sorting
  const sortClauses = parseSortParam(query.sort);
  if (sortClauses.length > 0) {
    annotated.sort((a, b) => {
      for (const { field, direction } of sortClauses) {
        let valA: any;
        let valB: any;

        switch (field) {
          case "aiMatchScore":
            valA = a.aiMatchScore;
            valB = b.aiMatchScore;
            break;
          case "stageEnteredAt":
            valA = new Date(a.stageEnteredAt).getTime();
            valB = new Date(b.stageEnteredAt).getTime();
            break;
          case "kanbanOrder":
            valA = a.kanbanOrder;
            valB = b.kanbanOrder;
            break;
          case "candidate.fullName":
            valA = a.candidate.fullName.toLowerCase();
            valB = b.candidate.fullName.toLowerCase();
            break;
          case "candidate.experienceYears":
            valA = a.candidate.experienceYears;
            valB = b.candidate.experienceYears;
            break;
          case "candidate.expectedSalary":
            valA = a.candidate.expectedSalary ?? 0;
            valB = b.candidate.expectedSalary ?? 0;
            break;
          default:
            valA = a.kanbanOrder;
            valB = b.kanbanOrder;
        }

        if (valA !== valB) {
          const comp = valA > valB ? 1 : -1;
          return direction === "asc" ? comp : -comp;
        }
      }
      return 0;
    });
  } else {
    // Default sort by kanbanOrder ASC
    annotated.sort((a, b) => a.kanbanOrder - b.kanbanOrder);
  }

  // Pagination (Cursor or Offset)
  const limit = query.limit || 50;
  let startIndex = 0;

  if (query.offset !== undefined) {
    startIndex = query.offset;
  } else if (query.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(query.cursor, "base64").toString("utf-8"));
      const foundIdx = annotated.findIndex((item) => item.id === decoded.id);
      if (foundIdx !== -1) {
        startIndex = foundIdx + 1;
      }
    } catch {
      // Fallback
    }
  }

  const pagedItems = annotated.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < annotated.length;
  const nextItem = pagedItems[pagedItems.length - 1];
  const nextCursor =
    hasMore && nextItem
      ? Buffer.from(JSON.stringify({ id: nextItem.id })).toString("base64")
      : null;

  // Multi-select Facet calculations
  // Compute stages facet (with all filters except stages)
  const stageFacetWhere = buildWhereClause(query, "stages");
  const stageFacetApps = await prisma.application.findMany({
    where: stageFacetWhere,
    select: { currentStage: true },
  });
  const stagesCount: Record<Stage, number> = {
    SOURCED: 0,
    APPLIED: 0,
    SCREENING: 0,
    TECHNICAL_INTERVIEW: 0,
    SYSTEM_DESIGN: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };
  for (const s of stageFacetApps) {
    const st = s.currentStage as Stage;
    if (stagesCount[st] !== undefined) {
      stagesCount[st]++;
    }
  }

  // Compute departments facet
  const deptFacetWhere = buildWhereClause(query, "departments");
  const deptFacetApps = await prisma.application.findMany({
    where: deptFacetWhere,
    select: { job: { select: { department: true } } },
  });
  const deptCount: Record<string, number> = {};
  for (const d of deptFacetApps) {
    const dept = d.job.department;
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  }

  // Compute sources facet
  const sourceFacetWhere = buildWhereClause(query, "sources");
  const sourceFacetApps = await prisma.application.findMany({
    where: sourceFacetWhere,
    select: { candidate: { select: { source: true } } },
  });
  const sourceCount: Record<string, number> = {};
  for (const s of sourceFacetApps) {
    const src = s.candidate.source;
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  }

  // Compute jobs facet
  const jobsFacetWhere = buildWhereClause(query, "jobs");
  const jobsFacetApps = await prisma.application.findMany({
    where: jobsFacetWhere,
    select: {
      job: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });
  const jobMap = new Map<string, { id: string; code: string; title: string; count: number }>();
  for (const j of jobsFacetApps) {
    const existing = jobMap.get(j.job.id);
    if (existing) {
      existing.count++;
    } else {
      jobMap.set(j.job.id, {
        id: j.job.id,
        code: j.job.code,
        title: j.job.title,
        count: 1,
      });
    }
  }

  // SLA breached count
  let slaBreachedCount = 0;
  for (const a of annotated) {
    if (a.slaState === "BREACHED") slaBreachedCount++;
  }

  const totalAll = await totalAllPromise;

  return {
    items: pagedItems,
    facets: {
      stages: stagesCount,
      departments: deptCount,
      sources: sourceCount,
      jobs: Array.from(jobMap.values()),
      slaBreached: slaBreachedCount,
    },
    totals: {
      filtered: filteredTotal,
      all: totalAll,
    },
    meta: {
      nextCursor,
      hasMore,
    },
  };
}
