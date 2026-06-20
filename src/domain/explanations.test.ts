import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { buildAnalysis } from "./recommendations";
import { explainRecommendation } from "./explanations";

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
});
