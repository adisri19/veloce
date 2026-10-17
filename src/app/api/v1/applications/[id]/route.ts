import { withApi } from "@/lib/api";
import { getApplicationDossier } from "@/lib/services/candidates";

export const GET = withApi(async ({ params, actor }) => {
  const dossier = await getApplicationDossier(params.id!, actor);
  return { data: dossier };
});
