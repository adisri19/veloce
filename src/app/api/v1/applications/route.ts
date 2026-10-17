import { withApi } from "@/lib/api";
import { ApplicationQuerySchema } from "@/lib/validations/application-query";
import { getApplications } from "@/lib/services/applications";

export const dynamic = "force-dynamic";

export const GET = withApi(
  async ({ query }) => {
    const result = await getApplications(query);
    return {
      data: result.items,
      meta: {
        facets: result.facets,
        totals: result.totals,
        nextCursor: result.meta.nextCursor,
        hasMore: result.meta.hasMore,
      },
    };
  },
  {
    querySchema: ApplicationQuerySchema,
  }
);
