import { NextResponse } from "next/server";
import { ApplicationQuerySchema } from "@/lib/validations/application-query";
import { getApplications } from "@/lib/services/applications";
import { toCsvString } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryObj: Record<string, unknown> = {};
    url.searchParams.forEach((val, key) => {
      if (key.endsWith("[]")) {
        const cleanKey = key.slice(0, -2);
        if (!queryObj[cleanKey]) queryObj[cleanKey] = [];
        (queryObj[cleanKey] as string[]).push(val);
      } else {
        queryObj[key] = val;
      }
    });

    const parsedQuery = ApplicationQuerySchema.parse({
      ...queryObj,
      limit: 1000, // Export up to 1000 in batch
    });

    const result = await getApplications(parsedQuery);

    const flattened = result.items.map((item) => ({
      ID: item.id,
      CandidateCode: item.candidate.publicCode,
      FullName: item.candidate.fullName,
      Email: item.candidate.email,
      CurrentTitle: item.candidate.currentTitle || "",
      CurrentCompany: item.candidate.currentCompany || "",
      ExperienceYears: item.candidate.experienceYears,
      ExpectedSalary: item.candidate.expectedSalary || "",
      Source: item.candidate.source,
      JobCode: item.job.code,
      JobTitle: item.job.title,
      Department: item.job.department,
      CurrentStage: item.currentStage,
      AiMatchScore: item.aiMatchScore,
      DaysInStage: item.daysInStage,
      SlaDays: item.slaDays,
      SlaState: item.slaState,
      ScorecardCount: item.scorecardCount,
      AvgScorecard: item.avgScorecard || "",
      StageEnteredAt: item.stageEnteredAt,
    }));

    const csvContent = toCsvString(flattened);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="veloce-applications.csv"',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: (err as Error).message } },
      { status: 500 }
    );
  }
}
