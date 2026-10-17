import { withApi } from "@/lib/api";
import { InterviewCreateSchema } from "@/lib/validations/interview";
import { scheduleInterview } from "@/lib/services/interviews";
import { prisma } from "@/lib/db";
import { toList } from "@/lib/db-compat";

export const GET = withApi(async ({ params }) => {
  const interviews = await prisma.interviewEvent.findMany({
    where: { applicationId: params.id! },
    orderBy: { startTime: "asc" },
  });
  return {
    data: interviews.map((iv) => ({
      ...iv,
      interviewerIds: toList(iv.interviewerIds),
    })),
  };
});

export const POST = withApi(
  async ({ params, body, actor }) => {
    const result = await scheduleInterview(params.id!, body as any, actor);
    return {
      data: result.interview,
      meta: { warnings: result.warnings },
      status: 201,
    };
  },
  {
    schema: InterviewCreateSchema,
  }
);
