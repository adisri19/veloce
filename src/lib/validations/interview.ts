import { z } from "zod";
import { StageSchema, InterviewStatusSchema } from "./common";

export const InterviewCreateSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    stage: StageSchema,
    startTime: z.string().datetime("Valid ISO datetime required for startTime"),
    endTime: z.string().datetime("Valid ISO datetime required for endTime"),
    meetingLink: z.string().url().optional().or(z.literal("")),
    interviewerIds: z.array(z.string()).min(1, "At least one interviewer must be assigned"),
    status: InterviewStatusSchema.default("SCHEDULED"),
  })
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    {
      message: "endTime must be after startTime",
      path: ["endTime"],
    }
  );

export const InterviewUpdateSchema = z
  .object({
    title: z.string().min(2).optional(),
    stage: StageSchema.optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    meetingLink: z.string().url().optional().or(z.literal("")),
    interviewerIds: z.array(z.string()).min(1).optional(),
    status: InterviewStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "endTime must be after startTime",
      path: ["endTime"],
    }
  );

export type InterviewCreateInput = z.infer<typeof InterviewCreateSchema>;
export type InterviewUpdateInput = z.infer<typeof InterviewUpdateSchema>;
