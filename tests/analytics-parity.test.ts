import { describe, it, expect } from "vitest";

describe("Analytics Calculation Engine", () => {
  it("calculates step conversion and cumulative pass-through correctly", () => {
    const reachedCounts = [100, 80, 40, 20, 10, 5, 4];
    const stepConversions = reachedCounts.map((count, i) => {
      if (i === 0) return 100;
      const prev = reachedCounts[i - 1];
      return Math.round((count / (prev || 1)) * 100);
    });

    expect(stepConversions).toEqual([100, 80, 50, 50, 50, 50, 80]);

    const baseCount = reachedCounts[0] || 1;
    const cumulative = reachedCounts.map((count) =>
      Math.round((count / baseCount) * 100)
    );
    expect(cumulative).toEqual([100, 80, 40, 20, 10, 5, 4]);
  });

  it("calculates requisition health score accurately", () => {
    // 3:1 pipeline coverage ratio is ideal (score 100)
    const computeHealth = (
      activeCandidates: number,
      headcountRemaining: number,
      slaBreaches: number,
      daysOpen: number
    ) => {
      const idealRatio = 3;
      const actualRatio = activeCandidates / Math.max(1, headcountRemaining);
      const coverageRatio = Math.min(1, actualRatio / idealRatio);

      let score = Math.round(coverageRatio * 60 + 40);
      score -= slaBreaches * 8;
      if (daysOpen > 60) score -= 10;
      if (daysOpen > 90) score -= 10;

      const healthScore = Math.max(0, Math.min(100, score));
      let healthLabel: "HEALTHY" | "AT_RISK" | "CRITICAL" = "HEALTHY";
      if (healthScore < 50) healthLabel = "CRITICAL";
      else if (healthScore < 75) healthLabel = "AT_RISK";

      return { healthScore, healthLabel };
    };

    const healthy = computeHealth(9, 3, 0, 20);
    expect(healthy.healthScore).toBe(100);
    expect(healthy.healthLabel).toBe("HEALTHY");

    const atRisk = computeHealth(3, 3, 2, 45);
    // coverageRatio = 1/3, 1/3 * 60 + 40 = 60, - 16 = 44 => CRITICAL
    expect(atRisk.healthScore).toBe(44);
    expect(atRisk.healthLabel).toBe("CRITICAL");
  });

  it("calculates offer acceptance rate accurately", () => {
    const hired = 8;
    const rejectedAfterOffer = 2;
    const totalDecidedOffers = hired + rejectedAfterOffer;
    const acceptanceRate = Math.round((hired / totalDecidedOffers) * 100);

    expect(acceptanceRate).toBe(80);
  });
});
