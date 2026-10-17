import { withApi } from "@/lib/api";
import { CandidateCreateSchema } from "@/lib/validations/candidate";
import { getCandidates, createCandidate } from "@/lib/services/candidates";

export const GET = withApi(async ({ req }) => {
  const url = new URL(req.url);
  const source = url.searchParams.get("source") || undefined;
  const tag = url.searchParams.get("tag") || undefined;
  const candidates = await getCandidates({ source, tag });
  return { data: candidates };
});

export const POST = withApi(
  async ({ body, actor }) => {
    const result = await createCandidate(body, actor);
    return { data: result, status: 201 };
  },
  {
    schema: CandidateCreateSchema,
  }
);
