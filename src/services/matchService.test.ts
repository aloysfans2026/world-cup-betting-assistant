import { describe, expect, it, vi } from "vitest";
import { getTodayMatches } from "./matchService";

describe("matchService", () => {
  it("returns six sample World Cup matches with team and odds data", async () => {
    const result = await getTodayMatches({ apiKey: "" });
    const matches = result.matches;

    expect(result.source).toBe("mock-fallback");
    expect(result.issue?.kind).toBe("missing-api-key");
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
    const result = await getTodayMatches({ apiKey: "" });
    const matches = result.matches;

    expect(Array.isArray(matches)).toBe(true);
    expect(matches[0].recentHeadToHead).toEqual(expect.any(Array));
  });

  it("returns fresh match data so caller mutations do not leak across calls", async () => {
    const result = await getTodayMatches({ apiKey: "" });
    const matches = result.matches;
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

    const freshMatches = (await getTodayMatches({ apiKey: "" })).matches;

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
    const matches = (await getTodayMatches({ apiKey: "" })).matches;
    const canada = matches[0];
    const switzerland = matches[1];

    canada.homeTeam.recentForm[0].goalsFor = 99;

    expect(switzerland.homeTeam.recentForm[0].goalsFor).toBe(2);
  });

  it("maps football-data.org matches into the app match shape", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [
            {
              id: 123,
              utcDate: "2026-06-20T12:00:00Z",
              status: "SCHEDULED",
              stage: "GROUP_STAGE",
              group: "GROUP_A",
              homeTeam: { id: 1, name: "Canada", shortName: "Canada" },
              awayTeam: { id: 2, name: "Morocco", shortName: "Morocco" },
              score: { fullTime: { home: null, away: null } },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await getTodayMatches({
      apiKey: "test-token",
      date: new Date("2026-06-20T00:00:00Z"),
      fetcher,
    });

    expect(result.source).toBe("football-data");
    expect(result.matches[0]).toMatchObject({
      id: "123",
      matchDate: "2026-06-20",
      status: "未开始",
      stage: "小组赛",
      group: "A组",
      homeTeam: { name: "Canada" },
      awayTeam: { name: "Morocco" },
      homeScore: null,
      awayScore: null,
    });
    expect(result.matches[0].odds).toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/v4/competitions/WC/matches?"),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Auth-Token": "test-token" }),
      }),
    );
  });

  it("routes browser requests through the app API without an auth header", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [
            {
              id: 456,
              utcDate: "2026-06-23T17:00:00Z",
              status: "TIMED",
              stage: "GROUP_STAGE",
              group: "GROUP_K",
              homeTeam: { id: 3, name: "Portugal", shortName: "Portugal" },
              awayTeam: { id: 4, name: "Uzbekistan", shortName: "Uzbekistan" },
              score: { fullTime: { home: null, away: null } },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await getTodayMatches({
      apiBaseUrl: "/api",
      date: new Date("2026-06-23T00:00:00Z"),
      fetcher,
    });

    expect(result.source).toBe("football-data");
    expect(result.matches[0].homeTeam.name).toBe("Portugal");
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/api/matches?"),
      {},
    );
  });

  it("falls back to sample matches when the football API fails", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("Too many requests", { status: 429 }));

    const result = await getTodayMatches({
      apiKey: "test-token",
      date: new Date("2026-06-20T00:00:00Z"),
      fetcher,
    });

    expect(result.source).toBe("mock-fallback");
    expect(result.issue).toMatchObject({
      kind: "rate-limit",
      message: "今日赛事数据获取失败，请稍后重试。",
    });
    expect(result.matches).toHaveLength(6);
  });
});
