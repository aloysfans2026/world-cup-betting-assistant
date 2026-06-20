import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { buildAnalysis } from "./recommendations";
import { explainRecommendation } from "./explanations";
import type { Recommendation } from "./types";

function makeRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  const match = todayMatches[0];

  return {
    id: "test-recommendation",
    kind: "稳胆",
    match,
    score: {
      matchId: match.id,
      direction: "主胜",
      total: 75,
      confidence: 72,
      modelProbability: 58,
      impliedProbability: 50,
      risk: "中",
      breakdown: {
        strength: 15,
        form: 15,
        attack: 15,
        defense: 15,
        headToHead: 5,
        market: 10,
      },
      reasons: ["状态更稳定"],
      warnings: ["仍需防平局"],
      dataCompleteness: 100,
    },
    title: "测试主胜",
    reason: "测试推荐",
    ...overrides,
  };
}

describe("explanations", () => {
  it("explains a stable recommendation in novice-friendly language", () => {
    const analysis = buildAnalysis(todayMatches);
    const text = explainRecommendation(analysis.safePicks[0]);

    expect(text).toContain("为什么推荐");
    expect(text).toContain("风险在哪里");
    expect(text).toContain("不保证命中");
  });

  it("explains trap matches as low return or high risk", () => {
    const analysis = buildAnalysis(todayMatches);
    const trap = analysis.trapMatches.find((item) => item.match.id === "brazil-haiti");
    if (!trap) throw new Error("Trap fixture missing");

    const text = explainRecommendation(trap);

    expect(text).toContain("为什么不推荐");
    expect(text).toContain("赔率过低");
  });

  it("does not mention low odds for trap matches without low-odds evidence", () => {
    const recommendation = makeRecommendation({
      kind: "避坑",
      match: { ...todayMatches[0], odds: undefined },
      score: {
        ...makeRecommendation().score,
        direction: "无推荐",
        warnings: ["盘口数据缺失"],
      },
    });

    const text = explainRecommendation(recommendation);

    expect(text).toContain("为什么不推荐");
    expect(text).toContain("盘口数据缺失");
    expect(text).not.toContain("赔率过低");
  });

  it("does not mention low odds for invalid odds data", () => {
    const base = makeRecommendation();
    const recommendation = makeRecommendation({
      kind: "避坑",
      match: {
        ...base.match,
        odds: {
          ...base.match.odds!,
          recommendedOdds: 1,
        },
      },
      score: {
        ...base.score,
        warnings: ["赔率数据异常"],
      },
    });

    const text = explainRecommendation(recommendation);

    expect(text).toContain("赔率数据异常");
    expect(text).not.toContain("赔率过低");
  });

  it("uses fallback reasons and warnings when score details are empty", () => {
    const recommendation = makeRecommendation({
      score: {
        ...makeRecommendation().score,
        reasons: [],
        warnings: [],
      },
    });

    const text = explainRecommendation(recommendation);

    expect(text).toContain("综合评分支持该方向");
    expect(text).toContain("仍然存在比赛临场变化风险");
  });
});
