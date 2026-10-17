import { z } from "zod";

export const CandidateCreateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  timezone: z.string().optional(),
  currentCompany: z.string().optional(),
  currentTitle: z.string().optional(),
  experienceYears: z.number().int().min(0).default(0),
  expectedSalary: z.number().int().min(0).optional(),
  noticePeriodDays: z.number().int().min(0).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  resumeUrl: z.string().url().optional().or(z.literal("")),
  parsedResumeText: z.string().default(""),
  skills: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  source: z.string().default("Inbound"),
  jobId: z.string().optional(), // If provided, creates Application immediately
});

export const CandidateUpdateSchema = CandidateCreateSchema.partial();

export const ParseAndScoreSchema = z
  .object({
    jobId: z.string().min(1, "jobId is required"),
    resumeText: z.string().optional(),
    structured: z
      .object({
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        currentTitle: z.string().optional(),
        currentCompany: z.string().optional(),
        skills: z.array(z.string()).optional(),
        experienceYears: z.number().int().min(0).optional(),
        expectedSalary: z.number().int().min(0).optional(),
        noticePeriodDays: z.number().int().min(0).optional(),
        source: z.string().optional(),
        location: z.string().optional(),
        linkedinUrl: z.string().optional(),
        githubUrl: z.string().optional(),
      })
      .optional(),
    persist: z.boolean().default(false),
    applicationId: z.string().optional(),
  })
  .refine((data) => Boolean(data.resumeText || data.structured), {
    message: "At least one of resumeText or structured data must be provided",
  });

export type CandidateCreateInput = z.infer<typeof CandidateCreateSchema>;
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateSchema>;
export type ParseAndScoreInput = z.infer<typeof ParseAndScoreSchema>;
