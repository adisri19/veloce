import { z } from "zod";
import { withApi, RuleViolationError, ForbiddenError } from "@/lib/api";
import { runSeed } from "@/lib/seed/run-seed";
import { prisma } from "@/lib/db";

const resetBodySchema = z.object({
  confirm: z.string().refine((val) => val === "RESET", {
    message: "confirm field must be exactly 'RESET'",
  }),
});

// Simple in-memory token bucket rate limiter: 1 req per 5s per IP
const rateLimits = new Map<string, number>();

export const POST = withApi(
  async ({ actor, req }) => {
    // Only ADMIN or demo user can trigger
    if (actor.role !== "ADMIN" && actor.role !== "RECRUITER") {
      throw new ForbiddenError("Only ADMIN or Technical Recruiter can trigger seed reset");
    }

    const ip = req.headers.get("x-forwarded-for") || "local";
    const now = Date.now();
    const last = rateLimits.get(ip) || 0;
    if (now - last < 5000) {
      throw new RuleViolationError("Rate limit exceeded: please wait 5 seconds between resets");
    }
    rateLimits.set(ip, now);

    const { elapsedMs } = await runSeed({ reset: true });

    const [users, jobs, candidates, applications, transitions, scorecards, notes] =
      await Promise.all([
        prisma.user.count(),
        prisma.jobRequisition.count(),
        prisma.candidate.count(),
        prisma.application.count(),
        prisma.stageTransitionLog.count(),
        prisma.scorecard.count(),
        prisma.candidateNote.count(),
      ]);

    return {
      data: {
        success: true,
        elapsedMs,
        counts: {
          users,
          jobs,
          candidates,
          applications,
          transitions,
          scorecards,
          notes,
        },
      },
    };
  },
  {
    schema: resetBodySchema,
  }
);
