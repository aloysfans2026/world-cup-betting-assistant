import { describe, expect, it } from "vitest";
import type { Match } from "../domain/types";
import { todayMatches } from "../fixtures/worldCupMatches";
import {
  applyOddsToMatches,
  buildOddsFromInput,
  mergeOddsIntoMatches,
  parseFallback500OddsResponse,
  parseSportteryOddsResponse,
} from "./oddsService";

function makeMatch(overrides: Partial<Match> & { id: string; homeName: string; awayName: string }): Match {
  const { awayName, homeName, id, ...matchOverrides } = overrides;

  return {
    ...matchOverrides,
    id,
    matchDate: "2026-06-26",
    kickoffTime: "03:00",
    status: "未开始",
    homeScore: null,
    awayScore: null,
    homeTeam: { id: `${id}-home`, name: homeName, fifaRank: 99, recentForm: [] },
    awayTeam: { id: `${id}-away`, name: awayName, fifaRank: 99, recentForm: [] },
    recentHeadToHead: [],
    notes: [],
  };
}

const sportteryPayload = {
  success: true,
  errorCode: "0",
  value: {
    lastUpdateTime: "2026-06-26 16:53:24",
    matchInfoList: [
      {
        businessDate: "2026-06-26",
        subMatchList: [
          {
            businessDate: "2026-06-26",
            matchId: 2040297,
            matchNumStr: "周五061",
            matchNum: 5061,
            matchDate: "2026-06-27",
            matchTime: "03:00:00",
            homeTeamAllName: "挪威",
            awayTeamAllName: "法国",
            had: {
              h: "4.35",
              d: "4.15",
              a: "1.52",
              updateDate: "2026-06-26",
              updateTime: "16:53:24",
            },
          },
          {
            businessDate: "2026-06-26",
            matchId: 2040298,
            matchNumStr: "周五062",
            matchNum: 5062,
            homeTeamAllName: "塞内加尔",
            awayTeamAllName: "伊拉克",
            had: {},
          },
          {
            businessDate: "2026-06-25",
            matchId: 2040000,
            matchNumStr: "周四001",
            homeTeamAllName: "昨天主队",
            awayTeamAllName: "昨天客队",
            had: { h: "1.80", d: "3.20", a: "4.20" },
          },
        ],
      },
    ],
  },
};

const fallback500Payload = {
  status: "100",
  message: "OK",
  data: {
    curr_expect: "2026-06-26",
    matches: [
      {
        order: "周五061",
        ownerdate: "2026-06-26",
        homesxname: "挪威",
        awaysxname: "法国",
        matchtime: "2026-06-27 03:00:00",
        extra_info: { currodds: "4.35/4.15/1.52" },
        matchdate: "2026-06-27",
      },
      {
        order: "周五062",
        ownerdate: "2026-06-26",
        homesxname: "塞内加尔",
        awaysxname: "伊拉克",
        matchtime: "2026-06-27 03:00:00",
        extra_info: { currodds: "-/-/-" },
        matchdate: "2026-06-27",
      },
      {
        order: "周四001",
        ownerdate: "2026-06-25",
        homesxname: "昨天主队",
        awaysxname: "昨天客队",
        matchtime: "2026-06-26 03:00:00",
        extra_info: { currodds: "1.80/3.20/4.20" },
      },
    ],
  },
};

describe("oddsService", () => {
  it("builds app odds from complete fetched win/draw/loss odds", () => {
    const odds = buildOddsFromInput({ homeWin: "1.82", draw: "3.20", awayWin: "4.10" });

    expect(odds).toMatchObject({
      homeWin: 1.82,
      draw: 3.2,
      awayWin: 4.1,
      recommendedDirection: "主胜",
      recommendedOdds: 1.82,
      marketMovement: "稳定",
    });
  });

  it("rejects partial or invalid fetched odds", () => {
    expect(buildOddsFromInput({ homeWin: "1.82", draw: "", awayWin: "4.10" })).toBeUndefined();
    expect(buildOddsFromInput({ homeWin: "1", draw: "3.20", awayWin: "4.10" })).toBeUndefined();
    expect(buildOddsFromInput({ homeWin: "abc", draw: "3.20", awayWin: "4.10" })).toBeUndefined();
  });

  it("applies fetched odds without mutating match data", () => {
    const match = { ...todayMatches[0], odds: undefined };
    const [withOdds] = applyOddsToMatches([match], {
      [match.id]: { homeWin: "2.10", draw: "3.00", awayWin: "3.80" },
    });

    expect(match.odds).toBeUndefined();
    expect(withOdds.odds).toMatchObject({ homeWin: 2.1, recommendedDirection: "主胜" });
  });

  it("does not expose bundled sample odds when no automatic odds were fetched", () => {
    const [withOdds] = applyOddsToMatches([todayMatches[0]], {});

    expect(todayMatches[0].odds).toBeDefined();
    expect(withOdds.odds).toBeUndefined();
  });

  it("parses valid Sporttery HAD quotes for the requested match date", () => {
    const quotes = parseSportteryOddsResponse(sportteryPayload, "2026-06-27");

    expect(quotes).toEqual([
      {
        matchId: "2040297",
        matchNo: "周五061",
        matchNumStr: "周五061",
        homeTeam: "挪威",
        awayTeam: "法国",
        homeWin: 4.35,
        draw: 4.15,
        awayWin: 1.52,
        updatedAt: "2026-06-26 16:53:24",
        source: "sporttery",
      },
    ]);
  });

  it("parses valid 500.com fallback odds for the requested match date", () => {
    const quotes = parseFallback500OddsResponse(fallback500Payload, "2026-06-27");

    expect(quotes).toEqual([
      {
        matchNo: "周五061",
        matchNumStr: "周五061",
        homeTeam: "挪威",
        awayTeam: "法国",
        homeWin: 4.35,
        draw: 4.15,
        awayWin: 1.52,
        updatedAt: "2026-06-27 03:00:00",
        source: "500",
      },
    ]);
  });

  it("matches odds by match number before team names", () => {
    const match = makeMatch({
      id: "norway-france",
      homeName: "挪威",
      awayName: "法国",
      matchNo: "周五061",
      odds: undefined,
    } as Partial<Match> & { id: string; homeName: string; awayName: string });

    const result = mergeOddsIntoMatches([match], parseSportteryOddsResponse(sportteryPayload, "2026-06-27"));

    expect(result.matchedCount).toBe(1);
    expect(result.oddsByMatchId["norway-france"]).toMatchObject({
      homeWin: "4.35",
      draw: "4.15",
      awayWin: "1.52",
      source: "sporttery",
    });
    expect(result.matches[0].odds).toMatchObject({ homeWin: 4.35, draw: 4.15, awayWin: 1.52 });
  });

  it("matches common World Cup English and Chinese team names", () => {
    const match = makeMatch({ id: "norway-france", homeName: "Norway", awayName: "France", odds: undefined });

    const result = mergeOddsIntoMatches([match], parseSportteryOddsResponse(sportteryPayload, "2026-06-27"));

    expect(result.matchedCount).toBe(1);
    expect(result.oddsByMatchId["norway-france"]?.source).toBe("sporttery");
  });

  it("refreshes previously applied automatic odds during automatic merge", () => {
    const match = makeMatch({
      id: "norway-france",
      homeName: "挪威",
      awayName: "法国",
      matchNo: "周五061",
      odds: undefined,
    } as Partial<Match> & { id: string; homeName: string; awayName: string });

    const result = mergeOddsIntoMatches([match], parseSportteryOddsResponse(sportteryPayload, "2026-06-27"), {
      "norway-france": {
        homeWin: "9.99",
        draw: "8.88",
        awayWin: "7.77",
        source: "500",
      },
    });

    expect(result.matchedCount).toBe(1);
    expect(result.oddsByMatchId["norway-france"]).toMatchObject({
      homeWin: "4.35",
      draw: "4.15",
      awayWin: "1.52",
      source: "sporttery",
    });
    expect(result.matches[0].odds).toMatchObject({ homeWin: 4.35, draw: 4.15, awayWin: 1.52 });
  });
});
