import type { BetDirection, Match, Odds } from "../domain/types";
import { normalizeTeamName, normalizeTeamToken, toChineseTeamName } from "./teamNameService";

export type OddsQuoteSource = "sporttery" | "500";

export interface OddsQuote {
  matchId?: string;
  matchNo?: string;
  matchNumStr?: string;
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  updatedAt?: string;
  source: OddsQuoteSource;
}

export interface AppliedOddsInput {
  homeWin?: string;
  draw?: string;
  awayWin?: string;
  source?: OddsQuoteSource;
  updatedAt?: string;
  matchNo?: string;
}

export type OddsByMatchId = Record<string, AppliedOddsInput>;

const APP_API_BASE_URL = "/api";
const APP_ODDS_PATH = "/odds";

type UnknownRecord = Record<string, unknown>;

export interface OddsMergeResult {
  matches: Match[];
  oddsByMatchId: OddsByMatchId;
  matchedCount: number;
  unmatchedQuotes: OddsQuote[];
}

export interface FetchOddsOptions {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
}

export interface FetchOddsResult {
  success: boolean;
  date: string;
  source: OddsQuoteSource | null;
  fallbackUsed: boolean;
  updatedAt?: string;
  odds: OddsQuote[];
  message?: string;
  errors?: string[];
}

function parseOdd(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
}

function parseOddValue(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeMatchNo(value: string | undefined): string {
  return normalizeTeamToken(value ?? "");
}

function sameTeam(homeA: string, awayA: string, homeB: string, awayB: string): boolean {
  return normalizeTeamName(homeA) === normalizeTeamName(homeB) && normalizeTeamName(awayA) === normalizeTeamName(awayB);
}

function matchNumberFor(match: Match): string {
  return (
    normalizeMatchNo(match.matchNo) ||
    normalizeMatchNo(match.matchNumStr) ||
    normalizeMatchNo((match as Match & { matchNum?: string | number }).matchNum?.toString())
  );
}

function quoteNumbersFor(quote: OddsQuote): string[] {
  return [quote.matchNo, quote.matchNumStr].map(normalizeMatchNo).filter(Boolean);
}

function sportteryUpdatedAt(rootValue: UnknownRecord, had: UnknownRecord): string | undefined {
  const updateDate = asString(had.updateDate);
  const updateTime = asString(had.updateTime);
  if (updateDate && updateTime) return `${updateDate} ${updateTime}`;

  return asString(rootValue.lastUpdateTime) || undefined;
}

function buildQuoteInput(quote: OddsQuote): AppliedOddsInput {
  return {
    homeWin: String(quote.homeWin),
    draw: String(quote.draw),
    awayWin: String(quote.awayWin),
    source: quote.source,
    updatedAt: quote.updatedAt,
    matchNo: quote.matchNo,
  };
}

function recommendedDirectionFor(homeWin: number, draw: number, awayWin: number): BetDirection {
  const lowest = Math.min(homeWin, draw, awayWin);
  if (lowest === homeWin) return "主胜";
  if (lowest === draw) return "平";
  return "客胜";
}

function recommendedOddsFor(direction: BetDirection, homeWin: number, draw: number, awayWin: number): number {
  if (direction === "主胜") return homeWin;
  if (direction === "平") return draw;
  return awayWin;
}

export function buildOddsFromInput(input: AppliedOddsInput): Odds | undefined {
  const homeWin = parseOdd(input.homeWin);
  const draw = parseOdd(input.draw);
  const awayWin = parseOdd(input.awayWin);

  if (!homeWin || !draw || !awayWin) return undefined;

  const recommendedDirection = recommendedDirectionFor(homeWin, draw, awayWin);

  return {
    homeWin,
    draw,
    awayWin,
    recommendedDirection,
    recommendedOdds: recommendedOddsFor(recommendedDirection, homeWin, draw, awayWin),
    marketMovement: "稳定",
  };
}

export function parseSportteryOddsResponse(response: unknown, date: string): OddsQuote[] {
  const root = asRecord(response);
  const value = asRecord(root?.value);
  if (!value) return [];

  return asArray(value.matchInfoList).flatMap((groupRaw) => {
    const group = asRecord(groupRaw);
    if (!group) return [];

    const groupBusinessDate = asString(group.businessDate);

    return asArray(group.subMatchList).flatMap((matchRaw) => {
      const match = asRecord(matchRaw);
      if (!match) return [];

      const businessDate = asString(match.businessDate) || groupBusinessDate;
      if (businessDate !== date) return [];

      const had = asRecord(match.had);
      if (!had) return [];

      const homeWin = parseOddValue(had.h);
      const draw = parseOddValue(had.d);
      const awayWin = parseOddValue(had.a);
      const homeTeam = asString(match.homeTeamAllName || match.homeTeamName || match.homeTeamAbbName);
      const awayTeam = asString(match.awayTeamAllName || match.awayTeamName || match.awayTeamAbbName);
      if (!homeWin || !draw || !awayWin || !homeTeam || !awayTeam) return [];

      const quote: OddsQuote = {
        homeTeam: toChineseTeamName(homeTeam),
        awayTeam: toChineseTeamName(awayTeam),
        homeWin,
        draw,
        awayWin,
        updatedAt: sportteryUpdatedAt(value, had),
        source: "sporttery",
      };

      const matchId = asString(match.matchId);
      const matchNo = asString(match.matchNumStr || match.matchNo);
      if (matchId) quote.matchId = matchId;
      if (matchNo) {
        quote.matchNo = matchNo;
        quote.matchNumStr = matchNo;
      }

      return [quote];
    });
  });
}

export function parseFallback500OddsResponse(response: unknown, date: string): OddsQuote[] {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  if (!data) return [];

  return asArray(data.matches).flatMap((matchRaw) => {
    const match = asRecord(matchRaw);
    if (!match) return [];

    if (asString(match.ownerdate) !== date) return [];

    const extraInfo = asRecord(match.extra_info);
    const currentOdds = asString(extraInfo?.currodds);
    const [homeWinRaw, drawRaw, awayWinRaw] = currentOdds.match(/\d+(?:\.\d+)?/g) ?? [];
    const homeWin = parseOddValue(homeWinRaw);
    const draw = parseOddValue(drawRaw);
    const awayWin = parseOddValue(awayWinRaw);
    const homeTeam = asString(match.homesxname || match.homename || match.homeName);
    const awayTeam = asString(match.awaysxname || match.awayname || match.awayName);
    if (!homeWin || !draw || !awayWin || !homeTeam || !awayTeam) return [];

    const quote: OddsQuote = {
      homeTeam: toChineseTeamName(homeTeam),
      awayTeam: toChineseTeamName(awayTeam),
      homeWin,
      draw,
      awayWin,
      updatedAt: asString(match.matchtime) || undefined,
      source: "500",
    };

    const matchNo = asString(match.order || match.matchNo);
    if (matchNo) {
      quote.matchNo = matchNo;
      quote.matchNumStr = matchNo;
    }

    return [quote];
  });
}

function findMatchingMatch(matches: Match[], quote: OddsQuote): Match | undefined {
  const quoteNumbers = quoteNumbersFor(quote);
  if (quoteNumbers.length > 0) {
    const numberMatched = matches.filter((match) => {
      const matchNo = matchNumberFor(match);
      return matchNo && quoteNumbers.includes(matchNo);
    });

    if (numberMatched.length === 1) return numberMatched[0];
  }

  if (quote.matchId) {
    const idMatched = matches.filter(
      (match) => String(match.sportteryMatchId ?? (match as Match & { matchId?: string }).matchId ?? "") === quote.matchId,
    );
    if (idMatched.length === 1) return idMatched[0];
  }

  const teamMatched = matches.filter((match) =>
    sameTeam(match.homeTeam.name, match.awayTeam.name, quote.homeTeam, quote.awayTeam),
  );

  return teamMatched.length === 1 ? teamMatched[0] : undefined;
}

export function mergeOddsIntoMatches(
  matches: Match[],
  oddsQuotes: OddsQuote[],
  currentOdds: OddsByMatchId = {},
): OddsMergeResult {
  const oddsByMatchId: OddsByMatchId = { ...currentOdds };
  const unmatchedQuotes: OddsQuote[] = [];
  let matchedCount = 0;

  oddsQuotes.forEach((quote) => {
    const match = findMatchingMatch(matches, quote);
    if (!match) {
      unmatchedQuotes.push(quote);
      return;
    }

    oddsByMatchId[match.id] = buildQuoteInput(quote);
    matchedCount += 1;
  });

  return {
    matches: applyOddsToMatches(matches, oddsByMatchId),
    oddsByMatchId,
    matchedCount,
    unmatchedQuotes,
  };
}

function oddsUrlFor(date: string, apiBaseUrl: string): string {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  const browserOrigin = globalThis.location?.origin ?? "http://localhost";
  const url = new URL(`${baseUrl}${APP_ODDS_PATH}`, browserOrigin);

  url.searchParams.set("date", date);
  return url.toString();
}

export async function fetchOddsFromAppApi(date: string, options: FetchOddsOptions = {}): Promise<FetchOddsResult> {
  const fetcher = options.fetcher ?? fetch;
  const apiBaseUrl = options.apiBaseUrl ?? APP_API_BASE_URL;

  try {
    const response = await fetcher(oddsUrlFor(date, apiBaseUrl));
    const data = (await response.json()) as Partial<FetchOddsResult>;

    if (!response.ok || data.success === false) {
      return {
        success: false,
        date,
        source: null,
        fallbackUsed: Boolean(data.fallbackUsed),
        odds: [],
        message: data.message || "今日赔率获取失败，请稍后重试。",
        errors: data.errors,
      };
    }

    return {
      success: true,
      date: data.date || date,
      source: data.source ?? null,
      fallbackUsed: Boolean(data.fallbackUsed),
      updatedAt: data.updatedAt,
      odds: Array.isArray(data.odds) ? data.odds : [],
      message: data.message,
      errors: data.errors,
    };
  } catch {
    return {
      success: false,
      date,
      source: null,
      fallbackUsed: false,
      odds: [],
      message: "今日赔率获取失败，请稍后重试。",
    };
  }
}

export async function fetchTodaySportteryOdds(date: string, options: FetchOddsOptions = {}): Promise<OddsQuote[]> {
  const result = await fetchOddsFromAppApi(date, options);
  return result.odds.filter((quote) => quote.source === "sporttery");
}

export async function fetchFallback500Odds(date: string, options: FetchOddsOptions = {}): Promise<OddsQuote[]> {
  const result = await fetchOddsFromAppApi(date, options);
  return result.odds.filter((quote) => quote.source === "500");
}

export function applyOddsToMatches(matches: Match[], oddsByMatchId: OddsByMatchId): Match[] {
  return matches.map((match) => {
    const odds = buildOddsFromInput(oddsByMatchId[match.id] ?? {});
    return {
      ...match,
      odds,
    };
  });
}
