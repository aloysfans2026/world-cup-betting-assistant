import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { buildAnalysis } from "./recommendations";

describe("recommendations", () => {
  const withActionableCount = (count: number) =>
    todayMatches.map((match, index) => (index < count ? match : { ...match, odds: undefined }));

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

  it("uses fixed sample stakes for three parlay plans when at least four picks are available", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.parlayPlans.map((plan) => plan.sampleStake)).toEqual([20, 20, 10]);
    expect(analysis.parlayPlans.map((plan) => plan.type)).toEqual(["2串1", "3串1", "4串1"]);
    analysis.parlayPlans.forEach((plan) => {
      const requiredPickCount = Number(plan.type[0]);

      expect(plan.picks).toHaveLength(requiredPickCount);
    });
  });

  it("only uses visible safe or value recommendations in parlay plans", () => {
    const analysis = buildAnalysis(todayMatches);
    const visibleMatchIds = new Set([...analysis.safePicks, ...analysis.valuePicks].map((pick) => pick.match.id));
    const parlayMatchIds = analysis.parlayPlans.flatMap((plan) => plan.picks.map((pick) => pick.match.id));

    expect(parlayMatchIds.every((id) => visibleMatchIds.has(id))).toBe(true);
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
    expect(analysis.trapMatches.map((item) => item.match.id)).toEqual(expect.arrayContaining([...hiddenMatchIds]));
  });

  it.each([
    [0, []],
    [1, []],
    [2, ["2串1"]],
    [3, ["2串1", "3串1"]],
  ] as const)("only emits available parlay plans for %i unique actionable picks", (actionableCount, expectedTypes) => {
    const analysis = buildAnalysis(withActionableCount(actionableCount));

    expect(analysis.parlayPlans.map((plan) => plan.type)).toEqual(expectedTypes);
    analysis.parlayPlans.forEach((plan) => {
      const requiredPickCount = Number(plan.type[0]);

      expect(plan.picks).toHaveLength(requiredPickCount);
    });
  });
});
