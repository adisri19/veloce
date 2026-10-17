import { z } from "zod";

export const NoteCreateSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
  mentions: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(false),
  parentId: z.string().optional(),
});

export type NoteCreateInput = z.infer<typeof NoteCreateSchema>;
