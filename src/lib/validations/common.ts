import { z } from "zod";

export const RoleTypeSchema = z.enum([
  "ADMIN",
  "HIRING_MANAGER",
  "INTERVIEWER",
  "RECRUITER",
]);
export type RoleType = z.infer<typeof RoleTypeSchema>;

export const StageSchema = z.enum([
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
]);
export type Stage = z.infer<typeof StageSchema>;

export const JobStatusSchema = z.enum(["OPEN", "PAUSED", "CLOSED"]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const RecommendationSchema = z.enum([
  "STRONG_NO",
  "NO",
  "NEUTRAL",
  "YES",
  "STRONG_YES",
]);
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const InterviewStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const WorkModeSchema = z.enum(["ONSITE", "HYBRID", "REMOTE"]);
export type WorkMode = z.infer<typeof WorkModeSchema>;

export const EmploymentTypeSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]);
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const RejectionReasonSchema = z.enum([
  "SKILLS_MISMATCH",
  "COMPENSATION",
  "CULTURE_FIT",
  "EXPERIENCE",
  "WITHDREW",
  "POSITION_FILLED",
  "NO_RESPONSE",
  "OTHER",
]);
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;

export const ALL_STAGES: Stage[] = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

export const ACTIVE_STAGES: Stage[] = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
];

export const STAGE_ORDER: Stage[] = ACTIVE_STAGES;

export const TERMINAL_STAGES: Stage[] = ["HIRED", "REJECTED", "WITHDRAWN"];

export const DEFAULT_SLA_DAYS: Record<Stage, number> = {
  SOURCED: 5,
  APPLIED: 3,
  SCREENING: 5,
  TECHNICAL_INTERVIEW: 7,
  SYSTEM_DESIGN: 7,
  OFFER: 5,
  HIRED: 0,
  REJECTED: 0,
  WITHDRAWN: 0,
};
