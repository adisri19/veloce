import { withApi } from "@/lib/api";
import { JobCreateSchema } from "@/lib/validations/job";
import { getJobs, createJob } from "@/lib/services/jobs";

export const GET = withApi(async ({ req }) => {
  const url = new URL(req.url);
  const department = url.searchParams.get("department") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const jobs = await getJobs({ department, status });
  return { data: jobs };
});

export const POST = withApi(
  async ({ body, actor }) => {
    const job = await createJob(body, actor);
    return { data: job, status: 201 };
  },
  {
    schema: JobCreateSchema,
  }
);
