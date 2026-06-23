const FOOTBALL_DATA_MATCHES_URL = "https://api.football-data.org/v4/competitions/WC/matches";

function apiKeyFromEnv() {
  return process.env.FOOTBALL_API_KEY || "";
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function queryFromRequest(request) {
  const url = new URL(request.url || "/", "http://localhost");
  const dateFrom = firstQueryValue(request.query?.dateFrom) || url.searchParams.get("dateFrom");
  const dateTo = firstQueryValue(request.query?.dateTo) || url.searchParams.get("dateTo");

  return { dateFrom, dateTo };
}

function json(response, status, body) {
  response.status(status).json(body);
}

export async function fetchFootballDataMatches({
  apiKey = apiKeyFromEnv(),
  dateFrom,
  dateTo,
  fetcher = fetch,
}) {
  if (!apiKey.trim()) {
    return {
      body: { message: "FOOTBALL_API_KEY 未配置" },
      status: 500,
    };
  }

  const url = new URL(FOOTBALL_DATA_MATCHES_URL);
  if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
  if (dateTo) url.searchParams.set("dateTo", dateTo);

  const upstream = await fetcher(url.toString(), {
    headers: {
      "X-Auth-Token": apiKey,
    },
  });
  const bodyText = await upstream.text();
  const body = bodyText ? JSON.parse(bodyText) : {};

  return {
    body,
    status: upstream.status,
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    json(response, 405, { message: "只支持 GET 请求" });
    return;
  }

  const { dateFrom, dateTo } = queryFromRequest(request);

  if (!dateFrom || !dateTo) {
    json(response, 400, { message: "缺少 dateFrom 或 dateTo" });
    return;
  }

  try {
    const result = await fetchFootballDataMatches({ dateFrom, dateTo });
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    json(response, result.status, result.body);
  } catch {
    json(response, 502, { message: "football-data.org 请求失败" });
  }
}
