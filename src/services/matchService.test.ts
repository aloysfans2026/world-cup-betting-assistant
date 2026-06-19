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
    expect(matches.some((match) => match.odds?.homeWin)).toBe(true);
  });

  it("keeps fixture data behind an async API-shaped function", async () => {
    const matches = await getTodayMatches();

    expect(Array.isArray(matches)).toBe(true);
    expect(matches[0].recentHeadToHead).toEqual(expect.any(Array));
  });
});
