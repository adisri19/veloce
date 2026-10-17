import { describe, it, expect } from "vitest";
import { computeAiMatchScore, JobRequirements, CandidateProfile } from "../src/lib/scoring-engine";

describe("Scoring Engine", () => {
  const sampleJob: JobRequirements = {
    title: "Senior Backend Engineer, Platform",
    requiredSkills: ["TypeScript", "PostgreSQL", "Kubernetes", "Node.js"],
    niceToHaveSkills: ["GraphQL", "Docker"],
    domainKeywords: ["distributed systems", "high availability", "microservices"],
    minExperienceYears: 5,
    maxExperienceYears: 9,
    salaryMin: 180000,
    salaryMax: 220000,
  };

  it("calculates high score for well-matched candidate within band", () => {
    const candidate: CandidateProfile = {
      skills: ["TypeScript", "PostgreSQL", "Kubernetes", "Node.js", "Docker", "GraphQL"],
      experienceYears: 6,
      expectedSalary: 210000,
      noticePeriodDays: 30,
      currentTitle: "Senior Platform Engineer",
      currentCompany: "Stripe",
      parsedResumeText: "Built distributed systems and microservices with high availability.",
    };

    const breakdown = computeAiMatchScore(candidate, sampleJob);

    expect(breakdown.total).toBeGreaterThanOrEqual(85);
    expect(breakdown.components.skills.score).toBe(100);
    expect(breakdown.components.experience.score).toBe(100);
    expect(breakdown.components.compensation.score).toBe(100);
    expect(breakdown.matchedSkills).toContain("TypeScript");
    expect(breakdown.missingSkills).toHaveLength(0);
    expect(breakdown.riskFlags).not.toContain("UNDER_EXPERIENCED");
  });

  it("penalizes under-experience and missing core skills", () => {
    const candidate: CandidateProfile = {
      skills: ["JavaScript", "React"],
      experienceYears: 2, // 3 years below 5
      expectedSalary: 190000,
      noticePeriodDays: 15,
      currentTitle: "Junior Frontend Developer",
      currentCompany: "Acme Corp",
      parsedResumeText: "Frontend development with React and CSS.",
    };

    const breakdown = computeAiMatchScore(candidate, sampleJob);

    expect(breakdown.total).toBeLessThan(60);
    expect(breakdown.riskFlags).toContain("UNDER_EXPERIENCED");
    expect(breakdown.riskFlags.some((rf) => rf.startsWith("MISSING_CORE_SKILL"))).toBe(true);
    expect(breakdown.components.experience.score).toBeLessThanOrEqual(50);
  });

  it("penalizes salary above band and flags notice period > 60 days", () => {
    const candidate: CandidateProfile = {
      skills: ["TypeScript", "PostgreSQL", "Kubernetes", "Node.js"],
      experienceYears: 7,
      expectedSalary: 290000, // > 1.25 * 220000 (275000)
      noticePeriodDays: 90,
      currentTitle: "Senior Backend Engineer",
      currentCompany: "MegaCorp",
      parsedResumeText: "Distributed systems architecture.",
    };

    const breakdown = computeAiMatchScore(candidate, sampleJob);

    expect(breakdown.components.compensation.score).toBe(10);
    expect(breakdown.riskFlags).toContain("EXPECTED_SALARY_ABOVE_BAND");
    expect(breakdown.riskFlags).toContain("NOTICE_PERIOD_GT_60D");
  });

  it("applies soft penalty for overqualification", () => {
    const candidate: CandidateProfile = {
      skills: ["TypeScript", "PostgreSQL", "Kubernetes", "Node.js"],
      experienceYears: 18, // 9 years above max
      expectedSalary: 220000,
      noticePeriodDays: 30,
      currentTitle: "Distinguished Engineer",
      currentCompany: "BigTech",
      parsedResumeText: "Distributed systems and high availability microservices.",
    };

    const breakdown = computeAiMatchScore(candidate, sampleJob);

    expect(breakdown.components.experience.score).toBeGreaterThanOrEqual(40);
    expect(breakdown.components.experience.score).toBeLessThan(100);
    expect(breakdown.riskFlags).toContain("OVERQUALIFIED");
  });
});
