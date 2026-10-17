import { z } from "zod";
import {
  WorkModeSchema,
  EmploymentTypeSchema,
  JobStatusSchema,
  PrioritySchema,
  DEFAULT_SLA_DAYS,
} from "./common";

const slaRecordSchema = z.record(z.string(), z.number().int().min(0)).default(DEFAULT_SLA_DAYS);

export const JobCreateSchema = z
  .object({
    code: z.string().optional(),
    title: z.string().min(2, "Title must be at least 2 characters"),
    department: z.string().min(1, "Department is required"),
    location: z.string().min(1, "Location is required"),
    workMode: WorkModeSchema.default("HYBRID"),
    employmentType: EmploymentTypeSchema.default("FULL_TIME"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    requiredSkills: z.array(z.string()).min(1, "At least 1 required skill is needed"),
    niceToHaveSkills: z.array(z.string()).default([]),
    domainKeywords: z.array(z.string()).default([]),
    minExperienceYears: z.number().int().min(0).default(0),
    maxExperienceYears: z.number().int().min(0).default(15),
    salaryMin: z.number().int().min(0, "Salary min must be >= 0"),
    salaryMax: z.number().int().min(0, "Salary max must be >= 0"),
    currency: z.string().default("USD"),
    headcountTotal: z.number().int().min(1, "Headcount total must be at least 1").default(1),
    status: JobStatusSchema.default("OPEN"),
    priority: PrioritySchema.default("MEDIUM"),
    slaDaysPerStage: slaRecordSchema,
    hiringManagerId: z.string().min(1, "Hiring manager is required"),
  })
  .refine((data) => data.maxExperienceYears >= data.minExperienceYears, {
    message: "maxExperienceYears must be greater than or equal to minExperienceYears",
    path: ["maxExperienceYears"],
  })
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message: "salaryMax must be greater than or equal to salaryMin",
    path: ["salaryMax"],
  });

export const JobUpdateSchema = z
  .object({
    title: z.string().min(2).optional(),
    department: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    workMode: WorkModeSchema.optional(),
    employmentType: EmploymentTypeSchema.optional(),
    description: z.string().min(10).optional(),
    requiredSkills: z.array(z.string()).min(1).optional(),
    niceToHaveSkills: z.array(z.string()).optional(),
    domainKeywords: z.array(z.string()).optional(),
    minExperienceYears: z.number().int().min(0).optional(),
    maxExperienceYears: z.number().int().min(0).optional(),
    salaryMin: z.number().int().min(0).optional(),
    salaryMax: z.number().int().min(0).optional(),
    currency: z.string().optional(),
    headcountTotal: z.number().int().min(1).optional(),
    status: JobStatusSchema.optional(),
    priority: PrioritySchema.optional(),
    slaDaysPerStage: slaRecordSchema.optional(),
    hiringManagerId: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.minExperienceYears !== undefined && data.maxExperienceYears !== undefined) {
        return data.maxExperienceYears >= data.minExperienceYears;
      }
      return true;
    },
    {
      message: "maxExperienceYears must be >= minExperienceYears",
      path: ["maxExperienceYears"],
    }
  )
  .refine(
    (data) => {
      if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
        return data.salaryMax >= data.salaryMin;
      }
      return true;
    },
    {
      message: "salaryMax must be >= salaryMin",
      path: ["salaryMax"],
    }
  );

export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
