import { withApi } from "@/lib/api";
import { drainPendingDeliveries } from "@/lib/services/automations";

export const POST = withApi(async () => {
  const result = await drainPendingDeliveries();
  return { data: result };
});
