const FOOTBALL_DATA_MATCHES_URL = "https://api.football-data.org/v4/competitions/WC/matches";
const SPORTTERY_MATCHES_URL =
  "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=hhad,had";
const FALLBACK_500_MATCHES_URL = "https://trade.500.com/jczq/";
const FALLBACK_500_CURRENT_MATCHES_URL = "https://ews.500.com/static/ews/jczq/jczq.json";
const FETCH_TIMEOUT_MS = 8_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const GB18030_DECODER = new TextDecoder("gb18030");

function apiKeyFromEnv(env = globalThis.process?.env) {
  return env?.FOOTBALL_API_KEY || "";
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function queryFromInput({ query, url: requestUrl } = {}) {
  const url = new URL(requestUrl || "/", "http://localhost");
  const dateFrom = firstQueryValue(query?.dateFrom) || url.searchParams.get("dateFrom");
  const dateTo = firstQueryValue(query?.dateTo) || url.searchParams.get("dateTo");

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

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateText, days) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function datesBetween(dateFrom, dateTo) {
  const dates = [];
  let current = dateFrom;

  while (current <= dateTo && dates.length < 10) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
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

    return asArray(group.subMatchList)
      .map((matchRaw) => mapSportteryMatch(matchRaw, groupBusinessDate))
      .filter((match) => match && inDateRange(match.matchDate, dateFrom, dateTo))
      .filter(Boolean);
  });
}

function decodeHtml(value) {
  return asString(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    attrs[match[1]] = decodeHtml(match[2]);
  }
  return attrs;
}

function parse500Score(rowHtml) {
  const scoreMatch = rowHtml.match(/class="score"[^>]*>\s*(\d+)\s*:\s*(\d+)\s*</);
  if (!scoreMatch) return { homeScore: null, awayScore: null };

  return {
    homeScore: numberOrNull(scoreMatch[1]),
    awayScore: numberOrNull(scoreMatch[2]),
  };
}

function kickoffTimestamp(matchDate, kickoffTime) {
  const time = kickoffTime.match(/\d{2}:\d{2}/)?.[0];
  if (!matchDate || !time) return null;

  const timestamp = new Date(`${matchDate}T${time}:00+08:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function statusFrom500Current(statusRaw, statusDescRaw) {
  const status = asString(statusRaw);
  const statusDesc = asString(statusDescRaw);

  if (statusDesc.includes("完") || statusDesc.includes("结束") || status === "4") return "已结束";
  if (
    statusDesc.includes("上半场") ||
    statusDesc.includes("下半场") ||
    statusDesc.includes("中场") ||
    statusDesc.includes("进行") ||
    ["1", "2", "3"].includes(status)
  ) {
    return "进行中";
  }

  return "未开始";
}

function statusFrom500Html(attrs, homeScore, awayScore, now) {
  const matchDate = asString(attrs["data-matchdate"]);
  const kickoffTime = asString(attrs["data-matchtime"]);
  const kickoff = kickoffTimestamp(matchDate, kickoffTime);
  const hasScore = homeScore !== null && awayScore !== null;

  if (kickoff) {
    const current = now();
    if (current < kickoff) return "未开始";
    if (current < kickoff + 150 * 60 * 1000) return "进行中";
  }

  if (hasScore || asString(attrs["data-isend"]) === "1") return "已结束";
  return "未开始";
}

function map500Match(rowHtml, now) {
  const openTag = rowHtml.match(/<tr\b[^>]*>/)?.[0] || "";
  const attrs = parseAttributes(openTag);
  const homeName = asString(attrs["data-homesxname"]);
  const awayName = asString(attrs["data-awaysxname"]);
  const leagueName = asString(attrs["data-simpleleague"]) || "世界杯";
  const matchDate = asString(attrs["data-matchdate"]);
  const kickoffTime = asString(attrs["data-matchtime"]);
  if (!homeName || !awayName || !matchDate || !leagueName.includes("世界杯")) return null;

  const { homeScore, awayScore } = parse500Score(rowHtml);
  const matchId = asString(attrs["data-id"] || attrs["data-infomatchid"] || attrs["data-fixtureid"]);
  const matchNo = asString(attrs["data-matchnum"]);

  return {
    id: matchId || matchNo || `${matchDate}-${homeName}-${awayName}`,
    sportteryMatchId: matchId || undefined,
    matchNo,
    matchNumStr: matchNo,
    businessDate: asString(attrs["data-processdate"]) || undefined,
    matchDate,
    kickoffTime: kickoffTime.match(/\d{2}:\d{2}/)?.[0] || "时间待定",
    status: statusFrom500Html(attrs, homeScore, awayScore, now),
    homeScore,
    awayScore,
    stage: "小组赛",
    homeTeam: {
      id: asString(attrs["data-homeid"] || homeName),
      name: homeName,
      fifaRank: 99,
      recentForm: [],
    },
    awayTeam: {
      id: asString(attrs["data-awayid"] || awayName),
      name: awayName,
      fifaRank: 99,
      recentForm: [],
    },
    recentHeadToHead: [],
    notes: [],
  };
}

export function parseFallback500MatchesHtml(html, dateFrom, dateTo, now = Date.now) {
  return [...asString(html).matchAll(/<tr\b[^>]*class="[^"]*\bbet-tb-tr\b[^"]*"[^>]*>[\s\S]*?<\/tr>/g)]
    .map((match) => map500Match(match[0], now))
    .filter((match) => match && inDateRange(match.matchDate, dateFrom, dateTo));
}

export function parseFallback500CurrentMatches(response, dateFrom, dateTo) {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  if (!data) return [];

  return asArray(data.matches).flatMap((matchRaw) => {
    const match = asRecord(matchRaw);
    if (!match) return [];

    const leagueName = asString(match.simpleleague || match.league || match.leagueName) || "世界杯";
    const matchDate = asString(match.matchdate || match.matchDate || match.ownerdate);
    const homeName = asString(match.homesxname || match.homename || match.homeName);
    const awayName = asString(match.awaysxname || match.awayname || match.awayName);
    if (!leagueName.includes("世界杯") || !inDateRange(matchDate, dateFrom, dateTo) || !homeName || !awayName) {
      return [];
    }

    const matchNo = asString(match.order || match.matchNo);
    const matchId = asString(match.matchid || match.id || match.wid || match.fid || matchNo);
    return [
      {
        id: matchId || matchNo || `${matchDate}-${homeName}-${awayName}`,
        matchNo,
        matchNumStr: matchNo,
        businessDate: asString(match.ownerdate) || undefined,
        matchDate,
        kickoffTime: kickoffTimeFrom(match.matchtime),
        status: statusFrom500Current(match.status, match.status_desc),
        homeScore: numberOrNull(match.homescore),
        awayScore: numberOrNull(match.awayscore),
        stage: "小组赛",
        homeTeam: {
          id: asString(match.homeid || homeName),
          name: homeName,
          fifaRank: 99,
          recentForm: [],
        },
        awayTeam: {
          id: asString(match.awayid || awayName),
          name: awayName,
          fifaRank: 99,
          recentForm: [],
        },
        recentHeadToHead: [],
        notes: [],
      },
    ];
  });
}

function sameMatch(left, right) {
  if (left.sportteryMatchId && right.sportteryMatchId && left.sportteryMatchId === right.sportteryMatchId) return true;
  if (left.matchNo && right.matchNo && left.matchNo === right.matchNo) return true;
  return (
    left.matchDate === right.matchDate &&
    left.homeTeam.name === right.homeTeam.name &&
    left.awayTeam.name === right.awayTeam.name
  );
}

function mergeDefined(existing, incoming) {
  const merged = { ...existing };
  Object.entries(incoming).forEach(([key, value]) => {
    if (value !== undefined) merged[key] = value;
  });

  merged.homeScore = incoming.homeScore ?? existing.homeScore ?? null;
  merged.awayScore = incoming.awayScore ?? existing.awayScore ?? null;
  merged.group = incoming.group ?? existing.group;
  merged.homeTeam = { ...existing.homeTeam, ...incoming.homeTeam };
  merged.awayTeam = { ...existing.awayTeam, ...incoming.awayTeam };
  merged.recentHeadToHead = incoming.recentHeadToHead?.length ? incoming.recentHeadToHead : existing.recentHeadToHead;
  merged.notes = incoming.notes?.length ? incoming.notes : existing.notes;
  return merged;
}

function mergeMatches(...matchGroups) {
  const matches = [];
  matchGroups.flat().forEach((match) => {
    const index = matches.findIndex((existing) => sameMatch(existing, match));
    if (index === -1) {
      matches.push(match);
      return;
    }

    matches[index] = mergeDefined(matches[index], match);
  });

  return matches.sort((left, right) => {
    const leftTime = /^\d{2}:\d{2}$/.test(left.kickoffTime) ? left.kickoffTime : "99:99";
    const rightTime = /^\d{2}:\d{2}$/.test(right.kickoffTime) ? right.kickoffTime : "99:99";
    return `${left.matchDate} ${leftTime}`.localeCompare(`${right.matchDate} ${rightTime}`, "zh-CN");
  });
}

function sendJsonResult(response, result) {
  Object.entries(result.headers || {}).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
  response.status(result.status).json(result.body);
}

const MATCHES_CACHE_HEADERS = {
  "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
};

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

async function fetchPublicDecodedText(fetcher, url) {
  const upstream = await fetchWithTimeout(
    fetcher,
    url,
    {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    },
    FETCH_TIMEOUT_MS,
  );

  if (!upstream.ok) {
    throw new Error(`500彩票网公开赛事页面返回 ${upstream.status}`);
  }

  const body = await upstream.arrayBuffer();
  return GB18030_DECODER.decode(body);
}

export async function fetchSportteryMatches({ dateFrom, dateTo, fetcher = fetch }) {
  const data = await fetchPublicJson(fetcher, SPORTTERY_MATCHES_URL);
  const matches = parseSportteryMatches(data, dateFrom, dateTo);

  return {
    body: { matches, source: "sporttery" },
    status: 200,
  };
}

export async function fetchFallback500Matches({ dateFrom, dateTo, fetcher = fetch, now = Date.now }) {
  const processDates = datesBetween(addDays(dateFrom, -1), dateTo);
  const pages = await Promise.allSettled(
    processDates.map(async (processDate) => {
      const url = new URL(FALLBACK_500_MATCHES_URL);
      url.searchParams.set("date", processDate);
      return fetchPublicDecodedText(fetcher, url.toString());
    }),
  );

  return pages.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    return parseFallback500MatchesHtml(result.value, dateFrom, dateTo, now);
  });
}

export async function fetchFallback500CurrentMatches({ dateFrom, dateTo, fetcher = fetch }) {
  const data = await fetchPublicJson(fetcher, FALLBACK_500_CURRENT_MATCHES_URL);
  return parseFallback500CurrentMatches(data, dateFrom, dateTo);
}

export async function fetchFootballDataMatches({
  apiKey = apiKeyFromEnv(),
  dateFrom,
  dateTo,
  env,
  fetcher = fetch,
}) {
  const authToken = apiKey || apiKeyFromEnv(env);
  if (!authToken.trim()) {
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
      "X-Auth-Token": authToken,
    },
  });
  const bodyText = await upstream.text();
  const body = bodyText ? JSON.parse(bodyText) : {};

  return {
    body,
    status: upstream.status,
  };
}

export async function handleMatchesRequest({
  method = "GET",
  url,
  query,
  env,
  fetcher = fetch,
  now = Date.now,
} = {}) {
  if (method !== "GET") {
    return { status: 405, headers: {}, body: { message: "只支持 GET 请求" } };
  }

  const { dateFrom, dateTo } = queryFromInput({ query, url });

  if (!dateFrom || !dateTo) {
    return { status: 400, headers: {}, body: { message: "缺少 dateFrom 或 dateTo" } };
  }

  const errors = [];
  let sportteryMatches = [];
  let fallbackMatches = [];
  let current500Matches = [];

  try {
    const result = await fetchSportteryMatches({ dateFrom, dateTo, fetcher });
    sportteryMatches = Array.isArray(result.body.matches) ? result.body.matches : [];
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "中国竞彩网公开赛事接口失败");
  }

  try {
    fallbackMatches = await fetchFallback500Matches({ dateFrom, dateTo, fetcher, now });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "500彩票网公开赛事页面失败");
  }

  try {
    current500Matches = await fetchFallback500CurrentMatches({ dateFrom, dateTo, fetcher });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "500彩票网当前赛事接口失败");
  }

  const matches = mergeMatches(fallbackMatches, sportteryMatches, current500Matches);
  if (matches.length > 0 || errors.length < 2) {
    return {
      status: 200,
      headers: MATCHES_CACHE_HEADERS,
      body: {
        matches,
        source: sportteryMatches.length > 0 ? "sporttery" : "500",
        fallbackUsed: fallbackMatches.length > 0 || current500Matches.length > 0,
      },
    };
  }

  try {
    const result = await fetchFootballDataMatches({ dateFrom, dateTo, env, fetcher });
    return { status: result.status, headers: MATCHES_CACHE_HEADERS, body: result.body };
  } catch {
    return { status: 502, headers: {}, body: { matches: [], message: "今日赛事数据获取失败，请稍后重试。" } };
  }
}

export default async function handler(request, response) {
  const result = await handleMatchesRequest({
    method: request.method,
    url: request.url,
    query: request.query,
  });
  sendJsonResult(response, result);
}
