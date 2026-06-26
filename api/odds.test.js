import { describe, expect, it, vi } from "vitest";
import handler, { fetchOddsWithFallback, parseFallback500Odds, parseSportteryOdds } from "./odds.js";

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
        ],
      },
    ],
  },
};

const fallback500Payload = {
  status: "100",
  data: {
    matches: [
      {
        ownerdate: "2026-06-26",
        order: "周五061",
        homesxname: "挪威",
        awaysxname: "法国",
        matchtime: "2026-06-27 03:00:00",
        extra_info: { currodds: "4.35/4.15/1.52" },
      },
    ],
  },
};

describe("Vercel odds API", () => {
  it("parses Sporttery odds into the shared quote shape", () => {
    expect(parseSportteryOdds(sportteryPayload, "2026-06-26")).toEqual([
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

  it("parses 500.com odds into the shared quote shape", () => {
    expect(parseFallback500Odds(fallback500Payload, "2026-06-26")).toEqual([
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

  it("uses 500.com fallback only when Sporttery fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(fallback500Payload), { status: 200 }));

    const result = await fetchOddsWithFallback({
      date: "2026-06-26",
      fetcher,
      now: () => 1782465000000,
    });

    expect(result.status).toBe(200);
    expect(result.body.source).toBe("500");
    expect(result.body.fallbackUsed).toBe(true);
    expect(result.body.odds).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1].headers["User-Agent"]).toContain("Mozilla/5.0");
  });

  it("does not call fallback when Sporttery returns usable odds", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(sportteryPayload), { status: 200 }));

    const result = await fetchOddsWithFallback({
      date: "2026-06-26",
      fetcher,
      now: () => 1782465000000,
    });

    expect(result.status).toBe(200);
    expect(result.body.source).toBe("sporttery");
    expect(result.body.fallbackUsed).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns a clear error when both public sources fail", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }))
      .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }));

    const result = await fetchOddsWithFallback({
      date: "2026-06-26",
      fetcher,
      now: () => 1782465000000,
    });

    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({
      success: false,
      message: "今日赔率获取失败，请稍后重试。",
      source: null,
      fallbackUsed: true,
    });
  });

  it("validates request method and date", async () => {
    const response = responseMock();

    await handler({ method: "POST", query: {} }, response);

    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({ success: false, message: "只支持 GET 请求" });
  });
});
