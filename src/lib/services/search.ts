import { prisma } from "../db";
import { toList } from "../db-compat";

export interface GlobalSearchResult {
  candidates: {
    id: string;
    publicCode: string;
    fullName: string;
    currentTitle: string | null;
    currentCompany: string | null;
    avatarUrl: string | null;
    applicationId: string | null;
    stage: string | null;
    aiMatchScore: number | null;
  }[];
  jobs: {
    id: string;
    code: string;
    title: string;
    department: string;
    status: string;
  }[];
  commands: {
    id: string;
    title: string;
    subtitle: string;
    category: "Navigation" | "Action";
    action: string;
    shortcut?: string;
  }[];
}

const STATIC_COMMANDS: GlobalSearchResult["commands"] = [
  {
    id: "nav-dashboard",
    title: "Go to Dashboard",
    subtitle: "Executive Analytics & KPIs",
    category: "Navigation",
    action: "/dashboard",
    shortcut: "G D",
  },
  {
    id: "nav-pipeline",
    title: "Go to Pipeline",
    subtitle: "Kanban, High-Density Grid, & Triage",
    category: "Navigation",
    action: "/pipeline",
    shortcut: "G P",
  },
  {
    id: "nav-jobs",
    title: "Go to Jobs",
    subtitle: "Hiring Plan & Requisitions",
    category: "Navigation",
    action: "/jobs",
    shortcut: "G J",
  },
  {
    id: "nav-compare",
    title: "Go to Candidate Comparison",
    subtitle: "Side-by-side evaluation matrix",
    category: "Navigation",
    action: "/compare",
    shortcut: "G C",
  },
  {
    id: "act-new-candidate",
    title: "New Candidate + Resume Parse",
    subtitle: "Paste text or structured data with live AI match score preview",
    category: "Action",
    action: "MODAL_NEW_CANDIDATE",
    shortcut: "N",
  },
  {
    id: "act-reset-db",
    title: "Reset Demo Database",
    subtitle: "Idempotent wipe and reload to pristine seed state",
    category: "Action",
    action: "MODAL_RESET_DB",
    shortcut: "⌘⇧R",
  },
  {
    id: "act-toggle-theme",
    title: "Toggle Color Theme",
    subtitle: "Switch between dark and light appearance",
    category: "Action",
    action: "ACTION_TOGGLE_THEME",
    shortcut: "T",
  },
];

export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  const query = (q || "").trim();

  // If query is empty, return top recent candidates, open jobs, and all commands
  if (!query) {
    const [recentCandidates, openJobs] = await Promise.all([
      prisma.candidate.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          applications: {
            take: 1,
            orderBy: { appliedAt: "desc" },
            select: { id: true, currentStage: true, aiMatchScore: true },
          },
        },
      }),
      prisma.jobRequisition.findMany({
        where: { status: "OPEN" },
        take: 8,
        orderBy: { openedAt: "desc" },
        select: { id: true, code: true, title: true, department: true, status: true },
      }),
    ]);

    return {
      candidates: recentCandidates.map((c) => ({
        id: c.id,
        publicCode: c.publicCode,
        fullName: c.fullName,
        currentTitle: c.currentTitle,
        currentCompany: c.currentCompany,
        avatarUrl: c.avatarUrl,
        applicationId: c.applications[0]?.id || null,
        stage: c.applications[0]?.currentStage || null,
        aiMatchScore: c.applications[0]?.aiMatchScore ?? null,
      })),
      jobs: openJobs,
      commands: STATIC_COMMANDS,
    };
  }

  // Filter commands by query
  const lowerQ = query.toLowerCase();
  const matchedCommands = STATIC_COMMANDS.filter(
    (c) => c.title.toLowerCase().includes(lowerQ) || c.subtitle.toLowerCase().includes(lowerQ)
  );

  // Search candidates
  const candidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { fullName: { contains: query } },
        { email: { contains: query } },
        { publicCode: { contains: query } },
        { currentTitle: { contains: query } },
        { currentCompany: { contains: query } },
      ],
    },
    take: 8,
    include: {
      applications: {
        take: 1,
        orderBy: { appliedAt: "desc" },
        select: { id: true, currentStage: true, aiMatchScore: true },
      },
    },
  });

  // Search jobs
  const jobs = await prisma.jobRequisition.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { code: { contains: query } },
        { department: { contains: query } },
      ],
    },
    take: 8,
    select: { id: true, code: true, title: true, department: true, status: true },
  });

  return {
    candidates: candidates.map((c) => ({
      id: c.id,
      publicCode: c.publicCode,
      fullName: c.fullName,
      currentTitle: c.currentTitle,
      currentCompany: c.currentCompany,
      avatarUrl: c.avatarUrl,
      applicationId: c.applications[0]?.id || null,
      stage: c.applications[0]?.currentStage || null,
      aiMatchScore: c.applications[0]?.aiMatchScore ?? null,
    })),
    jobs,
    commands: matchedCommands,
  };
}
