import { normalizeSkill } from "./skills-dictionary";

export interface JobRequirements {
  title: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  domainKeywords: string[];
  minExperienceYears: number;
  maxExperienceYears: number;
  salaryMin: number;
  salaryMax: number;
}

export interface CandidateProfile {
  skills: string[];
  experienceYears: number;
  expectedSalary?: number | null;
  noticePeriodDays?: number | null;
  currentTitle?: string | null;
  currentCompany?: string | null;
  parsedResumeText?: string | null;
}

export interface ScoreComponent {
  score: number;
  weight: number;
}

export interface AiScoreBreakdown {
  total: number;
  components: {
    skills: ScoreComponent;
    experience: ScoreComponent;
    compensation: ScoreComponent;
    domain: ScoreComponent;
  };
  matchedSkills: string[];
  missingSkills: string[];
  niceToHaveMatched: string[];
  riskFlags: string[];
  experienceDelta: {
    years: number;
    bandMin: number;
    bandMax: number;
    delta: number;
  };
  compensationFit: {
    expected: number | null;
    bandMin: number;
    bandMax: number;
    status: "WITHIN_BAND" | "ABOVE_BAND" | "BELOW_BAND" | "UNKNOWN";
  };
  summary: string;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
  "will", "with", "engineer", "senior", "staff", "lead", "principal", "junior"
]);

function tokenizeText(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
  return new Set(words);
}

export function computeAiMatchScore(
  candidate: CandidateProfile,
  job: JobRequirements
): AiScoreBreakdown {
  // Normalize candidate skills
  const normalizedCandidateSkills = new Set(
    (candidate.skills || []).map((s) => normalizeSkill(s).toLowerCase())
  );

  // 1. S_skills (40%)
  const required = job.requiredSkills || [];
  const nice = job.niceToHaveSkills || [];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of required) {
    const norm = normalizeSkill(reqSkill).toLowerCase();
    if (normalizedCandidateSkills.has(norm)) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const niceToHaveMatched: string[] = [];
  for (const niceSkill of nice) {
    const norm = normalizeSkill(niceSkill).toLowerCase();
    if (normalizedCandidateSkills.has(norm)) {
      niceToHaveMatched.push(niceSkill);
    }
  }

  const reqCov = required.length > 0 ? matchedSkills.length / required.length : 1;
  const niceCov = nice.length > 0 ? niceToHaveMatched.length / Math.max(1, nice.length) : 1;
  const rawSkillsScore = 100 * (0.85 * reqCov + 0.15 * niceCov);
  const sSkills = Math.min(100, Math.max(0, Math.round(rawSkillsScore)));

  // 2. S_exp (25%)
  const y = candidate.experienceYears ?? 0;
  const lo = job.minExperienceYears;
  const hi = job.maxExperienceYears;

  let sExp = 100;
  let expDelta = 0;
  if (y < lo) {
    expDelta = y - lo; // negative
    sExp = Math.max(0, 100 - 22 * (lo - y));
  } else if (y > hi) {
    expDelta = y - hi; // positive
    sExp = Math.max(40, 100 - 8 * (y - hi));
  }
  sExp = Math.round(sExp);

  // 3. S_comp (15%)
  const expectedSalary = candidate.expectedSalary;
  let sComp = 70; // Neutral default if absent
  let compStatus: "WITHIN_BAND" | "ABOVE_BAND" | "BELOW_BAND" | "UNKNOWN" = "UNKNOWN";

  if (expectedSalary !== null && expectedSalary !== undefined && expectedSalary > 0) {
    if (expectedSalary <= job.salaryMax) {
      sComp = 100;
      compStatus = expectedSalary >= job.salaryMin ? "WITHIN_BAND" : "BELOW_BAND";
    } else if (expectedSalary <= 1.1 * job.salaryMax) {
      sComp = 70;
      compStatus = "ABOVE_BAND";
    } else if (expectedSalary <= 1.25 * job.salaryMax) {
      sComp = 40;
      compStatus = "ABOVE_BAND";
    } else {
      sComp = 10;
      compStatus = "ABOVE_BAND";
    }
  }

  // 4. S_domain (20%)
  const domainKeywords = job.domainKeywords || [];
  const textCorpus = [
    candidate.parsedResumeText || "",
    candidate.currentTitle || "",
    candidate.currentCompany || "",
    ...(candidate.skills || []),
  ].join(" ");
  const corpusTokens = tokenizeText(textCorpus);

  let matchedDomainCount = 0;
  for (const kw of domainKeywords) {
    const kwTokens = tokenizeText(kw);
    let allTokensMatch = true;
    for (const token of Array.from(kwTokens)) {
      if (!corpusTokens.has(token)) {
        allTokensMatch = false;
        break;
      }
    }
    if (allTokensMatch && kwTokens.size > 0) {
      matchedDomainCount++;
    }
  }

  let domainScore = domainKeywords.length > 0 ? (matchedDomainCount / domainKeywords.length) * 100 : 100;

  // Title similarity bonus +10 if currentTitle shares >=1 non-stopword with job.title
  if (candidate.currentTitle && job.title) {
    const titleTokens = tokenizeText(job.title);
    const candTitleTokens = tokenizeText(candidate.currentTitle);
    let sharesNonStopword = false;
    for (const t of Array.from(candTitleTokens)) {
      if (!STOP_WORDS.has(t) && titleTokens.has(t)) {
        sharesNonStopword = true;
        break;
      }
    }
    if (sharesNonStopword) {
      domainScore = Math.min(100, domainScore + 10);
    }
  }
  const sDomain = Math.min(100, Math.max(0, Math.round(domainScore)));

  // Total AI Match Score
  const totalRaw = 0.4 * sSkills + 0.25 * sExp + 0.15 * sComp + 0.2 * sDomain;
  const total = Math.min(100, Math.max(0, Math.round(totalRaw)));

  // Risk flags
  const riskFlags: string[] = [];
  if (expectedSalary && expectedSalary > job.salaryMax) {
    riskFlags.push("EXPECTED_SALARY_ABOVE_BAND");
  }
  if (candidate.noticePeriodDays && candidate.noticePeriodDays > 60) {
    riskFlags.push("NOTICE_PERIOD_GT_60D");
  }
  if (y > hi + 3) {
    riskFlags.push("OVERQUALIFIED");
  }
  if (y < lo) {
    riskFlags.push("UNDER_EXPERIENCED");
  }
  for (const missing of missingSkills) {
    riskFlags.push(`MISSING_CORE_SKILL:${missing}`);
  }

  // Summary sentence
  const matchedCount = matchedSkills.length;
  const totalReq = required.length;
  const summary = `Candidate matches ${matchedCount}/${totalReq} core skills with ${y} years experience for ${job.title} (${sSkills}% skills fit, ${sExp}% experience fit).`;

  return {
    total,
    components: {
      skills: { score: sSkills, weight: 0.4 },
      experience: { score: sExp, weight: 0.25 },
      compensation: { score: sComp, weight: 0.15 },
      domain: { score: sDomain, weight: 0.2 },
    },
    matchedSkills,
    missingSkills,
    niceToHaveMatched,
    riskFlags,
    experienceDelta: {
      years: y,
      bandMin: lo,
      bandMax: hi,
      delta: expDelta,
    },
    compensationFit: {
      expected: expectedSalary ?? null,
      bandMin: job.salaryMin,
      bandMax: job.salaryMax,
      status: compStatus,
    },
    summary,
  };
}
