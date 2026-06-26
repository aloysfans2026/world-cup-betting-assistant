import type { Match } from "../domain/types";
import { todayMatches } from "../fixtures/worldCupMatches";
import { toChineseTeamName } from "./teamNameService";

const FOOTBALL_DATA_API_BASE_URL = "https://api.football-data.org";
const FOOTBALL_DATA_MATCHES_PATH = "/v4/competitions/WC/matches";
const APP_API_BASE_URL = "/api";
const APP_MATCHES_PATH = "/matches";

export type MatchDataSource = "football-data" | "mock-fallback";

export type MatchServiceIssueKind = "missing-api-key" | "network" | "api-error" | "rate-limit" | "parse";

export interface MatchServiceIssue {
  kind: MatchServiceIssueKind;
  message: string;
  detail: string;
}

export interface MatchServiceResult {
  matches: Match[];
  source: MatchDataSource;
  issue?: MatchServiceIssue;
}

interface FootballDataTeam {
  id?: number;
  name?: string;
  shortName?: string;
  tla?: string;
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
  };
}

interface FootballDataMatchesResponse {
  matches?: FootballDataMatch[];
}

export interface GetTodayMatchesOptions {
  apiBaseUrl?: string;
  apiKey?: string;
  date?: Date;
  fetcher?: typeof fetch;
}

function fallback(issue: MatchServiceIssue): MatchServiceResult {
  return {
    matches: todayMatches.map((match) => structuredClone(match)),
    source: "mock-fallback",
    issue,
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatKickoffTime(utcDate: string): string {
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function mapStatus(status: string): Match["status"] {
  if (status === "FINISHED") return "已结束";
  if (status === "IN_PLAY" || status === "PAUSED" || status === "LIVE") return "进行中";
  return "未开始";
}

function mapStage(stage?: string): string | undefined {
  const stageMap: Record<string, string> = {
    GROUP_STAGE: "小组赛",
    LAST_16: "16强",
    QUARTER_FINALS: "四分之一决赛",
    SEMI_FINALS: "半决赛",
    THIRD_PLACE: "三四名决赛",
    FINAL: "决赛",
  };

  return stage ? (stageMap[stage] ?? stage.replaceAll("_", " ")) : undefined;
}

function mapGroup(group?: string | null): string | undefined {
  if (!group) return undefined;

  return group.replace("GROUP_", "").replace(/^([A-Z])$/, "$1组");
}

function teamName(team: FootballDataTeam): string {
  return toChineseTeamName(team.shortName || team.name || team.tla || "待定");
}

function mapFootballDataMatch(match: FootballDataMatch): Match {
  const homeName = teamName(match.homeTeam);
  const awayName = teamName(match.awayTeam);

  return {
    id: String(match.id),
    matchDate: match.utcDate.slice(0, 10),
    kickoffTime: formatKickoffTime(match.utcDate),
    status: mapStatus(match.status),
    homeScore: match.score?.fullTime?.home ?? null,
    awayScore: match.score?.fullTime?.away ?? null,
    stage: mapStage(match.stage),
    group: mapGroup(match.group),
    homeTeam: {
      id: String(match.homeTeam.id ?? homeName),
      name: homeName,
      fifaRank: 99,
      recentForm: [],
    },
    awayTeam: {
      id: String(match.awayTeam.id ?? awayName),
      name: awayName,
      fifaRank: 99,
      recentForm: [],
    },
    recentHeadToHead: [],
    notes: [],
  };
}

function issueForResponse(response: Response): MatchServiceIssue {
  if (response.status === 429) {
    return {
      kind: "rate-limit",
      message: "今日赛事数据获取失败，请稍后重试。",
      detail: "football-data.org 接口限流，已使用本地示例数据。",
    };
  }

  return {
    kind: "api-error",
    message: "今日赛事数据获取失败，请稍后重试。",
    detail: `football-data.org 返回 ${response.status}，已使用本地示例数据。`,
  };
}

function shouldUseAppApi(options: GetTodayMatchesOptions): boolean {
  return options.apiKey === undefined;
}

function apiBaseUrlFor(options: GetTodayMatchesOptions): string {
  if (options.apiBaseUrl) return options.apiBaseUrl;
  return shouldUseAppApi(options) ? APP_API_BASE_URL : FOOTBALL_DATA_API_BASE_URL;
}

function matchesUrlFor(matchDate: string, apiBaseUrl: string): string {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  const browserOrigin = globalThis.location?.origin ?? "http://localhost";
  const matchesPath = apiBaseUrl.startsWith("/") ? APP_MATCHES_PATH : FOOTBALL_DATA_MATCHES_PATH;
  const url = new URL(`${baseUrl}${matchesPath}`, browserOrigin);

  url.searchParams.set("dateFrom", matchDate);
  url.searchParams.set("dateTo", matchDate);

  return url.toString();
}

function requestOptionsFor(apiBaseUrl: string, apiKey: string): RequestInit {
  if (apiBaseUrl.startsWith("/")) return {};

  return {
    headers: {
      "X-Auth-Token": apiKey,
    },
  };
}

export async function getTodayMatches(options: GetTodayMatchesOptions = {}): Promise<MatchServiceResult> {
  const date = options.date ?? new Date();
  const fetcher = options.fetcher ?? fetch;
  const apiBaseUrl = apiBaseUrlFor(options);
  const usesLocalProxy = apiBaseUrl.startsWith("/");
  const apiKey = options.apiKey ?? "";

  if (!usesLocalProxy && !apiKey.trim()) {
    return fallback({
      kind: "missing-api-key",
      message: "今日赛事数据获取失败，请稍后重试。",
      detail: "football-data.org API Key 未配置，已使用本地示例数据。",
    });
  }

  const matchDate = formatDate(date);
  const url = matchesUrlFor(matchDate, apiBaseUrl);

  try {
    const response = await fetcher(url, requestOptionsFor(apiBaseUrl, apiKey));

    if (!response.ok) return fallback(issueForResponse(response));

    const data = (await response.json()) as FootballDataMatchesResponse;
    if (!Array.isArray(data.matches)) {
      return fallback({
        kind: "parse",
        message: "今日赛事数据获取失败，请稍后重试。",
        detail: "football-data.org 返回格式异常，已使用本地示例数据。",
      });
    }

    return {
      matches: data.matches.map(mapFootballDataMatch),
      source: "football-data",
    };
  } catch {
    return fallback({
      kind: "network",
      message: "今日赛事数据获取失败，请稍后重试。",
      detail: "网络错误，已使用本地示例数据。",
    });
  }
}
