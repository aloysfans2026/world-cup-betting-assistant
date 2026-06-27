import { describe, expect, it, vi } from "vitest";
import handler, {
  fetchFootballDataMatches,
  handleMatchesRequest,
  parseFallback500CurrentMatches,
  parseFallback500MatchesHtml,
  parseSportteryMatches,
} from "./matches.js";

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
  it("parses public Sporttery matches for the requested match date", () => {
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
      "2026-06-27",
      "2026-06-27",
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

  it("uses matchDate instead of businessDate for future tabs", () => {
    const matches = parseSportteryMatches(
      {
        value: {
          matchInfoList: [
            {
              businessDate: "2026-06-28",
              subMatchList: [
                {
                  businessDate: "2026-06-28",
                  matchId: 2040327,
                  matchNumStr: "周日073",
                  matchDate: "2026-06-29",
                  matchTime: "03:00:00",
                  matchStatus: "Selling",
                  leagueAllName: "世界杯",
                  homeTeamAllName: "南非",
                  awayTeamAllName: "加拿大",
                },
              ],
            },
          ],
        },
      },
      "2026-06-29",
      "2026-06-29",
    );

    expect(matches).toEqual([
      expect.objectContaining({
        matchNo: "周日073",
        matchDate: "2026-06-29",
        homeTeam: expect.objectContaining({ name: "南非" }),
        awayTeam: expect.objectContaining({ name: "加拿大" }),
      }),
    ]);
  });

  it("parses 500.com public historical page rows for past match dates", () => {
    const html = `
      <tr class="bet-tb-tr bet-tb-end" data-homesxname="瑞士" data-awaysxname="加拿大" data-matchdate="2026-06-25" data-matchtime="03:00" data-simpleleague="世界杯" data-id="2040285" data-homeid="46" data-awayid="72" data-processdate="2026-06-24" data-matchnum="周三049" data-isend="1">
        <td class="td td-team"><a class="score">2:1</a></td>
      </tr>
    `;

    const matches = parseFallback500MatchesHtml(html, "2026-06-25", "2026-06-25");

    expect(matches).toEqual([
      expect.objectContaining({
        id: "2040285",
        matchNo: "周三049",
        matchDate: "2026-06-25",
        kickoffTime: "03:00",
        status: "已结束",
        homeScore: 2,
        awayScore: 1,
        homeTeam: expect.objectContaining({ name: "瑞士" }),
        awayTeam: expect.objectContaining({ name: "加拿大" }),
      }),
    ]);
  });

  it("uses 500.com current JSON status for live matches", () => {
    const matches = parseFallback500CurrentMatches(
      {
        data: {
          matches: [
            {
              order: "周五064",
              ownerdate: "2026-06-26",
              matchdate: "2026-06-27",
              matchtime: "2026-06-27 08:00:00",
              simpleleague: "世界杯",
              homesxname: "乌拉圭",
              awaysxname: "西班牙",
              homeid: "28",
              awayid: "12",
              status: "3",
              status_desc: "下半场",
              homescore: "0",
              awayscore: "1",
            },
          ],
        },
      },
      "2026-06-27",
      "2026-06-27",
    );

    expect(matches).toEqual([
      expect.objectContaining({
        matchNo: "周五064",
        status: "进行中",
        homeScore: 0,
        awayScore: 1,
        homeTeam: expect.objectContaining({ name: "乌拉圭" }),
        awayTeam: expect.objectContaining({ name: "西班牙" }),
      }),
    ]);
  });

  it("does not treat 500.com HTML betting cutoff as full time before a match can finish", () => {
    const html = `
      <tr class="bet-tb-tr bet-tb-end" data-homesxname="乌拉圭" data-awaysxname="西班牙" data-matchdate="2026-06-27" data-matchtime="08:00" data-simpleleague="世界杯" data-id="2040300" data-homeid="28" data-awayid="12" data-processdate="2026-06-26" data-matchnum="周五064" data-isend="1">
        <td class="td td-team"></td>
      </tr>
    `;

    const matches = parseFallback500MatchesHtml(html, "2026-06-27", "2026-06-27", () =>
      new Date("2026-06-27T09:30:00+08:00").getTime(),
    );

    expect(matches[0]).toMatchObject({
      matchNo: "周五064",
      status: "进行中",
      homeScore: null,
      awayScore: null,
    });
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

  it("exposes a platform-neutral handler for EdgeOne and Vercel adapters", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
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
                      homeTeamAllName: "挪威",
                      awayTeamAllName: "法国",
                    },
                  ],
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { matches: [] } }), { status: 200 }));

    const result = await handleMatchesRequest({
      method: "GET",
      url: "https://example.com/api/matches?dateFrom=2026-06-27&dateTo=2026-06-27",
      fetcher,
    });

    expect(result.status).toBe(200);
    expect(result.headers["Cache-Control"]).toContain("s-maxage=60");
    expect(result.body.matches).toEqual([
      expect.objectContaining({
        matchNo: "周五061",
        homeTeam: expect.objectContaining({ name: "挪威" }),
        awayTeam: expect.objectContaining({ name: "法国" }),
      }),
    ]);
  });
}
);
