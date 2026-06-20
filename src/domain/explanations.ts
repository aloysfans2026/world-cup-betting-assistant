import type { Recommendation } from "./types";

export function explainRecommendation(recommendation: Recommendation): string {
  const { match, score, kind, title } = recommendation;
  const warnings = score.warnings.length > 0 ? score.warnings.join("、") : "仍然存在比赛临场变化风险";
  const reasons = score.reasons.length > 0 ? score.reasons.join("、") : "综合评分支持该方向";

  if (kind === "避坑") {
    const hasLowOddsEvidence =
      score.warnings.some((warning) => warning.includes("赔率过低")) ||
      Boolean(match.odds && match.odds.recommendedOdds < 1.2);
    const riskExplanation = hasLowOddsEvidence
      ? `看起来方向清楚，但${warnings}。尤其是赔率过低时，即使命中收益也不足。`
      : `当前主要问题是${warnings}，风险和收益不匹配。`;

    return `为什么不推荐：${match.homeTeam.name} VS ${match.awayTeam.name} ${riskExplanation}风险在哪里：这类比赛容易让人忽视投入回报比。结论：建议跳过或只观察，不保证命中。`;
  }

  return `为什么推荐：${title} 的综合信心为 ${score.confidence}，主要因为${reasons}。为什么仍需谨慎：${warnings}。风险在哪里：足球比赛有红牌、伤病和临场战术变化，推荐只用于辅助判断，不保证命中。`;
}
