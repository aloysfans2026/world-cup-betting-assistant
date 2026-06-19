export type RiskLevel = "低" | "中" | "高";

export type MatchResult = "胜" | "平" | "负";

export type BetDirection =
  | "主胜"
  | "平"
  | "客胜"
  | "让胜"
  | "让平"
  | "让负";

export type ScoreDirection = BetDirection | "无推荐";

export type RecommendationKind = "稳胆" | "价值" | "避坑";

export interface TeamFormMatch {
  opponent: string;
  result: MatchResult;
  goalsFor: number;
  goalsAgainst: number;
}

export interface Team {
  id: string;
  name: string;
  fifaRank: number;
  recentForm: TeamFormMatch[];
}

export interface Odds {
  homeWin: number;
  draw: number;
  awayWin: number;
  handicap?: string;
  recommendedDirection: BetDirection;
  recommendedOdds: number;
  marketMovement: "稳定" | "升温" | "异常";
}

export interface HeadToHeadMatch {
  label: string;
  homeGoals: number;
  awayGoals: number;
}

export interface Match {
  id: string;
  kickoffTime: string;
  homeTeam: Team;
  awayTeam: Team;
  odds?: Odds;
  recentHeadToHead: HeadToHeadMatch[];
  notes: string[];
}

export interface ScoreBreakdown {
  strength: number;
  form: number;
  attack: number;
  defense: number;
  headToHead: number;
  market: number;
}

export interface MatchScore {
  matchId: string;
  direction: ScoreDirection;
  total: number;
  confidence: number;
  modelProbability: number;
  impliedProbability: number;
  risk: RiskLevel;
  breakdown: ScoreBreakdown;
  reasons: string[];
  warnings: string[];
  dataCompleteness: number;
}

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  match: Match;
  score: MatchScore;
  title: string;
  reason: string;
}

export interface ParlayPlan {
  id: "conservative" | "balanced" | "upside";
  label: "保守方案" | "平衡方案" | "冲高方案";
  type: "2串1" | "3串1" | "4串1";
  sampleStake: number;
  risk: RiskLevel;
  picks: Recommendation[];
}

export interface AnalysisResult {
  safePicks: Recommendation[];
  valuePicks: Recommendation[];
  trapMatches: Recommendation[];
  parlayPlans: ParlayPlan[];
  summary: string;
}
