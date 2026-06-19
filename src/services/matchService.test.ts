import { describe, expect, it } from "vitest";
import { getTodayMatches } from "./matchService";

describe("matchService", () => {
  it("returns six sample World Cup matches with team and odds data", async () => {
    const matches = await getTodayMatches();

    expect(matches).toHaveLength(6);
    expect(matches[0]).toMatchObject({
      id: "canada-morocco",
      homeTeam: { name: "加拿大" },
      awayTeam: { name: "摩洛哥" },
    });
    expect(matches.every((match) => match.homeTeam.fifaRank > 0)).toBe(true);
    expect(matches.every((match) => match.awayTeam.fifaRank > 0)).toBe(true);
    matches.forEach((match) => {
      expect(match.odds).toMatchObject({
        homeWin: expect.any(Number),
        draw: expect.any(Number),
        awayWin: expect.any(Number),
        recommendedDirection: expect.any(String),
        recommendedOdds: expect.any(Number),
        marketMovement: expect.any(String),
      });
    });
  });

  it("keeps fixture data behind an async API-shaped function", async () => {
    const matches = await getTodayMatches();

    expect(Array.isArray(matches)).toBe(true);
    expect(matches[0].recentHeadToHead).toEqual(expect.any(Array));
  });

  it("returns fresh match data so caller mutations do not leak across calls", async () => {
    const matches = await getTodayMatches();
    const firstMatch = matches[0];

    matches.push({ ...firstMatch, id: "caller-added-match" });
    firstMatch.id = "mutated-match";
    firstMatch.homeTeam.name = "篡改主队";
    firstMatch.awayTeam.fifaRank = 999;
    firstMatch.homeTeam.recentForm[0].opponent = "篡改对手";
    firstMatch.notes[0] = "篡改备注";
    firstMatch.notes.push("新增备注");
    if (firstMatch.odds) {
      firstMatch.odds.homeWin = 99;
      firstMatch.odds.recommendedDirection = "客胜";
    }

    const freshMatches = await getTodayMatches();

    expect(freshMatches).toHaveLength(6);
    expect(freshMatches[0]).toMatchObject({
      id: "canada-morocco",
      homeTeam: { name: "加拿大", fifaRank: 28 },
      awayTeam: { name: "摩洛哥", fifaRank: 36 },
      odds: { homeWin: 2.15, recommendedDirection: "让胜" },
    });
    expect(freshMatches[0].homeTeam.recentForm[0]).toEqual({
      opponent: "美国",
      result: "胜",
      goalsFor: 2,
      goalsAgainst: 0,
    });
    expect(freshMatches[0].notes).toEqual(["加拿大近期攻防均衡", "盘口变化平稳"]);
  });

  it("does not share nested form entries between matches in one response", async () => {
    const matches = await getTodayMatches();
    const canada = matches[0];
    const switzerland = matches[1];

    canada.homeTeam.recentForm[0].goalsFor = 99;

    expect(switzerland.homeTeam.recentForm[0].goalsFor).toBe(2);
  });
});
