const FOOTBALL_DATA_MATCHES_URL = "https://api.football-data.org/v4/competitions/WC/matches";
const SPORTTERY_MATCHES_URL =
  "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=hhad,had";
const FETCH_TIMEOUT_MS = 8_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

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

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function kickoffTimeFrom(matchTime) {
  return asString(matchTime).match(/\d{2}:\d{2}/)?.[0] || "时间待定";
}

function groupFromRanks(...ranks) {
  const rankText = ranks.map(asString).join(" ");
  return rankText.match(/[A-Z]组/u)?.[0];
}

function statusFromSporttery(value) {
  const status = asString(value).toLowerCase();
  if (status.includes("sell")) return "未开始";
  if (status.includes("finish") || status.includes("end") || status.includes("close")) return "已结束";
  if (status.includes("live") || status.includes("play") || status.includes("ing")) return "进行中";
  return "未开始";
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inDateRange(date, dateFrom, dateTo) {
  if (!date) return false;
  if (dateFrom && date < dateFrom) return false;
  if (dateTo && date > dateTo) return false;
  return true;
}

function mapSportteryMatch(matchRaw, groupBusinessDate) {
  const match = asRecord(matchRaw);
  if (!match) return null;

  const homeName = asString(match.homeTeamAllName || match.homeTeamName || match.homeTeamAbbName);
  const awayName = asString(match.awayTeamAllName || match.awayTeamName || match.awayTeamAbbName);
  if (!homeName || !awayName) return null;

  const matchId = asString(match.matchId || match.matchNumStr || `${homeName}-${awayName}`);
  const matchNo = asString(match.matchNumStr || match.matchNo);
  const groupName = asString(match.groupName) || groupFromRanks(match.homeRank, match.awayRank);
  const leagueName = asString(match.leagueAllName || match.leagueAbbName) || "世界杯";
  const businessDate = asString(match.businessDate) || groupBusinessDate;

  return {
    id: matchId,
    sportteryMatchId: matchId,
    matchNo,
    matchNumStr: matchNo,
    businessDate,
    matchDate: asString(match.matchDate) || businessDate,
    kickoffTime: kickoffTimeFrom(match.matchTime),
    status: statusFromSporttery(match.matchStatus),
    homeScore: numberOrNull(match.homeScore),
    awayScore: numberOrNull(match.awayScore),
    stage: groupName ? "小组赛" : leagueName,
    group: groupName || undefined,
    homeTeam: {
      id: asString(match.homeTeamId || match.homeTeamCode || homeName),
      name: homeName,
      fifaRank: 99,
      recentForm: [],
    },
    awayTeam: {
      id: asString(match.awayTeamId || match.awayTeamCode || awayName),
      name: awayName,
      fifaRank: 99,
      recentForm: [],
    },
    recentHeadToHead: [],
    notes: asString(match.remark) ? [asString(match.remark)] : [],
  };
}

export function parseSportteryMatches(response, dateFrom, dateTo) {
  const root = asRecord(response);
  const value = asRecord(root?.value);
  if (!value) return [];

  return asArray(value.matchInfoList).flatMap((groupRaw) => {
    const group = asRecord(groupRaw);
    if (!group) return [];

    const groupBusinessDate = asString(group.businessDate);
    if (!inDateRange(groupBusinessDate, dateFrom, dateTo)) return [];

    return asArray(group.subMatchList)
      .map((matchRaw) => mapSportteryMatch(matchRaw, groupBusinessDate))
      .filter(Boolean);
  });
}

function json(response, status, body) {
  response.status(status).json(body);
}

async function fetchWithTimeout(fetcher, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPublicJson(fetcher, url) {
  const upstream = await fetchWithTimeout(
    fetcher,
    url,
    {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "application/json,text/plain,*/*",
      },
    },
    FETCH_TIMEOUT_MS,
  );

  const bodyText = await upstream.text();
  if (!upstream.ok) {
    throw new Error(`公开赛事接口返回 ${upstream.status}`);
  }

  return bodyText ? JSON.parse(bodyText.replace(/^\uFEFF/, "")) : {};
}

export async function fetchSportteryMatches({ dateFrom, dateTo, fetcher = fetch }) {
  const data = await fetchPublicJson(fetcher, SPORTTERY_MATCHES_URL);
  const matches = parseSportteryMatches(data, dateFrom, dateTo);

  return {
    body: { matches, source: "sporttery" },
    status: 200,
  };
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
    const result = await fetchSportteryMatches({ dateFrom, dateTo });
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    json(response, result.status, result.body);
  } catch {
    try {
      const result = await fetchFootballDataMatches({ dateFrom, dateTo });
      response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
      json(response, result.status, result.body);
    } catch {
      json(response, 502, { matches: [], message: "今日赛事数据获取失败，请稍后重试。" });
    }
  }
}
