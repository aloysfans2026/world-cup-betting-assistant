import { calculateMatchScore } from "./scoring";
import type { AnalysisResult, Match, MatchScore, ParlayPlan, Recommendation, RiskLevel } from "./types";

type ScoredMatch = {
  match: Match;
  score: MatchScore;
  index: number;
};

const riskRank: Record<RiskLevel, number> = {
  低: 0,
  中: 1,
  高: 2,
};

function modelEdge(score: MatchScore): number {
  return score.modelProbability - score.impliedProbability;
}

function isActionable(item: ScoredMatch): boolean {
  return item.score.direction !== "无推荐";
}

function toRecommendation(item: ScoredMatch, kind: Recommendation["kind"], reason: string): Recommendation {
  return {
    id: `${kind}-${item.match.id}`,
    kind,
    match: item.match,
    score: item.score,
    title: `${item.match.homeTeam.name}${item.score.direction}`,
    reason,
  };
}

function stableBy<T>(items: T[], compare: (left: T, right: T) => number): T[] {
  return [...items].sort(compare);
}

function buildSafePicks(scoredMatches: ScoredMatch[]): Recommendation[] {
  return stableBy(
    scoredMatches.filter((item) => isActionable(item) && item.score.risk !== "高"),
    (left, right) =>
      riskRank[left.score.risk] - riskRank[right.score.risk] ||
      right.score.confidence - left.score.confidence ||
      right.score.total - left.score.total ||
      left.index - right.index,
  )
    .slice(0, 3)
    .map((item) =>
      toRecommendation(item, "稳胆", `风险${item.score.risk}，模型信心${item.score.confidence}，适合放入稳健候选。`),
    );
}

function buildValuePicks(scoredMatches: ScoredMatch[], safePicks: Recommendation[]): Recommendation[] {
  const safeMatchIds = new Set(safePicks.map((pick) => pick.match.id));
  const candidates = scoredMatches.filter((item) => isActionable(item) && item.score.risk !== "高");

  return stableBy(candidates, (left, right) => {
    const leftIsSafe = safeMatchIds.has(left.match.id) ? 1 : 0;
    const rightIsSafe = safeMatchIds.has(right.match.id) ? 1 : 0;

    return (
      leftIsSafe - rightIsSafe ||
      modelEdge(right.score) - modelEdge(left.score) ||
      right.score.confidence - left.score.confidence ||
      riskRank[left.score.risk] - riskRank[right.score.risk] ||
      left.index - right.index
    );
  })
    .slice(0, 3)
    .map((item) =>
      toRecommendation(
        item,
        "价值",
        `模型概率高出隐含概率${modelEdge(item.score)}个百分点，可作为价值观察方向。`,
      ),
    );
}

function isTrapMatch(item: ScoredMatch): boolean {
  const odds = item.match.odds;

  return (
    item.score.risk === "高" ||
    item.score.direction === "无推荐" ||
    Boolean(odds && odds.recommendedOdds < 1.2) ||
    odds?.marketMovement === "异常" ||
    modelEdge(item.score) <= 0
  );
}

function buildTrapMatches(scoredMatches: ScoredMatch[]): Recommendation[] {
  return scoredMatches.filter(isTrapMatch).map((item) => {
    const warning = item.score.warnings[0];
    const reason = warning
      ? `${warning}，建议跳过或只观察。`
      : "风险收益不匹配，建议跳过或只观察。";

    return toRecommendation(item, "避坑", reason);
  });
}

function uniquePicks(picks: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();

  return picks.filter((pick) => {
    if (seen.has(pick.match.id)) return false;
    seen.add(pick.match.id);
    return true;
  });
}

function buildPlan(
  id: ParlayPlan["id"],
  label: ParlayPlan["label"],
  type: ParlayPlan["type"],
  sampleStake: number,
  risk: RiskLevel,
  picks: Recommendation[],
  pickCount: number,
): ParlayPlan {
  return {
    id,
    label,
    type,
    sampleStake,
    risk,
    picks: picks.slice(0, pickCount),
  };
}

function buildParlayPlans(safePicks: Recommendation[], valuePicks: Recommendation[]): ParlayPlan[] {
  const pool = uniquePicks([...safePicks, ...valuePicks]);
  const planSpecs = [
    { id: "conservative", label: "保守方案", type: "2串1", sampleStake: 20, risk: "低", pickCount: 2 },
    { id: "balanced", label: "平衡方案", type: "3串1", sampleStake: 20, risk: "中", pickCount: 3 },
    { id: "upside", label: "冲高方案", type: "4串1", sampleStake: 10, risk: "高", pickCount: 4 },
  ] as const;

  return planSpecs
    .filter((plan) => pool.length >= plan.pickCount)
    .map((plan) => buildPlan(plan.id, plan.label, plan.type, plan.sampleStake, plan.risk, pool, plan.pickCount));
}

export function buildAnalysis(matches: Match[]): AnalysisResult {
  const scoredMatches = matches.map((match, index) => ({
    match,
    score: calculateMatchScore(match),
    index,
  }));
  const safePicks = buildSafePicks(scoredMatches);
  const valuePicks = buildValuePicks(scoredMatches, safePicks);
  const trapMatches = buildTrapMatches(scoredMatches);

  return {
    safePicks,
    valuePicks,
    trapMatches,
    parlayPlans: buildParlayPlans(safePicks, valuePicks),
    summary: trapMatches.length > 0 ? "建议小额参与，避开超低赔率场。" : "今日可以关注低风险组合，仍需控制投入。",
  };
}
