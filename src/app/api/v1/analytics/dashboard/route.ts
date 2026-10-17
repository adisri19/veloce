import { withApi } from "@/lib/api";
import { AnalyticsDashboardQuerySchema } from "@/lib/validations/analytics";
import { getDashboardAnalytics } from "@/lib/services/analytics";

export const dynamic = "force-dynamic";

export const GET = withApi(
  async ({ query }) => {
    const data = await getDashboardAnalytics({
      from: query.from,
      to: query.to,
      jobIds: query.jobIds as string[] | undefined,
    });
    return { data };
  },
  {
    querySchema: AnalyticsDashboardQuerySchema,
  }
);
