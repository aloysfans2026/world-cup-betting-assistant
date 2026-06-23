import { describe, expect, it, vi } from "vitest";
import handler, { fetchFootballDataMatches } from "./matches.js";

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
