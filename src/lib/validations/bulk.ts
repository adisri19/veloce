import { z } from "zod";
import { StageSchema, RejectionReasonSchema } from "./common";

export const BulkOperationSchema = z.discriminatedUnion("op", [
  z.object({
    ids: z.array(z.string()).min(1, "At least 1 id required").max(200, "Max 200 items per bulk operation"),
    op: z.literal("MOVE_STAGE"),
    payload: z.object({
      toStage: StageSchema,
      reason: z.string().optional(),
    }),
  }),
  z.object({
    ids: z.array(z.string()).min(1, "At least 1 id required").max(200, "Max 200 items per bulk operation"),
    op: z.literal("REJECT"),
    payload: z.object({
      rejectionReason: RejectionReasonSchema,
      rejectionNotes: z.string().optional(),
    }),
  }),
  z.object({
    ids: z.array(z.string()).min(1, "At least 1 id required").max(200, "Max 200 items per bulk operation"),
    op: z.literal("ADD_TAGS"),
    payload: z.object({
      tags: z.array(z.string()).min(1, "At least 1 tag required"),
    }),
  }),
  z.object({
    ids: z.array(z.string()).min(1, "At least 1 id required").max(200, "Max 200 items per bulk operation"),
    op: z.literal("REMOVE_TAGS"),
    payload: z.object({
      tags: z.array(z.string()).min(1, "At least 1 tag required"),
    }),
  }),
  z.object({
    ids: z.array(z.string()).min(1, "At least 1 id required").max(200, "Max 200 items per bulk operation"),
    op: z.literal("ARCHIVE"),
    payload: z
      .object({
        reason: z.string().optional(),
      })
      .optional()
      .default({}),
  }),
  z.object({
    ids: z.array(z.string()).min(1, "At least 1 id required").max(200, "Max 200 items per bulk operation"),
    op: z.literal("UNARCHIVE"),
    payload: z
      .object({
        reason: z.string().optional(),
      })
      .optional()
      .default({}),
  }),
]);

export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;
