import type { Match, MatchScore, RiskLevel, Team, TeamFormMatch } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function impliedProbability(decimalOdds: number): number {
  return Math.round((1 / decimalOdds) * 100);
}

function winPoints(result: TeamFormMatch["result"]): number {
  if (result === "胜") return 3;
  if (result === "平") return 1;
  return 0;
}

function formPoints(team: Team): number {
  const raw = team.recentForm.reduce((sum, match) => sum + winPoints(match.result), 0);
  return clamp((raw / 15) * 100);
}

function goalsFor(team: Team): number {
  return team.recentForm.reduce((sum, match) => sum + match.goalsFor, 0);
}

function goalsAgainst(team: Team): number {
  return team.recentForm.reduce((sum, match) => sum + match.goalsAgainst, 0);
}

function rankStrength(homeRank: number, awayRank: number): number {
  const gap = awayRank - homeRank;
  return clamp(50 + gap * 2.4);
}

function attackScore(home: Team, away: Team): number {
  return clamp(50 + (goalsFor(home) - goalsFor(away)) * 6);
}

function defenseScore(home: Team, away: Team): number {
  return clamp(50 + (goalsAgainst(away) - goalsAgainst(home)) * 6);
}

function headToHeadScore(match: Match): number {
  if (match.recentHeadToHead.length === 0) return 50;

  const goalDiff = match.recentHeadToHead.reduce(
    (sum, item) => sum + item.homeGoals - item.awayGoals,
    0,
  );
  return clamp(50 + goalDiff * 10);
}

function marketScore(match: Match): number {
  if (!match.odds) return 45;

  const implied = impliedProbability(match.odds.recommendedOdds);
  const movementBonus = match.odds.marketMovement === "稳定" ? 8 : match.odds.marketMovement === "升温" ? 4 : -10;
  const valueBonus = match.odds.recommendedOdds >= 1.8 && match.odds.recommendedOdds <= 2.6 ? 12 : -8;
  return clamp(50 + movementBonus + valueBonus - Math.max(0, implied - 65));
}

function riskFor(match: Match, total: number): RiskLevel {
  if (!match.odds) return "高";
  if (match.odds.recommendedOdds < 1.2 || match.odds.marketMovement === "异常") return "高";
  if (match.recentHeadToHead.length === 0 || total < 82) return "中";
  return "低";
}

export function calculateMatchScore(match: Match): MatchScore {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const strengthRaw = rankStrength(home.fifaRank, away.fifaRank);
  const formRaw = clamp(50 + (formPoints(home) - formPoints(away)) * 0.7);
  const attackRaw = attackScore(home, away);
  const defenseRaw = defenseScore(home, away);
  const headToHeadRaw = headToHeadScore(match);
  const marketRaw = marketScore(match);

  const breakdown = {
    strength: Math.round(strengthRaw * 0.3),
    form: Math.round(formRaw * 0.25),
    attack: Math.round(attackRaw * 0.15),
    defense: Math.round(defenseRaw * 0.15),
    headToHead: Math.round(headToHeadRaw * 0.05),
    market: Math.round(marketRaw * 0.1),
  };

  const weightedScore = clamp(
    breakdown.strength +
      breakdown.form +
      breakdown.attack +
      breakdown.defense +
      breakdown.headToHead +
      breakdown.market,
  );
  const total = clamp(Math.round((weightedScore / 75) * 100));
  const odds = match.odds;
  const implied = odds ? impliedProbability(odds.recommendedOdds) : 0;
  const modelProbability = clamp(Math.round(total * 0.78 + 18));
  const risk = riskFor(match, total);
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (strengthRaw >= 60 && formRaw >= 60) {
    reasons.push("球队实力和近期状态都支持该方向");
  }
  if (attackRaw >= 55) reasons.push("近期进攻表现更稳定");
  if (defenseRaw >= 55) reasons.push("防守端失球控制更好");
  if (!odds) warnings.push("盘口数据缺失");
  if (odds && odds.recommendedOdds < 1.2) warnings.push("赔率过低，收益不足");
  if (match.recentHeadToHead.length === 0) warnings.push("历史交锋数据缺失");
  if (odds?.marketMovement === "异常") warnings.push("盘口变化异常");

  return {
    matchId: match.id,
    direction: odds?.recommendedDirection ?? "主胜",
    total: Math.round(total),
    confidence: Math.round(clamp(total - (risk === "高" ? 8 : risk === "中" ? 4 : 0))),
    modelProbability,
    impliedProbability: implied,
    risk,
    breakdown,
    reasons,
    warnings,
    dataCompleteness: match.recentHeadToHead.length === 0 ? 90 : odds ? 100 : 80,
  };
}
