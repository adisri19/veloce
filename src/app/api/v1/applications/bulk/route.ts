import { withApi } from "@/lib/api";
import { BulkOperationSchema } from "@/lib/validations/bulk";
import { executeBulkOperation } from "@/lib/services/bulk";

export const POST = withApi(
  async ({ body, actor }) => {
    const result = await executeBulkOperation(body, actor);
    return { data: result };
  },
  {
    schema: BulkOperationSchema,
  }
);
