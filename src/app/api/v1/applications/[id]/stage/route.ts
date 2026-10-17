import { withApi } from "@/lib/api";
import { StageTransitionSchema } from "@/lib/validations/stage";
import { transitionStage } from "@/lib/services/stage-engine";

export const PATCH = withApi(
  async ({ params, body, actor }) => {
    const result = await transitionStage(params.id!, body, actor);
    return {
      data: result.application,
      meta: {
        transitionLog: result.transitionLog,
        warnings: result.warnings,
        undoToken: result.undoToken,
      },
    };
  },
  {
    schema: StageTransitionSchema,
  }
);
