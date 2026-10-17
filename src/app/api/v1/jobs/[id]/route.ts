import { withApi } from "@/lib/api";
import { JobUpdateSchema } from "@/lib/validations/job";
import { getJobById, updateJob, deleteJob } from "@/lib/services/jobs";

export const GET = withApi(async ({ params }) => {
  const job = await getJobById(params.id!);
  return { data: job };
});

export const PATCH = withApi(
  async ({ params, body, actor }) => {
    const result = await updateJob(params.id!, body, actor);
    return {
      data: result.job,
      meta: result.rescoreSummary ? { rescoreSummary: result.rescoreSummary } : undefined,
    };
  },
  {
    schema: JobUpdateSchema,
  }
);

export const DELETE = withApi(async ({ params, actor }) => {
  await deleteJob(params.id!, actor);
  return;
});
