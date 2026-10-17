import { z } from "zod";
import { RecommendationSchema, StageSchema } from "./common";

export const ScorecardCreateSchema = z.object({
  stage: StageSchema.optional(),
  technicalScore: z.number().int().min(1, "Score must be 1-5").max(5, "Score must be 1-5"),
  architectureScore: z.number().int().min(1, "Score must be 1-5").max(5, "Score must be 1-5"),
  problemSolvingScore: z.number().int().min(1, "Score must be 1-5").max(5, "Score must be 1-5"),
  communicationScore: z.number().int().min(1, "Score must be 1-5").max(5, "Score must be 1-5"),
  cultureScore: z.number().int().min(1, "Score must be 1-5").max(5, "Score must be 1-5"),
  overallRecommendation: RecommendationSchema,
  strengths: z.string().min(20, "Strengths must be at least 20 characters"),
  concerns: z.string().min(20, "Concerns must be at least 20 characters"),
});

export type ScorecardCreateInput = z.infer<typeof ScorecardCreateSchema>;
