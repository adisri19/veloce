import { withApi } from "@/lib/api";
import { ParseAndScoreSchema } from "@/lib/validations/candidate";
import { parseAndScoreCandidate } from "@/lib/services/candidates";

export const POST = withApi(
  async ({ body, actor }) => {
    const result = await parseAndScoreCandidate(body as any, actor);
    return { data: result };
  },
  {
    schema: ParseAndScoreSchema,
  }
);
