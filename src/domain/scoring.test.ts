import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { calculateMatchScore, impliedProbability } from "./scoring";

describe("scoring", () => {
  it("converts decimal odds to implied probability", () => {
    expect(impliedProbability(2)).toBe(50);
    expect(impliedProbability(1.25)).toBe(80);
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
});
