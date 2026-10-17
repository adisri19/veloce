import { withApi } from "@/lib/api";
import { globalSearch } from "@/lib/services/search";

export const dynamic = "force-dynamic";

export const GET = withApi(async ({ req }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const result = await globalSearch(q);
  return { data: result };
});
