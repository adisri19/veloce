import { z } from "zod";
import { StageSchema, RejectionReasonSchema } from "./common";

export const StageTransitionSchema = z
  .object({
    toStage: StageSchema,
    beforeId: z.string().optional(),
    afterId: z.string().optional(),
    reason: z.string().optional(),
    rejectionReason: RejectionReasonSchema.optional(),
    rejectionNotes: z.string().optional(),
    expectedVersion: z.number().int().optional(),
  })
  .refine(
    (data) => {
      if (data.toStage === "REJECTED" && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: "rejectionReason is required when moving to REJECTED stage",
      path: ["rejectionReason"],
    }
  );

export type StageTransitionInput = z.infer<typeof StageTransitionSchema>;
