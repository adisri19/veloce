import { z } from "zod";

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

export const AnalyticsDashboardQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  jobIds: z.preprocess(stringArrayPreprocessor, z.array(z.string()).optional()),
});

export type AnalyticsDashboardQuery = z.infer<typeof AnalyticsDashboardQuerySchema>;
