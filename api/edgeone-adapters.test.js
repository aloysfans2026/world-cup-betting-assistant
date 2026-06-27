import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest as onMatchesRequest } from "../cloud-functions/api/matches/index.js";
import { onRequest as onOddsRequest } from "../cloud-functions/api/odds/index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EdgeOne cloud function adapters", () => {
  it("returns matches through a standard Response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: {
              matchInfoList: [
                {
                  businessDate: "2026-06-27",
                  subMatchList: [
                    {
                      matchId: 2040327,
                      matchNumStr: "周六073",
                      matchDate: "2026-06-28",
                      matchTime: "03:00:00",
                      matchStatus: "Selling",
                      leagueAllName: "世界杯",
                      homeTeamAllName: "德国",
                      awayTeamAllName: "巴西",
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
    vi.stubGlobal("fetch", fetcher);

    const response = await onMatchesRequest({
      env: {},
      request: new Request("https://example.com/api/matches?dateFrom=2026-06-28&dateTo=2026-06-28"),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body.matches).toEqual([
      expect.objectContaining({
        matchNo: "周六073",
        homeTeam: expect.objectContaining({ name: "德国" }),
        awayTeam: expect.objectContaining({ name: "巴西" }),
      }),
    ]);
  });

  it("returns odds through a standard Response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: {
              matchInfoList: [
                {
                  businessDate: "2026-06-27",
                  subMatchList: [
                    {
                      matchId: 2040327,
                      matchNumStr: "周六073",
                      homeTeamAllName: "德国",
                      awayTeamAllName: "巴西",
                      matchDate: "2026-06-28",
                      had: {
                        h: "2.10",
                        d: "3.20",
                        a: "2.90",
                      },
                    },
                  ],
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { matches: [] } }), { status: 200 }))
      .mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    const response = await onOddsRequest({
      request: new Request("https://example.com/api/odds?date=2026-06-28"),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body.odds).toEqual([
      expect.objectContaining({
        matchNo: "周六073",
        homeWin: 2.1,
        source: "sporttery",
      }),
    ]);
  });
});
