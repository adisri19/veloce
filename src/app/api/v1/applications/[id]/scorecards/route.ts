import { withApi } from "@/lib/api";
import { ScorecardCreateSchema } from "@/lib/validations/scorecard";
import { submitScorecard } from "@/lib/services/scorecards";

export const POST = withApi(
  async ({ params, body, actor }) => {
    const scorecard = await submitScorecard(params.id!, body, actor);
    return { data: scorecard, status: 201 };
  },
  {
    schema: ScorecardCreateSchema,
  }
);
