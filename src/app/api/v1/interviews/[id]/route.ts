import { withApi } from "@/lib/api";
import { InterviewUpdateSchema } from "@/lib/validations/interview";
import { updateInterview } from "@/lib/services/interviews";

export const PATCH = withApi(
  async ({ params, body, actor }) => {
    const updated = await updateInterview(params.id!, body, actor);
    return { data: updated };
  },
  {
    schema: InterviewUpdateSchema,
  }
);
