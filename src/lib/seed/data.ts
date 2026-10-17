import { RoleType, WorkMode, EmploymentType, JobStatus, Priority, Stage } from "../validations/common";

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: RoleType;
  department: string;
}

export const SEED_USERS: SeedUser[] = [
  {
    id: "usr_priya_raman",
    name: "Priya Raman",
    email: "priya.raman@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "HIRING_MANAGER",
    department: "Engineering",
  },
  {
    id: "usr_marcus_whitfield",
    name: "Marcus Whitfield",
    email: "marcus.whitfield@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "HIRING_MANAGER",
    department: "Design",
  },
  {
    id: "usr_elena_sokolova",
    name: "Elena Sokolova",
    email: "elena.sokolova@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    role: "RECRUITER",
    department: "Talent Acquisition",
  },
  {
    id: "usr_kenji_nakamura",
    name: "Dr. Kenji Nakamura",
    email: "kenji.nakamura@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "INTERVIEWER",
    department: "AI Research",
  },
  {
    id: "usr_amara_okafor",
    name: "Amara Okafor",
    email: "amara.okafor@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
    role: "HIRING_MANAGER",
    department: "Product",
  },
  {
    id: "usr_daniel_reyes",
    name: "Daniel Reyes",
    email: "daniel.reyes@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "INTERVIEWER",
    department: "Engineering",
  },
  {
    id: "usr_veloce_admin",
    name: "Veloce Admin",
    email: "admin@veloce.dev",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "ADMIN",
    department: "Executive",
  },
];

export interface SeedJob {
  code: string;
  title: string;
  department: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  domainKeywords: string[];
  minExperienceYears: number;
  maxExperienceYears: number;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  headcountTotal: number;
  headcountFilled: number;
  status: JobStatus;
  priority: Priority;
  slaDaysPerStage: Record<Stage, number>;
  hiringManagerId: string;
  daysAgoOpened: number;
}

export const SEED_JOBS: SeedJob[] = [
  {
    code: "REQ-2026-01",
    title: "Senior Backend Engineer, Platform",
    department: "Engineering",
    location: "San Francisco, CA / Hybrid",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    description: "Lead the design and implementation of Veloce's core multi-tenant data pipelines, relational storage layers, and asynchronous event bus. You will work closely with Staff engineers to guarantee sub-50ms p99 latency across distributed services.",
    requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes"],
    niceToHaveSkills: ["Docker", "Kafka", "Redis", "GraphQL"],
    domainKeywords: ["distributed systems", "high availability", "microservices", "event-driven", "acid"],
    minExperienceYears: 5,
    maxExperienceYears: 10,
    salaryMin: 180000,
    salaryMax: 230000,
    currency: "USD",
    headcountTotal: 2,
    headcountFilled: 1, // 1 hired seeded candidate
    status: "OPEN",
    priority: "HIGH",
    slaDaysPerStage: {
      SOURCED: 5,
      APPLIED: 3,
      SCREENING: 5,
      TECHNICAL_INTERVIEW: 7,
      SYSTEM_DESIGN: 7,
      OFFER: 5,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
    hiringManagerId: "usr_priya_raman",
    daysAgoOpened: 45,
  },
  {
    code: "REQ-2026-02",
    title: "Staff Frontend Engineer, Design Systems",
    department: "Engineering",
    location: "Remote (US/Canada)",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    description: "Architect and steward our enterprise design system tokens, accessible primitives, and high-density data visualization components. Champion micro-interactions, zero layout shifts, and WCAG AA contrast compliance across the web app.",
    requiredSkills: ["TypeScript", "React", "Next.js", "Tailwind CSS"],
    niceToHaveSkills: ["Storybook", "Framer Motion", "Playwright", "WebSockets"],
    domainKeywords: ["design systems", "accessibility", "a11y", "state management", "performance", "rendering"],
    minExperienceYears: 7,
    maxExperienceYears: 14,
    salaryMin: 200000,
    salaryMax: 260000,
    currency: "USD",
    headcountTotal: 1,
    headcountFilled: 1, // 1 hired candidate
    status: "CLOSED", // Closed because 1 of 1 filled
    priority: "MEDIUM",
    slaDaysPerStage: {
      SOURCED: 4,
      APPLIED: 3,
      SCREENING: 4,
      TECHNICAL_INTERVIEW: 6,
      SYSTEM_DESIGN: 6,
      OFFER: 4,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
    hiringManagerId: "usr_priya_raman",
    daysAgoOpened: 75,
  },
  {
    code: "REQ-2026-03",
    title: "Applied AI Research Scientist, LLM Evaluation",
    department: "AI Research",
    location: "New York, NY",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    description: "Develop automated benchmark suites, red-teaming harnesses, and semantic extraction pipelines to assess resume parsing, candidate scoring calibration, and structured reasoning over enterprise HR data.",
    requiredSkills: ["Python", "PyTorch", "Large Language Models", "Machine Learning"],
    niceToHaveSkills: ["Hugging Face", "Fine-tuning", "RAG", "CUDA"],
    domainKeywords: ["evaluation", "benchmarking", "nlp", "llm", "alignment", "deep learning"],
    minExperienceYears: 4,
    maxExperienceYears: 9,
    salaryMin: 195000,
    salaryMax: 250000,
    currency: "USD",
    headcountTotal: 3, // headcountTotal 3 requirement
    headcountFilled: 1, // 1 hired candidate
    status: "OPEN",
    priority: "URGENT",
    slaDaysPerStage: {
      SOURCED: 7,
      APPLIED: 4,
      SCREENING: 5,
      TECHNICAL_INTERVIEW: 8,
      SYSTEM_DESIGN: 8,
      OFFER: 6,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
    hiringManagerId: "usr_kenji_nakamura",
    daysAgoOpened: 60,
  },
  {
    code: "REQ-2026-04",
    title: "ML Infrastructure Engineer",
    department: "AI Research",
    location: "Seattle, WA / Remote",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    description: "Scale high-throughput inference serving clusters, GPU orchestration with Kubernetes, and low-latency feature stores for embedding retrieval and automated candidate matching algorithms.",
    requiredSkills: ["Python", "Kubernetes", "Docker", "AWS"],
    niceToHaveSkills: ["Ray", "vLLM", "Terraform", "Prometheus"],
    domainKeywords: ["gpu orchestration", "inference", "mlops", "clusters", "serving", "embeddings"],
    minExperienceYears: 5,
    maxExperienceYears: 11,
    salaryMin: 190000,
    salaryMax: 240000,
    currency: "USD",
    headcountTotal: 1,
    headcountFilled: 0,
    status: "PAUSED", // PAUSED requirement
    priority: "LOW",
    slaDaysPerStage: {
      SOURCED: 5,
      APPLIED: 4,
      SCREENING: 5,
      TECHNICAL_INTERVIEW: 7,
      SYSTEM_DESIGN: 7,
      OFFER: 5,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
    hiringManagerId: "usr_kenji_nakamura",
    daysAgoOpened: 90,
  },
  {
    code: "REQ-2026-05",
    title: "Senior Product Designer, Growth",
    department: "Design",
    location: "San Francisco, CA / Hybrid",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    description: "Design delightful onboarding flows, friction-free triage experiences, and contextual collaboration spaces that transform how global recruiting teams discover and hire exceptional talent.",
    requiredSkills: ["Figma", "Design Systems", "UI/UX Design", "Wireframing"],
    niceToHaveSkills: ["User Research", "Interaction Design", "Accessibility", "A/B Testing"],
    domainKeywords: ["growth", "activation", "onboarding", "product design", "prototyping", "usability"],
    minExperienceYears: 5,
    maxExperienceYears: 10,
    salaryMin: 165000,
    salaryMax: 215000,
    currency: "USD",
    headcountTotal: 1,
    headcountFilled: 0,
    status: "OPEN",
    priority: "MEDIUM",
    slaDaysPerStage: {
      SOURCED: 5,
      APPLIED: 3,
      SCREENING: 5,
      TECHNICAL_INTERVIEW: 7,
      SYSTEM_DESIGN: 7,
      OFFER: 5,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
    hiringManagerId: "usr_marcus_whitfield",
    daysAgoOpened: 30,
  },
  {
    code: "REQ-2026-06",
    title: "Group Product Manager, Enterprise",
    department: "Product",
    location: "New York, NY",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    description: "Lead Veloce's enterprise tier roadmap: multi-entity RBAC hierarchies, custom compliance audit trails, third-party HRIS connectors, and enterprise analytics dashboards for Fortune 500 Chief People Officers.",
    requiredSkills: ["Product Management", "Roadmapping", "Product Analytics", "Agile"],
    niceToHaveSkills: ["SQL Analysis", "A/B Testing", "System Design"],
    domainKeywords: ["enterprise", "compliance", "integrations", "saas", "governance", "b2b"],
    minExperienceYears: 7,
    maxExperienceYears: 13,
    salaryMin: 210000,
    salaryMax: 270000,
    currency: "USD",
    headcountTotal: 1,
    headcountFilled: 0,
    status: "OPEN",
    priority: "HIGH",
    slaDaysPerStage: {
      SOURCED: 6,
      APPLIED: 3,
      SCREENING: 5,
      TECHNICAL_INTERVIEW: 7,
      SYSTEM_DESIGN: 7,
      OFFER: 5,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    },
    hiringManagerId: "usr_amara_okafor",
    daysAgoOpened: 20,
  },
];
