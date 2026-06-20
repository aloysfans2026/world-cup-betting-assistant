import type { BetDirection, Match, Odds } from "../domain/types";

export interface ManualOddsInput {
  homeWin?: string;
  draw?: string;
  awayWin?: string;
}

export type ManualOddsByMatchId = Record<string, ManualOddsInput>;

const STORAGE_KEY = "world-cup-manual-odds";

function parseOdd(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
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

export function buildManualOdds(input: ManualOddsInput): Odds | undefined {
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

export function applyManualOdds(matches: Match[], manualOdds: ManualOddsByMatchId): Match[] {
  return matches.map((match) => {
    const odds = buildManualOdds(manualOdds[match.id] ?? {});
    return {
      ...match,
      odds: odds ?? match.odds,
    };
  });
}

export function readManualOdds(storage: Storage | undefined = globalThis.localStorage): ManualOddsByMatchId {
  if (!storage) return {};

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ManualOddsByMatchId;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveManualOdds(
  manualOdds: ManualOddsByMatchId,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(manualOdds));
}
