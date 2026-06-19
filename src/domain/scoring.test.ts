import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { calculateMatchScore, impliedProbability } from "./scoring";
import type { Match } from "./types";

describe("scoring", () => {
  it("converts decimal odds to implied probability", () => {
    expect(impliedProbability(2)).toBe(50);
    expect(impliedProbability(1.25)).toBe(80);
    expect(impliedProbability(0)).toBe(0);
    expect(impliedProbability(-2)).toBe(0);
    expect(impliedProbability(Number.NaN)).toBe(0);
  });

  it("scores Canada vs Morocco as a low-risk high-confidence pick", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.direction).toBe("让胜");
    expect(score.total).toBeGreaterThanOrEqual(85);
    expect(score.confidence).toBeGreaterThanOrEqual(85);
    expect(score.risk).toBe("低");
    expect(score.breakdown.strength).toBeGreaterThan(20);
    expect(score.reasons).toContain("球队实力和近期状态都支持该方向");
  });

  it("flags Brazil vs Haiti as high-risk despite a likely outcome", () => {
    const match = todayMatches.find((item) => item.id === "brazil-haiti");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.total).toBeGreaterThanOrEqual(80);
    expect(score.risk).toBe("高");
    expect(score.warnings).toContain("赔率过低，收益不足");
  });

  it("reduces data completeness when head-to-head data is absent", () => {
    const match = todayMatches.find((item) => item.id === "japan-denmark");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.dataCompleteness).toBe(90);
    expect(score.warnings).toContain("历史交锋数据缺失");
  });

  it("scores away-side recommendations from the away perspective", () => {
    const match = todayMatches.find((item) => item.id === "mexico-poland");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.direction).toBe("让负");
    expect(score.breakdown.strength).toBeLessThan(15);
    expect(score.reasons).not.toContain("球队实力和近期状态都支持该方向");
    expect(score.confidence).toBeLessThan(85);
  });

  it("combines completeness penalties when odds and head-to-head data are missing", () => {
    const match = todayMatches.find((item) => item.id === "japan-denmark");
    if (!match) throw new Error("Fixture missing");

    const matchWithoutOdds: Match = { ...match, odds: undefined };
    const score = calculateMatchScore(matchWithoutOdds);

    expect(score.warnings).toContain("历史交锋数据缺失");
    expect(score.warnings).toContain("盘口数据缺失");
    expect(score.dataCompleteness).toBe(70);
  });

  it("normalizes incomplete recent form without invalid scores", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match) throw new Error("Fixture missing");

    const incompleteFormMatch: Match = {
      ...match,
      homeTeam: {
        ...match.homeTeam,
        recentForm: match.homeTeam.recentForm.slice(0, 1),
      },
      awayTeam: {
        ...match.awayTeam,
        recentForm: [],
      },
    };

    const baseline = calculateMatchScore(match);
    const score = calculateMatchScore(incompleteFormMatch);

    expect(Number.isFinite(score.total)).toBe(true);
    expect(Number.isFinite(score.confidence)).toBe(true);
    expect(Object.values(score.breakdown).every(Number.isFinite)).toBe(true);
    expect(score.warnings).toContain("近期状态数据不足");
    expect(score.breakdown.attack).toBe(8);
    expect(score.breakdown.defense).toBe(8);
    expect(score.total).toBeLessThanOrEqual(baseline.total);
    expect(score.dataCompleteness).toBeLessThan(100);
  });

  it("keeps missing-odds matches from looking like high-confidence picks", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match) throw new Error("Fixture missing");

    const matchWithoutOdds: Match = { ...match, odds: undefined };
    const score = calculateMatchScore(matchWithoutOdds);

    expect(score.direction).toBe("无推荐");
    expect(score.warnings).toContain("盘口数据缺失");
    expect(score.risk).toBe("高");
    expect(score.confidence).toBeLessThanOrEqual(50);
    expect(score.reasons).not.toContain("球队实力和近期状态都支持该方向");
    expect(score.dataCompleteness).toBe(80);
  });

  it("keeps draw recommendations neutral instead of home-favored", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match?.odds) throw new Error("Fixture missing");

    const drawMatch: Match = {
      ...match,
      odds: {
        ...match.odds,
        recommendedDirection: "平",
      },
    };
    const score = calculateMatchScore(drawMatch);

    expect(score.direction).toBe("平");
    expect(score.breakdown.strength).toBeLessThanOrEqual(18);
    expect(score.reasons).not.toContain("球队实力和近期状态都支持该方向");
  });

  it("keeps handicap draw recommendations neutral instead of home-favored", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match?.odds) throw new Error("Fixture missing");

    const handicapDrawMatch: Match = {
      ...match,
      odds: {
        ...match.odds,
        recommendedDirection: "让平",
      },
    };
    const score = calculateMatchScore(handicapDrawMatch);

    expect(score.direction).toBe("让平");
    expect(score.breakdown.strength).toBeLessThanOrEqual(18);
    expect(score.reasons).not.toContain("球队实力和近期状态都支持该方向");
  });

  it("treats invalid recommended odds as high-risk market data", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match?.odds) throw new Error("Fixture missing");

    const matchWithInvalidOdds: Match = {
      ...match,
      odds: {
        ...match.odds,
        recommendedOdds: 0,
      },
    };
    const score = calculateMatchScore(matchWithInvalidOdds);

    expect(score.impliedProbability).toBe(0);
    expect(score.warnings).toContain("赔率数据异常");
    expect(score.warnings).not.toContain("赔率过低，收益不足");
    expect(score.risk).toBe("高");
    expect(score.confidence).toBeLessThanOrEqual(50);
  });
});
