import { z } from "zod";
import { StageSchema, Stage } from "./common";

// Helper to coerce string or array of strings into string[]
const stringArrayPreprocessor = (val: unknown): string[] | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  if (Array.isArray(val)) {
    return val.flatMap((item) =>
      typeof item === "string" ? item.split(",").map((s) => s.trim()).filter(Boolean) : []
    );
  }
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
};

const booleanPreprocessor = (val: unknown): boolean | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "boolean") return val;
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return undefined;
};

const numberPreprocessor = (val: unknown): number | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

export const SORT_FIELDS_WHITELIST = [
  "aiMatchScore",
  "stageEnteredAt",
  "appliedAt",
  "candidate.fullName",
  "candidate.experienceYears",
  "candidate.expectedSalary",
  "kanbanOrder",
] as const;

export type SortField = (typeof SORT_FIELDS_WHITELIST)[number];

export function parseSortParam(sortStr?: string): { field: SortField; direction: "asc" | "desc" }[] {
  if (!sortStr) return [];
  const clauses = sortStr.split(",").map((c) => c.trim()).filter(Boolean);
  const result: { field: SortField; direction: "asc" | "desc" }[] = [];

  for (const clause of clauses) {
    const parts = clause.split(":");
    const field = parts[0]?.trim();
    const dir = (parts[1]?.trim().toLowerCase() || "asc") as "asc" | "desc";

    if (!field || !(SORT_FIELDS_WHITELIST as readonly string[]).includes(field)) {
      throw new Error(`Invalid sort field: ${field}. Must be one of: ${SORT_FIELDS_WHITELIST.join(", ")}`);
    }
    if (dir !== "asc" && dir !== "desc") {
      throw new Error(`Invalid sort direction: ${dir}. Must be 'asc' or 'desc'`);
    }

    result.push({ field: field as SortField, direction: dir });
  }

  return result;
}

export const ApplicationQuerySchema = z.object({
  q: z.string().max(200, "Search query max length is 200").optional(),
  stages: z.preprocess(stringArrayPreprocessor, z.array(StageSchema).optional()),
  jobIds: z.preprocess(stringArrayPreprocessor, z.array(z.string()).optional()),
  departments: z.preprocess(stringArrayPreprocessor, z.array(z.string()).optional()),
  minScore: z.preprocess(
    numberPreprocessor,
    z.number().int().min(0, "minScore must be >= 0").max(100, "minScore must be <= 100").optional()
  ),
  maxExperience: z.preprocess(
    numberPreprocessor,
    z.number().int().min(0, "maxExperience must be >= 0").optional()
  ),
  sources: z.preprocess(stringArrayPreprocessor, z.array(z.string()).optional()),
  tags: z.preprocess(stringArrayPreprocessor, z.array(z.string()).optional()),
  slaBreachedOnly: z.preprocess(booleanPreprocessor, z.boolean().optional()),
  includeArchived: z.preprocess(booleanPreprocessor, z.boolean().default(false)),
  sort: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          parseSortParam(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: `Sort must contain valid fields from [${SORT_FIELDS_WHITELIST.join(", ")}] with direction :asc or :desc`,
      }
    ),
  limit: z.preprocess(
    numberPreprocessor,
    z.number().int().min(1).max(100).default(50)
  ),
  cursor: z.string().optional(),
  offset: z.preprocess(
    numberPreprocessor,
    z.number().int().min(0).optional()
  ),
});

export type ApplicationQuery = z.infer<typeof ApplicationQuerySchema>;
