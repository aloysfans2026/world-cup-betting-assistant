import { describe, expect, it, vi } from "vitest";
import handler, { fetchFootballDataMatches, parseSportteryMatches } from "./matches.js";

function responseMock() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    json(body) {
      this.body = body;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
  };
}

describe("Vercel matches API", () => {
  it("parses public Sporttery matches for the requested business date", () => {
    const matches = parseSportteryMatches(
      {
        value: {
          matchInfoList: [
            {
              businessDate: "2026-06-26",
              subMatchList: [
                {
                  businessDate: "2026-06-26",
                  matchId: 2040297,
                  matchNumStr: "周五061",
                  matchDate: "2026-06-27",
                  matchTime: "03:00:00",
                  matchStatus: "Selling",
                  leagueAllName: "世界杯",
                  homeRank: "[I组2]",
                  awayRank: "[I组1]",
                  homeTeamId: 391,
                  awayTeamId: 375,
                  homeTeamAllName: "挪威",
                  awayTeamAllName: "法国",
                  remark: "比赛将在美国举行",
                },
              ],
            },
          ],
        },
      },
      "2026-06-26",
      "2026-06-26",
    );

    expect(matches).toEqual([
      expect.objectContaining({
        id: "2040297",
        sportteryMatchId: "2040297",
        matchNo: "周五061",
        matchNumStr: "周五061",
        matchDate: "2026-06-27",
        kickoffTime: "03:00",
        status: "未开始",
        stage: "小组赛",
        group: "I组",
        homeTeam: expect.objectContaining({ id: "391", name: "挪威" }),
        awayTeam: expect.objectContaining({ id: "375", name: "法国" }),
        homeScore: null,
        awayScore: null,
      }),
    ]);
  });

  it("requires a server-side football API key", async () => {
    const fetcher = vi.fn();

    const result = await fetchFootballDataMatches({
      apiKey: "",
      dateFrom: "2026-06-23",
      dateTo: "2026-06-23",
      fetcher,
    });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({ message: "FOOTBALL_API_KEY 未配置" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("forwards date filters to football-data.org with the server-side auth header", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [] }), {
        status: 200,
      }),
    );

    const result = await fetchFootballDataMatches({
      apiKey: "server-only-token",
      dateFrom: "2026-06-23",
      dateTo: "2026-06-23",
      fetcher,
    });

    expect(result).toEqual({ body: { matches: [] }, status: 200 });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.football-data.org/v4/competitions/WC/matches?dateFrom=2026-06-23&dateTo=2026-06-23",
      {
        headers: {
          "X-Auth-Token": "server-only-token",
        },
      },
    );
  });

  it("rejects non-GET requests", async () => {
    const response = responseMock();

    await handler({ method: "POST", query: {} }, response);

    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({ message: "只支持 GET 请求" });
  });
}
);
