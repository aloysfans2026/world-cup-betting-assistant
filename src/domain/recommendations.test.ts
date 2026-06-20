import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { buildAnalysis } from "./recommendations";

describe("recommendations", () => {
  it("builds stable, value, trap, and parlay sections", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.safePicks).toHaveLength(3);
    expect(analysis.valuePicks).toHaveLength(3);
    expect(analysis.trapMatches.length).toBeGreaterThanOrEqual(1);
    expect(analysis.parlayPlans).toHaveLength(3);
  });

  it("puts low-risk high-confidence picks first in the safe list", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.safePicks[0].score.risk).toBe("低");
    expect(analysis.safePicks[0].score.confidence).toBeGreaterThanOrEqual(
      analysis.safePicks[1].score.confidence,
    );
    expect(analysis.safePicks.some((item) => item.title.includes("加拿大"))).toBe(true);
  });

  it("flags Brazil vs Haiti as a trap match", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.trapMatches.some((item) => item.match.id === "brazil-haiti")).toBe(true);
  });

  it("uses fixed sample stakes for three parlay plans", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.parlayPlans.map((plan) => plan.sampleStake)).toEqual([20, 20, 10]);
    expect(analysis.parlayPlans.map((plan) => plan.type)).toEqual(["2串1", "3串1", "4串1"]);
  });

  it("excludes no-pick scores from safe, value, and parlay recommendations", () => {
    const matchesWithInvalidOdds = todayMatches.map((match, index) => {
      if (index === 0) return { ...match, odds: undefined };
      if (index === 1 && match.odds) {
        return { ...match, odds: { ...match.odds, recommendedOdds: 1 } };
      }

      return match;
    });

    const analysis = buildAnalysis(matchesWithInvalidOdds);
    const hiddenMatchIds = new Set(["canada-morocco", "switzerland-serbia"]);
    const visiblePickIds = [
      ...analysis.safePicks,
      ...analysis.valuePicks,
      ...analysis.parlayPlans.flatMap((plan) => plan.picks),
    ].map((item) => item.match.id);

    expect(visiblePickIds.some((id) => hiddenMatchIds.has(id))).toBe(false);
  });
});
