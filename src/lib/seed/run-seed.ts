import { prisma, isSqlite } from "../db";
import { fromList, toList, jsonIn } from "../db-compat";
import { createPrng, pick, randInt } from "./prng";
import { SEED_USERS, SEED_JOBS } from "./data";
import { Stage, Recommendation, RejectionReason } from "../validations/common";
import { computeAiMatchScore } from "../scoring-engine";
import { assertSeedInvariants } from "./invariants";
import { logAudit } from "../services/audit";

// 32 Candidate Profiles Data Template
interface CandidateSeedTemplate {
  name: string;
  email: string;
  location: string;
  timezone: string;
  title: string;
  company: string;
  expYears: number;
  salary: number;
  noticeDays: number;
  skills: string[];
  source: string;
  jobCode: string;
  targetStage: Stage;
  slaBreachType: "BREACHED" | "WARNING" | "OK";
  rejectionReason?: RejectionReason;
}

const CANDIDATES_DATA: CandidateSeedTemplate[] = [
  // SOURCED (3)
  {
    name: "Alexei Volkov",
    email: "alexei.volkov@gmail.com",
    location: "Berlin, Germany",
    timezone: "Europe/Berlin",
    title: "Senior Systems Engineer",
    company: "SoundCloud",
    expYears: 7,
    salary: 215000,
    noticeDays: 30,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "Docker", "Kafka"],
    source: "Executive Search",
    jobCode: "REQ-2026-01",
    targetStage: "SOURCED",
    slaBreachType: "OK",
  },
  {
    name: "Sarah Jenkins",
    email: "sarah.j.design@outlook.com",
    location: "Austin, TX",
    timezone: "America/Chicago",
    title: "Staff Product Designer",
    company: "Dell Technologies",
    expYears: 8,
    salary: 190000,
    noticeDays: 14,
    skills: ["Figma", "Design Systems", "UI/UX Design", "Wireframing", "Interaction Design"],
    source: "Referral",
    jobCode: "REQ-2026-05",
    targetStage: "SOURCED",
    slaBreachType: "OK",
  },
  {
    name: "Tariq Mansoor",
    email: "tariq.mansoor@ai-lab.io",
    location: "Toronto, Canada",
    timezone: "America/Toronto",
    title: "Research Engineer",
    company: "Cohere",
    expYears: 5,
    salary: 220000,
    noticeDays: 30,
    skills: ["Python", "PyTorch", "Large Language Models", "Machine Learning", "RAG"],
    source: "LinkedIn",
    jobCode: "REQ-2026-03",
    targetStage: "SOURCED",
    slaBreachType: "OK",
  },

  // APPLIED (5)
  {
    name: "Devon Miller",
    email: "devon.miller@platform.dev",
    location: "Seattle, WA",
    timezone: "America/Los_Angeles",
    title: "Cloud Infrastructure Engineer",
    company: "Microsoft",
    expYears: 6,
    salary: 210000,
    noticeDays: 30,
    skills: ["Python", "Kubernetes", "Docker", "AWS", "Terraform", "Prometheus"],
    source: "Job Board",
    jobCode: "REQ-2026-04",
    targetStage: "APPLIED",
    slaBreachType: "BREACHED", // SLA Breach #1
  },
  {
    name: "Mei-Ling Zhou",
    email: "ml.zhou@techcorp.cn",
    location: "Vancouver, Canada",
    timezone: "America/Vancouver",
    title: "Senior Fullstack Engineer",
    company: "Hootsuite",
    expYears: 6,
    salary: 195000,
    noticeDays: 15,
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "GraphQL"],
    source: "Inbound",
    jobCode: "REQ-2026-02",
    targetStage: "APPLIED",
    slaBreachType: "WARNING", // SLA Warning #1
  },
  {
    name: "Lucas Silva",
    email: "lucas.silva@nubank.br",
    location: "São Paulo, Brazil",
    timezone: "America/Sao_Paulo",
    title: "Backend Engineer",
    company: "Nubank",
    expYears: 5,
    salary: 190000,
    noticeDays: 30,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "Redis"],
    source: "Referral",
    jobCode: "REQ-2026-01",
    targetStage: "APPLIED",
    slaBreachType: "OK",
  },
  {
    name: "Fatima Al-Hassan",
    email: "fatima.hassan@dubai-fintech.ae",
    location: "Dubai, UAE",
    timezone: "Asia/Dubai",
    title: "Senior Product Manager",
    company: "Careem",
    expYears: 8,
    salary: 235000,
    noticeDays: 60,
    skills: ["Product Management", "Roadmapping", "Product Analytics", "Agile", "SQL Analysis"],
    source: "Executive Search",
    jobCode: "REQ-2026-06",
    targetStage: "APPLIED",
    slaBreachType: "OK",
  },
  {
    name: "Kavita Patel",
    email: "kavita.patel@bengaluru.in",
    location: "Bengaluru, India",
    timezone: "Asia/Kolkata",
    title: "AI Research Associate",
    company: "Wipro AI Labs",
    expYears: 4,
    salary: 205000,
    noticeDays: 45,
    skills: ["Python", "PyTorch", "Large Language Models", "Machine Learning", "Hugging Face"],
    source: "LinkedIn",
    jobCode: "REQ-2026-03",
    targetStage: "APPLIED",
    slaBreachType: "OK",
  },

  // SCREENING (5)
  {
    name: "Carlos Mendoza",
    email: "carlos.mendoza@latam-cloud.io",
    location: "Mexico City, Mexico",
    timezone: "America/Mexico_City",
    title: "Backend Platform Engineer",
    company: "Mercado Libre",
    expYears: 7,
    salary: 205000,
    noticeDays: 30,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "Kafka"],
    source: "Referral",
    jobCode: "REQ-2026-01",
    targetStage: "SCREENING",
    slaBreachType: "BREACHED", // SLA Breach #2
  },
  {
    name: "Chloe Dubois",
    email: "chloe.dubois@paris-design.fr",
    location: "Paris, France",
    timezone: "Europe/Paris",
    title: "Senior Product Designer",
    company: "Qonto",
    expYears: 6,
    salary: 175000,
    noticeDays: 30,
    skills: ["Figma", "Design Systems", "UI/UX Design", "Wireframing", "User Research"],
    source: "LinkedIn",
    jobCode: "REQ-2026-05",
    targetStage: "SCREENING",
    slaBreachType: "WARNING", // SLA Warning #2
  },
  {
    name: "Arjun Nair",
    email: "arjun.nair@chennai.in",
    location: "San Jose, CA",
    timezone: "America/Los_Angeles",
    title: "MLOps Architect",
    company: "Cisco Systems",
    expYears: 9,
    salary: 230000,
    noticeDays: 30,
    skills: ["Python", "Kubernetes", "Docker", "AWS", "Ray", "vLLM"],
    source: "Agency",
    jobCode: "REQ-2026-04",
    targetStage: "SCREENING",
    slaBreachType: "OK",
  },
  {
    name: "Ingrid Lindqvist",
    email: "ingrid.l@stockholm-tech.se",
    location: "Stockholm, Sweden",
    timezone: "Europe/Stockholm",
    title: "Lead Frontend Engineer",
    company: "Klarna",
    expYears: 8,
    salary: 220000,
    noticeDays: 60,
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Storybook", "Playwright"],
    source: "Referral",
    jobCode: "REQ-2026-02",
    targetStage: "SCREENING",
    slaBreachType: "OK",
  },
  {
    name: "Liam O'Connor",
    email: "liam.oconnor@dublin-fintech.ie",
    location: "Dublin, Ireland",
    timezone: "Europe/Dublin",
    title: "Senior Product Manager",
    company: "Stripe",
    expYears: 9,
    salary: 245000,
    noticeDays: 30,
    skills: ["Product Management", "Roadmapping", "Product Analytics", "Agile", "A/B Testing"],
    source: "Executive Search",
    jobCode: "REQ-2026-06",
    targetStage: "SCREENING",
    slaBreachType: "OK",
  },

  // TECHNICAL_INTERVIEW (5)
  {
    name: "Dr. Ethan Wright",
    email: "ethan.wright@mit-alum.edu",
    location: "Boston, MA",
    timezone: "America/New_York",
    title: "Principal Research Scientist",
    company: "MIT Lincoln Laboratory",
    expYears: 8,
    salary: 240000,
    noticeDays: 30,
    skills: ["Python", "PyTorch", "Large Language Models", "Machine Learning", "Fine-tuning"],
    source: "Referral",
    jobCode: "REQ-2026-03",
    targetStage: "TECHNICAL_INTERVIEW",
    slaBreachType: "BREACHED", // SLA Breach #3
  },
  {
    name: "Siddharth Rao",
    email: "sid.rao@hyderabad-cloud.in",
    location: "Hyderabad, India",
    timezone: "Asia/Kolkata",
    title: "Senior Distributed Systems Engineer",
    company: "Amazon Web Services",
    expYears: 7,
    salary: 215000,
    noticeDays: 45,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "Docker", "Redis"],
    source: "LinkedIn",
    jobCode: "REQ-2026-01",
    targetStage: "TECHNICAL_INTERVIEW",
    slaBreachType: "WARNING", // SLA Warning #3
  },
  {
    name: "Hannah Schmidt",
    email: "hannah.schmidt@berlin-design.de",
    location: "Berlin, Germany",
    timezone: "Europe/Berlin",
    title: "Senior UX Specialist",
    company: "N26",
    expYears: 6,
    salary: 185000,
    noticeDays: 30,
    skills: ["Figma", "Design Systems", "UI/UX Design", "Wireframing", "A/B Testing"],
    source: "Inbound",
    jobCode: "REQ-2026-05",
    targetStage: "TECHNICAL_INTERVIEW",
    slaBreachType: "OK",
  },
  {
    name: "Kenji Sato",
    email: "kenji.sato@tokyo-infra.jp",
    location: "Tokyo, Japan",
    timezone: "Asia/Tokyo",
    title: "Infrastructure Lead",
    company: "Mercari",
    expYears: 9,
    salary: 225000,
    noticeDays: 30,
    skills: ["Python", "Kubernetes", "Docker", "AWS", "Terraform"],
    source: "Referral",
    jobCode: "REQ-2026-04",
    targetStage: "TECHNICAL_INTERVIEW",
    slaBreachType: "OK",
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@ui-systems.io",
    location: "San Francisco, CA",
    timezone: "America/Los_Angeles",
    title: "Staff UI Architect",
    company: "Figma",
    expYears: 10,
    salary: 250000,
    noticeDays: 14,
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Framer Motion", "Storybook"],
    source: "Executive Search",
    jobCode: "REQ-2026-02",
    targetStage: "TECHNICAL_INTERVIEW",
    slaBreachType: "OK",
  },

  // SYSTEM_DESIGN (4)
  {
    name: "Gabriel Dupont",
    email: "gabriel.dupont@cloud-systems.fr",
    location: "Lyon, France",
    timezone: "Europe/Paris",
    title: "Lead Platform Architect",
    company: "Datadog",
    expYears: 9,
    salary: 228000,
    noticeDays: 30,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "Kafka", "Redis"],
    source: "Referral",
    jobCode: "REQ-2026-01",
    targetStage: "SYSTEM_DESIGN",
    slaBreachType: "BREACHED", // SLA Breach #4
  },
  {
    name: "Zoe Kravitz",
    email: "zoe.kravitz@ny-ai.com",
    location: "New York, NY",
    timezone: "America/New_York",
    title: "Senior AI Researcher",
    company: "Hugging Face",
    expYears: 6,
    salary: 235000,
    noticeDays: 30,
    skills: ["Python", "PyTorch", "Large Language Models", "Machine Learning", "vLLM"],
    source: "LinkedIn",
    jobCode: "REQ-2026-03",
    targetStage: "SYSTEM_DESIGN",
    slaBreachType: "WARNING", // SLA Warning #4
  },
  {
    name: "Mateo Rossi",
    email: "mateo.rossi@milan-pm.it",
    location: "Milan, Italy",
    timezone: "Europe/Rome",
    title: "Principal PM",
    company: "Bending Spoons",
    expYears: 10,
    salary: 255000,
    noticeDays: 45,
    skills: ["Product Management", "Roadmapping", "Product Analytics", "Agile", "System Design"],
    source: "Referral",
    jobCode: "REQ-2026-06",
    targetStage: "SYSTEM_DESIGN",
    slaBreachType: "OK",
  },
  {
    name: "Maya Lin",
    email: "maya.lin@growth-design.co",
    location: "Seattle, WA",
    timezone: "America/Los_Angeles",
    title: "Staff Product Designer",
    company: "Airbnb",
    expYears: 8,
    salary: 205000,
    noticeDays: 14,
    skills: ["Figma", "Design Systems", "UI/UX Design", "Wireframing", "Interaction Design"],
    source: "Executive Search",
    jobCode: "REQ-2026-05",
    targetStage: "SYSTEM_DESIGN",
    slaBreachType: "OK",
  },

  // OFFER (3)
  {
    name: "Dmitri Romanov",
    email: "dmitri.romanov@ai-systems.io",
    location: "Zurich, Switzerland",
    timezone: "Europe/Zurich",
    title: "Staff AI Engineer",
    company: "Google Research",
    expYears: 7,
    salary: 245000,
    noticeDays: 30,
    skills: ["Python", "PyTorch", "Large Language Models", "Machine Learning", "CUDA", "Ray"],
    source: "Referral",
    jobCode: "REQ-2026-03",
    targetStage: "OFFER",
    slaBreachType: "OK",
  },
  {
    name: "Jessica Taylor",
    email: "jessica.taylor@sf-growth.org",
    location: "San Francisco, CA",
    timezone: "America/Los_Angeles",
    title: "Principal Designer",
    company: "Dropbox",
    expYears: 9,
    salary: 210000,
    noticeDays: 14,
    skills: ["Figma", "Design Systems", "UI/UX Design", "Wireframing", "User Research"],
    source: "Executive Search",
    jobCode: "REQ-2026-05",
    targetStage: "OFFER",
    slaBreachType: "OK",
  },
  {
    name: "Vikram Malhotra",
    email: "vikram.malhotra@enterprise-pm.net",
    location: "Chicago, IL",
    timezone: "America/Chicago",
    title: "Group Product Manager",
    company: "Salesforce",
    expYears: 11,
    salary: 260000,
    noticeDays: 30,
    skills: ["Product Management", "Roadmapping", "Product Analytics", "Agile", "SQL Analysis"],
    source: "Referral",
    jobCode: "REQ-2026-06",
    targetStage: "OFFER",
    slaBreachType: "OK",
  },

  // HIRED (3)
  {
    name: "Kasper van den Berg",
    email: "kasper.vdb@amsterdam-tech.nl",
    location: "Amsterdam, Netherlands",
    timezone: "Europe/Amsterdam",
    title: "Staff Frontend Architect",
    company: "Adyen",
    expYears: 9,
    salary: 235000,
    noticeDays: 30,
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Playwright", "WebSockets"],
    source: "Referral",
    jobCode: "REQ-2026-02", // Job REQ-2026-02 is filled (1/1) -> CLOSED
    targetStage: "HIRED",
    slaBreachType: "OK",
  },
  {
    name: "Dr. Sarah Chen",
    email: "sarah.chen@stanford-ai.edu",
    location: "Palo Alto, CA",
    timezone: "America/Los_Angeles",
    title: "Lead AI Research Scientist",
    company: "Anthropic",
    expYears: 8,
    salary: 248000,
    noticeDays: 14,
    skills: ["Python", "PyTorch", "Large Language Models", "Machine Learning", "Fine-tuning", "RAG"],
    source: "Executive Search",
    jobCode: "REQ-2026-03", // Job REQ-2026-03 is 1/3 filled
    targetStage: "HIRED",
    slaBreachType: "OK",
  },
  {
    name: "Brandon Cole",
    email: "brandon.cole@backend-lead.com",
    location: "Austin, TX",
    timezone: "America/Chicago",
    title: "Senior Platform Engineer",
    company: "Cloudflare",
    expYears: 7,
    salary: 220000,
    noticeDays: 14,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "Docker", "Kafka"],
    source: "Referral",
    jobCode: "REQ-2026-01", // Job REQ-2026-01 is 1/2 filled
    targetStage: "HIRED",
    slaBreachType: "OK",
  },

  // REJECTED (3)
  {
    name: "Marcus Vance",
    email: "marcus.vance@legacy-sys.org",
    location: "Denver, CO",
    timezone: "America/Denver",
    title: "Java Developer",
    company: "Oracle",
    expYears: 3, // under-experienced
    salary: 190000,
    noticeDays: 14,
    skills: ["Java", "SQL"],
    source: "Job Board",
    jobCode: "REQ-2026-01",
    targetStage: "REJECTED",
    slaBreachType: "OK",
    rejectionReason: "SKILLS_MISMATCH",
  },
  {
    name: "Nadia Petrova",
    email: "nadia.petrova@high-sal.io",
    location: "London, UK",
    timezone: "Europe/London",
    title: "Contract UX Designer",
    company: "Revolut",
    expYears: 5,
    salary: 280000, // high salary
    noticeDays: 14,
    skills: ["Figma", "UI/UX Design"],
    source: "Agency",
    jobCode: "REQ-2026-05",
    targetStage: "REJECTED",
    slaBreachType: "OK",
    rejectionReason: "COMPENSATION",
  },
  {
    name: "Thomas Becker",
    email: "thomas.becker@berlin-ml.de",
    location: "Munich, Germany",
    timezone: "Europe/Berlin",
    title: "Data Analyst",
    company: "Siemens",
    expYears: 2,
    salary: 160000,
    noticeDays: 14,
    skills: ["Python", "SQL"],
    source: "Job Board",
    jobCode: "REQ-2026-04",
    targetStage: "REJECTED",
    slaBreachType: "OK",
    rejectionReason: "EXPERIENCE",
  },

  // WITHDRAWN (1)
  {
    name: "Elena Rostova",
    email: "elena.rostova@fintech-ventures.ch",
    location: "Geneva, Switzerland",
    timezone: "Europe/Zurich",
    title: "Senior Product Manager",
    company: "CERN OpenLab",
    expYears: 8,
    salary: 240000,
    noticeDays: 30,
    skills: ["Product Management", "Roadmapping", "Agile"],
    source: "Referral",
    jobCode: "REQ-2026-06",
    targetStage: "WITHDRAWN",
    slaBreachType: "OK",
  },
];

export async function runSeed(options?: { reset?: boolean }): Promise<{ elapsedMs: number }> {
  const startTime = Date.now();
  const prng = createPrng(20260101);

  console.log("🌱 Starting Veloce ATS deterministic seed pipeline...");

  // 1. Wipe database idempotently
  if (isSqlite) {
    console.log("Cleaning SQLite tables...");
    await prisma.webhookDelivery.deleteMany();
    await prisma.automationRule.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.stageTransitionLog.deleteMany();
    await prisma.candidateNote.deleteMany();
    await prisma.interviewEvent.deleteMany();
    await prisma.scorecard.deleteMany();
    await prisma.application.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.jobRequisition.deleteMany();
    await prisma.user.deleteMany();
  } else {
    console.log("Truncating PostgreSQL tables with restart identity cascade...");
    try {
      await (prisma as any).$executeRawUnsafe(`
        TRUNCATE TABLE 
          "WebhookDelivery", 
          "AutomationRule", 
          "StageTransitionLog", 
          "CandidateNote", 
          "InterviewEvent", 
          "Scorecard", 
          "Application", 
          "Candidate", 
          "JobRequisition", 
          "User",
          "AuditLog"
        RESTART IDENTITY CASCADE;
      `);
    } catch {
      // Fallback if truncate fails
      await prisma.webhookDelivery.deleteMany();
      await prisma.automationRule.deleteMany();
      await prisma.auditLog.deleteMany();
      await prisma.stageTransitionLog.deleteMany();
      await prisma.candidateNote.deleteMany();
      await prisma.interviewEvent.deleteMany();
      await prisma.scorecard.deleteMany();
      await prisma.application.deleteMany();
      await prisma.candidate.deleteMany();
      await prisma.jobRequisition.deleteMany();
      await prisma.user.deleteMany();
    }
  }

  // 2. Insert Users
  console.log("Inserting users...");
  const createdUsers = new Map<string, any>();
  for (const u of SEED_USERS) {
    const user = await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        department: u.department,
        isActive: true,
      },
    });
    createdUsers.set(u.id, user);
  }

  // 3. Insert Jobs
  console.log("Inserting job requisitions...");
  const now = new Date();
  const createdJobs = new Map<string, any>();

  for (const j of SEED_JOBS) {
    const openedAt = new Date(now.getTime() - j.daysAgoOpened * 24 * 3600 * 1000);
    const closedAt = j.status === "CLOSED" ? new Date(now.getTime() - 5 * 24 * 3600 * 1000) : null;

    const job = await prisma.jobRequisition.create({
      data: {
        code: j.code,
        title: j.title,
        department: j.department,
        location: j.location,
        workMode: j.workMode,
        employmentType: j.employmentType,
        description: j.description,
        requiredSkills: fromList(j.requiredSkills),
        niceToHaveSkills: fromList(j.niceToHaveSkills),
        domainKeywords: fromList(j.domainKeywords),
        minExperienceYears: j.minExperienceYears,
        maxExperienceYears: j.maxExperienceYears,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        headcountTotal: j.headcountTotal,
        headcountFilled: j.headcountFilled,
        status: j.status,
        priority: j.priority,
        slaDaysPerStage: jsonIn(j.slaDaysPerStage),
        hiringManagerId: j.hiringManagerId,
        openedAt,
        closedAt,
      },
    });
    createdJobs.set(j.code, job);
  }

  // 4. Seed Candidates & Applications
  console.log("Inserting candidates, scoring, and building transition logs...");
  const stageOrders: Record<Stage, number> = {
    SOURCED: 1000,
    APPLIED: 1000,
    SCREENING: 1000,
    TECHNICAL_INTERVIEW: 1000,
    SYSTEM_DESIGN: 1000,
    OFFER: 1000,
    HIRED: 1000,
    REJECTED: 1000,
    WITHDRAWN: 1000,
  };

  const createdApplications: any[] = [];
  const elena = createdUsers.get("usr_elena_sokolova")!;

  for (let i = 0; i < CANDIDATES_DATA.length; i++) {
    const cData = CANDIDATES_DATA[i]!;
    const publicCode = `CAND-${1000 + i + 1}`;
    const job = createdJobs.get(cData.jobCode)!;

    // Realistic resume text generator
    const resumeText = `
${cData.name}
Email: ${cData.email} | Phone: +1 (555) 234-${1000 + i} | Location: ${cData.location}
LinkedIn: linkedin.com/in/${cData.name.toLowerCase().replace(/[^a-z]/g, "")}
GitHub: github.com/${cData.name.toLowerCase().replace(/[^a-z]/g, "")}

PROFESSIONAL SUMMARY:
Accomplished ${cData.title} with over ${cData.expYears} years of deep production experience at ${cData.company}. 
Proven track record architecting resilient systems, leading cross-functional squads, and delivering measurable enterprise impact.

SKILLS:
${cData.skills.join(", ")}

EXPERIENCE:
${cData.title} | ${cData.company} (${now.getFullYear() - cData.expYears} – Present)
• Architected enterprise features resulting in a 42% reduction in p99 API latency and 99.99% service availability.
• Championed engineering rigor, mentored 6 junior and mid-level engineers, and standardized internal design system tokens.
• Authored comprehensive RFCs, established automated CI/CD pipelines, and reduced deployment rollback rates by 35%.
• Spearheaded distributed architecture migrations handling over 100M events daily with sub-millisecond serialization.

EDUCATION:
B.S. in Computer Science & Applied Mathematics, Top Honors.
    `.trim();

    const candidate = await prisma.candidate.create({
      data: {
        publicCode,
        fullName: cData.name,
        email: cData.email,
        phone: `+1 (555) 234-${1000 + i}`,
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 12345}?w=150&auto=format&fit=crop&q=80`,
        location: cData.location,
        timezone: cData.timezone,
        currentCompany: cData.company,
        currentTitle: cData.title,
        experienceYears: cData.expYears,
        expectedSalary: cData.salary,
        noticePeriodDays: cData.noticeDays,
        linkedinUrl: `https://linkedin.com/in/${cData.name.toLowerCase().replace(/[^a-z]/g, "")}`,
        githubUrl: `https://github.com/${cData.name.toLowerCase().replace(/[^a-z]/g, "")}`,
        parsedResumeText: resumeText,
        skills: fromList(cData.skills),
        tags: fromList([cData.source.toLowerCase(), "vetted", `exp-${cData.expYears}y`]),
        source: cData.source,
      },
    });

    // Run scoring engine
    const breakdown = computeAiMatchScore(
      {
        skills: cData.skills,
        experienceYears: cData.expYears,
        expectedSalary: cData.salary,
        noticePeriodDays: cData.noticeDays,
        currentTitle: cData.title,
        currentCompany: cData.company,
        parsedResumeText: resumeText,
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

    // Dwell and SLA calculation
    const kanbanOrder = stageOrders[cData.targetStage];
    stageOrders[cData.targetStage] += 1000;

    let daysInCurrentStage = 2;
    const slaAllowed = 5;

    if (cData.slaBreachType === "BREACHED") {
      daysInCurrentStage = slaAllowed + 3; // Guaranteed breach
    } else if (cData.slaBreachType === "WARNING") {
      daysInCurrentStage = 4.2; // > 0.75 * 5 (3.75)
    }

    const stageEnteredAt = new Date(now.getTime() - daysInCurrentStage * 24 * 3600 * 1000);
    const appliedDaysAgo = daysInCurrentStage + randInt(prng, 15, 30);
    const appliedAt = new Date(now.getTime() - appliedDaysAgo * 24 * 3600 * 1000);

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: job.id,
        currentStage: cData.targetStage,
        kanbanOrder,
        aiMatchScore: breakdown.total,
        aiScoreBreakdown: jsonIn(breakdown),
        stageEnteredAt,
        appliedAt,
        rejectionReason: cData.rejectionReason || null,
        rejectionNotes: cData.rejectionReason ? `Candidate rejected: ${cData.rejectionReason}` : null,
      },
      include: {
        candidate: true,
        job: true,
      },
    });

    createdApplications.push({
      ...application,
      targetStage: cData.targetStage,
      appliedAt,
      stageEnteredAt,
    });

    // Reconstruct Stage Transitions to satisfy consistency rule:
    // (Sum of prior dwell times + current dwell = now - appliedAt)
    const stageSequence: Stage[] = [
      "SOURCED",
      "APPLIED",
      "SCREENING",
      "TECHNICAL_INTERVIEW",
      "SYSTEM_DESIGN",
      "OFFER",
      "HIRED",
    ];

    const targetIdx = stageSequence.indexOf(cData.targetStage);
    let path: Stage[] = [];

    if (targetIdx !== -1) {
      path = stageSequence.slice(1, targetIdx + 1); // From APPLIED to target
    } else if (cData.targetStage === "SOURCED") {
      path = [];
    } else if (cData.targetStage === "REJECTED") {
      path = ["APPLIED", "SCREENING", "REJECTED"];
    } else if (cData.targetStage === "WITHDRAWN") {
      path = ["APPLIED", "SCREENING", "WITHDRAWN"];
    }

    let runningTime = appliedAt.getTime();
    for (let p = 0; p < path.length; p++) {
      const fromSt = p === 0 ? null : path[p - 1]!;
      const toSt = path[p]!;
      const isLast = p === path.length - 1;

      const dwellDays = isLast ? daysInCurrentStage : randInt(prng, 2, 5);
      const dwellSeconds = Math.floor(dwellDays * 24 * 3600);
      runningTime += dwellSeconds * 1000;

      await prisma.stageTransitionLog.create({
        data: {
          applicationId: application.id,
          fromStage: fromSt,
          toStage: toSt,
          movedById: elena.id,
          durationInPreviousStageSeconds: dwellSeconds,
          reason: toSt === "REJECTED" ? cData.rejectionReason : "Advanced stage",
          timestamp: new Date(runningTime),
        },
      });

      await logAudit({
        entityType: "Application",
        entityId: application.id,
        action: "STAGE_CHANGED",
        actorId: elena.id,
        metadata: { fromStage: fromSt, toStage: toSt },
      });
    }
  }

  // 5. Insert Scorecards (45+ scorecards for candidates who reached TECHNICAL_INTERVIEW or beyond)
  console.log("Inserting scorecards with deliberate calibration divergence...");
  const technicalOrBeyond = createdApplications.filter((a) =>
    ["TECHNICAL_INTERVIEW", "SYSTEM_DESIGN", "OFFER", "HIRED"].includes(a.targetStage)
  );

  const interviewersList = [
    createdUsers.get("usr_kenji_nakamura")!,
    createdUsers.get("usr_daniel_reyes")!,
    createdUsers.get("usr_priya_raman")!,
  ];

  let totalScorecardsSeeded = 0;

  for (let idx = 0; idx < technicalOrBeyond.length; idx++) {
    const app = technicalOrBeyond[idx]!;
    
    // Determine stages for which candidate has scorecards
    const scorecardStages: Stage[] = [];
    if (["TECHNICAL_INTERVIEW", "SYSTEM_DESIGN", "OFFER", "HIRED"].includes(app.targetStage)) {
      scorecardStages.push("TECHNICAL_INTERVIEW");
    }
    if (["SYSTEM_DESIGN", "OFFER", "HIRED"].includes(app.targetStage)) {
      scorecardStages.push("SYSTEM_DESIGN");
    }

    for (const scStage of scorecardStages) {
      const numInterviewers = scStage === "SYSTEM_DESIGN" ? 2 : (idx % 2 === 0 ? 3 : 2);

      for (let j = 0; j < numInterviewers; j++) {
        const interviewer = interviewersList[j]!;

        // Create deliberate disagreement for candidate 0 and 2
        let rec: Recommendation = "YES";
        let techScore = randInt(prng, 4, 5);
        let archScore = randInt(prng, 4, 5);

        if (idx === 0 && j === 1) {
          rec = "STRONG_NO";
          techScore = 2;
          archScore = 2;
        } else if (idx === 2 && j === 2) {
          rec = "NO";
          techScore = 2;
          archScore = 3;
        } else if (j === 0) {
          rec = "STRONG_YES";
        }

        await prisma.scorecard.create({
          data: {
            applicationId: app.id,
            interviewerId: interviewer.id,
            stage: scStage,
            technicalScore: techScore,
            architectureScore: archScore,
            problemSolvingScore: randInt(prng, 3, 5),
            communicationScore: randInt(prng, 4, 5),
            cultureScore: randInt(prng, 4, 5),
            overallRecommendation: rec,
            strengths: "Demonstrated deep expertise in distributed data architecture and concurrent transaction management.",
            concerns: rec === "NO" || rec === "STRONG_NO"
              ? "Lacks experience in multi-region failover protocols and showed hesitancy with Kubernetes operator patterns."
              : "Slight hesitation on fine-tuning hyperparameters; easily mitigated through onboarding ramp.",
            submittedAt: new Date(now.getTime() - randInt(prng, 1, 10) * 24 * 3600 * 1000),
          },
        });
        totalScorecardsSeeded++;
      }
    }
  }

  // 6. Insert Candidate Notes (50+ records with threading, mentions, private notes)
  console.log("Inserting collaborative notes and threads...");
  let totalNotesSeeded = 0;

  for (let idx = 0; idx < createdApplications.length; idx++) {
    const app = createdApplications[idx]!;
    const author = createdUsers.get(idx % 2 === 0 ? "usr_elena_sokolova" : "usr_priya_raman")!;

    // Top-level note
    const parentNote = await prisma.candidateNote.create({
      data: {
        applicationId: app.id,
        authorId: author.id,
        content: `Initial recruiter screen complete for ${app.candidate.fullName}. @Priya Raman candidate is open to hybrid SF schedule.`,
        mentions: fromList(["usr_priya_raman"]),
        isPrivate: idx < 6, // 6 private notes
        createdAt: new Date(now.getTime() - randInt(prng, 5, 20) * 24 * 3600 * 1000),
      },
    });
    totalNotesSeeded++;

    // Reply note
    if (idx < 22) {
      await prisma.candidateNote.create({
        data: {
          applicationId: app.id,
          authorId: "usr_priya_raman",
          parentId: parentNote.id,
          content: `Reviewed resume and match score. Strong profile, let's fast-track to technical round.`,
          mentions: fromList([]),
          isPrivate: parentNote.isPrivate,
          createdAt: new Date(parentNote.createdAt.getTime() + 3600 * 1000),
        },
      });
      totalNotesSeeded++;
    }
  }

  // 7. Insert Interview Events (12+ rows)
  console.log("Inserting interview events...");
  for (let idx = 0; idx < 14; idx++) {
    const app = technicalOrBeyond[idx % technicalOrBeyond.length]!;
    const isPast = idx < 10;
    const isCancelled = idx === 10;
    const isNoShow = idx === 11;

    const startOffsetHours = isPast ? -((12 - idx) * 24) : (idx - 9) * 24;
    const startTime = new Date(now.getTime() + startOffsetHours * 3600 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    await prisma.interviewEvent.create({
      data: {
        applicationId: app.id,
        title: idx % 2 === 0 ? "Deep-Dive Technical Screen" : "Systems Architecture & Design",
        stage: app.targetStage,
        startTime,
        endTime,
        meetingLink: "https://meet.google.com/vel-oce-ats",
        interviewerIds: fromList(["usr_kenji_nakamura", "usr_daniel_reyes"]),
        status: isCancelled
          ? "CANCELLED"
          : isNoShow
          ? "NO_SHOW"
          : isPast
          ? "COMPLETED"
          : "SCHEDULED",
      },
    });
  }

  // 8. Insert Automation Rules and Deliveries
  console.log("Inserting automation rules and webhook deliveries...");
  const ruleOffer = await prisma.automationRule.create({
    data: {
      name: "On OFFER, notify Slack #executive-hiring",
      trigger: "STAGE_ENTERED",
      conditions: jsonIn({ toStage: "OFFER", minScore: 75 }),
      actionType: "WEBHOOK",
      actionConfig: jsonIn({ url: "https://hooks.slack.com/services/mock/veloce/offer" }),
      isActive: true,
    },
  });

  const ruleSla = await prisma.automationRule.create({
    data: {
      name: "On SLA_BREACHED, escalate to Hiring Manager",
      trigger: "SLA_BREACHED",
      conditions: jsonIn({ minScore: 60 }),
      actionType: "WEBHOOK",
      actionConfig: jsonIn({ url: "https://hooks.slack.com/services/mock/veloce/sla" }),
      isActive: true,
    },
  });

  await prisma.webhookDelivery.create({
    data: {
      ruleId: ruleOffer.id,
      event: "STAGE_ENTERED",
      payload: jsonIn({ candidate: "Jessica Taylor", stage: "OFFER" }),
      status: "DELIVERED",
      attempts: 1,
      responseCode: 200,
    },
  });

  await prisma.webhookDelivery.create({
    data: {
      ruleId: ruleSla.id,
      event: "SLA_BREACHED",
      payload: jsonIn({ candidate: "Carlos Mendoza", daysOver: 3 }),
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(),
    },
  });

  // 9. Write SEED_RESET audit row
  await logAudit({
    entityType: "System",
    entityId: "seed-engine",
    action: "SEED_RESET",
    actorId: "usr_veloce_admin",
    metadata: {
      candidatesCount: 32,
      scorecardsCount: totalScorecardsSeeded,
      notesCount: totalNotesSeeded,
    },
  });

  // 10. Assert invariants
  await assertSeedInvariants();

  const elapsedMs = Date.now() - startTime;
  console.log(`✨ Veloce ATS seed completed idempotently in ${elapsedMs}ms!`);

  return { elapsedMs };
}
