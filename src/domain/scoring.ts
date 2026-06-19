import type { BetDirection, Match, MatchScore, RiskLevel, Team, TeamFormMatch } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const EXPECTED_RECENT_FORM_MATCHES = 5;

type ScoringPerspective = "home" | "away";

export function impliedProbability(decimalOdds: number): number {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 0) return 0;
  return Math.round((1 / decimalOdds) * 100);
}

function winPoints(result: TeamFormMatch["result"]): number {
  if (result === "胜") return 3;
  if (result === "平") return 1;
  return 0;
}

function formPoints(team: Team): number {
  if (team.recentForm.length === 0) return 50;

  const raw = team.recentForm.reduce((sum, match) => sum + winPoints(match.result), 0);
  return clamp((raw / (team.recentForm.length * 3)) * 100);
}

function goalsForAverage(team: Team): number {
  if (team.recentForm.length === 0) return 0;

  return team.recentForm.reduce((sum, match) => sum + match.goalsFor, 0) / team.recentForm.length;
}

function goalsAgainstAverage(team: Team): number {
  if (team.recentForm.length === 0) return 0;

  return team.recentForm.reduce((sum, match) => sum + match.goalsAgainst, 0) / team.recentForm.length;
}

function rankStrength(teamRank: number, opponentRank: number): number {
  const gap = opponentRank - teamRank;
  return clamp(50 + gap * 2.4);
}

function attackScore(team: Team, opponent: Team): number {
  return clamp(50 + (goalsForAverage(team) - goalsForAverage(opponent)) * 30);
}

function defenseScore(team: Team, opponent: Team): number {
  return clamp(50 + (goalsAgainstAverage(opponent) - goalsAgainstAverage(team)) * 30);
}

function headToHeadScore(match: Match, perspective: ScoringPerspective): number {
  if (match.recentHeadToHead.length === 0) return 50;

  const goalDiff = match.recentHeadToHead.reduce(
    (sum, item) =>
      sum + (perspective === "home" ? item.homeGoals - item.awayGoals : item.awayGoals - item.homeGoals),
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

function perspectiveFor(direction: BetDirection): ScoringPerspective {
  if (direction === "客胜" || direction === "让负") return "away";
  return "home";
}

function hasIncompleteRecentForm(match: Match): boolean {
  return (
    match.homeTeam.recentForm.length < EXPECTED_RECENT_FORM_MATCHES ||
    match.awayTeam.recentForm.length < EXPECTED_RECENT_FORM_MATCHES
  );
}

function dataCompletenessFor(match: Match, incompleteRecentForm: boolean): number {
  let completeness = 100;

  if (match.recentHeadToHead.length === 0) completeness -= 10;
  if (!match.odds) completeness -= 20;
  if (incompleteRecentForm) completeness -= 15;

  return clamp(completeness);
}

export function calculateMatchScore(match: Match): MatchScore {
  const odds = match.odds;
  const direction = odds?.recommendedDirection ?? "主胜";
  const perspective = perspectiveFor(direction);
  const team = perspective === "home" ? match.homeTeam : match.awayTeam;
  const opponent = perspective === "home" ? match.awayTeam : match.homeTeam;
  const incompleteRecentForm = hasIncompleteRecentForm(match);
  const strengthRaw = rankStrength(team.fifaRank, opponent.fifaRank);
  const formRaw = clamp(50 + (formPoints(team) - formPoints(opponent)) * 0.7);
  const attackRaw = attackScore(team, opponent);
  const defenseRaw = defenseScore(team, opponent);
  const headToHeadRaw = headToHeadScore(match, perspective);
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
  if (incompleteRecentForm) warnings.push("近期状态数据不足");
  if (odds?.marketMovement === "异常") warnings.push("盘口变化异常");

  return {
    matchId: match.id,
    direction,
    total: Math.round(total),
    confidence: Math.round(clamp(total - (risk === "高" ? 8 : risk === "中" ? 4 : 0))),
    modelProbability,
    impliedProbability: implied,
    risk,
    breakdown,
    reasons,
    warnings,
    dataCompleteness: dataCompletenessFor(match, incompleteRecentForm),
  };
}
