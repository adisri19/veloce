import { withApi } from "@/lib/api";
import { CandidateUpdateSchema } from "@/lib/validations/candidate";
import { getCandidateById } from "@/lib/services/candidates";
import { prisma } from "@/lib/db";
import { fromList, toList } from "@/lib/db-compat";
import { logAudit } from "@/lib/services/audit";

export const GET = withApi(async ({ params }) => {
  const candidate = await getCandidateById(params.id!);
  return { data: candidate };
});

export const PATCH = withApi(
  async ({ params, body, actor }) => {
    const existing = await prisma.candidate.findUnique({ where: { id: params.id! } });
    if (!existing) {
      throw new Error("Candidate not found");
    }

    const updated = await prisma.candidate.update({
      where: { id: params.id! },
      data: {
        ...(body.fullName ? { fullName: body.fullName } : {}),
        ...(body.email ? { email: body.email.toLowerCase() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        ...(body.currentCompany !== undefined ? { currentCompany: body.currentCompany } : {}),
        ...(body.currentTitle !== undefined ? { currentTitle: body.currentTitle } : {}),
        ...(body.experienceYears !== undefined ? { experienceYears: body.experienceYears } : {}),
        ...(body.expectedSalary !== undefined ? { expectedSalary: body.expectedSalary } : {}),
        ...(body.noticePeriodDays !== undefined ? { noticePeriodDays: body.noticePeriodDays } : {}),
        ...(body.linkedinUrl !== undefined ? { linkedinUrl: body.linkedinUrl || null } : {}),
        ...(body.githubUrl !== undefined ? { githubUrl: body.githubUrl || null } : {}),
        ...(body.skills ? { skills: fromList(body.skills) } : {}),
        ...(body.tags ? { tags: fromList(body.tags) } : {}),
      },
    });

    await logAudit({
      entityType: "Candidate",
      entityId: updated.id,
      action: "UPDATED",
      actorId: actor.id,
      metadata: { changes: Object.keys(body) },
    });

    return {
      data: {
        ...updated,
        skills: toList(updated.skills),
        tags: toList(updated.tags),
      },
    };
  },
  {
    schema: CandidateUpdateSchema,
  }
);
