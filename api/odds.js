const SPORTTERY_ODDS_URL =
  "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=hhad,had";
const FALLBACK_500_ODDS_URL = "https://ews.500.com/static/ews/jczq/jczq.json";
const CACHE_TTL_MS = 120_000;
const FETCH_TIMEOUT_MS = 8_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const cache = new Map();

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

function parseOdd(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : null;
}

function sportteryUpdatedAt(rootValue, had) {
  const updateDate = asString(had.updateDate);
  const updateTime = asString(had.updateTime);
  if (updateDate && updateTime) return `${updateDate} ${updateTime}`;

  return asString(rootValue.lastUpdateTime) || undefined;
}

export function parseSportteryOdds(response, date) {
  const root = asRecord(response);
  const value = asRecord(root?.value);
  if (!value) return [];

  return asArray(value.matchInfoList).flatMap((groupRaw) => {
    const group = asRecord(groupRaw);
    if (!group) return [];

    const groupBusinessDate = asString(group.businessDate);

    return asArray(group.subMatchList).flatMap((matchRaw) => {
      const match = asRecord(matchRaw);
      if (!match) return [];

      const businessDate = asString(match.businessDate) || groupBusinessDate;
      if (businessDate !== date) return [];

      const had = asRecord(match.had);
      if (!had) return [];

      const homeWin = parseOdd(had.h);
      const draw = parseOdd(had.d);
      const awayWin = parseOdd(had.a);
      const homeTeam = asString(match.homeTeamAllName || match.homeTeamName || match.homeTeamAbbName);
      const awayTeam = asString(match.awayTeamAllName || match.awayTeamName || match.awayTeamAbbName);
      if (!homeWin || !draw || !awayWin || !homeTeam || !awayTeam) return [];

      const quote = {
        homeTeam,
        awayTeam,
        homeWin,
        draw,
        awayWin,
        updatedAt: sportteryUpdatedAt(value, had),
        source: "sporttery",
      };

      const matchId = asString(match.matchId);
      const matchNo = asString(match.matchNumStr || match.matchNo);
      if (matchId) quote.matchId = matchId;
      if (matchNo) {
        quote.matchNo = matchNo;
        quote.matchNumStr = matchNo;
      }

      return [quote];
    });
  });
}

export function parseFallback500Odds(response, date) {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  if (!data) return [];

  return asArray(data.matches).flatMap((matchRaw) => {
    const match = asRecord(matchRaw);
    if (!match) return [];

    if (asString(match.ownerdate) !== date) return [];

    const extraInfo = asRecord(match.extra_info);
    const currentOdds = asString(extraInfo?.currodds);
    const [homeWinRaw, drawRaw, awayWinRaw] = currentOdds.match(/\d+(?:\.\d+)?/g) ?? [];
    const homeWin = parseOdd(homeWinRaw);
    const draw = parseOdd(drawRaw);
    const awayWin = parseOdd(awayWinRaw);
    const homeTeam = asString(match.homesxname || match.homename || match.homeName);
    const awayTeam = asString(match.awaysxname || match.awayname || match.awayName);
    if (!homeWin || !draw || !awayWin || !homeTeam || !awayTeam) return [];

    const quote = {
      homeTeam,
      awayTeam,
      homeWin,
      draw,
      awayWin,
      updatedAt: asString(match.matchtime) || undefined,
      source: "500",
    };

    const matchNo = asString(match.order || match.matchNo);
    if (matchNo) {
      quote.matchNo = matchNo;
      quote.matchNumStr = matchNo;
    }

    return [quote];
  });
}

function latestUpdatedAt(odds, now) {
  return odds.find((quote) => quote.updatedAt)?.updatedAt || new Date(now()).toISOString();
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

async function fetchPublicJson({ fetcher, timeoutMs, url }) {
  const response = await fetchWithTimeout(
    fetcher,
    url,
    {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "application/json,text/plain,*/*",
      },
    },
    timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`公开赔率接口返回 ${response.status}`);
  }

  const bodyText = await response.text();
  if (!bodyText.trim()) {
    throw new Error("公开赔率接口返回空内容");
  }

  return JSON.parse(bodyText.replace(/^\uFEFF/, ""));
}

function successBody({ date, errors, fallbackUsed, now, odds, source }) {
  return {
    success: true,
    date,
    source,
    fallbackUsed,
    updatedAt: latestUpdatedAt(odds, now),
    odds,
    errors,
  };
}

function failureBody({ date, errors, fallbackUsed }) {
  return {
    success: false,
    date,
    source: null,
    fallbackUsed,
    odds: [],
    message: "今日赔率获取失败，请稍后重试。",
    errors,
  };
}

export async function fetchOddsWithFallback({
  date,
  fetcher = fetch,
  now = Date.now,
  timeoutMs = FETCH_TIMEOUT_MS,
} = {}) {
  const errors = [];

  try {
    const sportteryData = await fetchPublicJson({ fetcher, timeoutMs, url: SPORTTERY_ODDS_URL });
    const sportteryOdds = parseSportteryOdds(sportteryData, date);

    if (sportteryOdds.length > 0) {
      return {
        status: 200,
        body: successBody({
          date,
          errors,
          fallbackUsed: false,
          now,
          odds: sportteryOdds,
          source: "sporttery",
        }),
      };
    }

    errors.push("中国竞彩网接口暂无可用胜平负赔率");
  } catch (error) {
    errors.push(`中国竞彩网接口失败：${error instanceof Error ? error.message : "未知错误"}`);
  }

  try {
    const fallbackData = await fetchPublicJson({ fetcher, timeoutMs, url: FALLBACK_500_ODDS_URL });
    const fallbackOdds = parseFallback500Odds(fallbackData, date);

    if (fallbackOdds.length > 0) {
      return {
        status: 200,
        body: successBody({
          date,
          errors,
          fallbackUsed: true,
          now,
          odds: fallbackOdds,
          source: "500",
        }),
      };
    }

    errors.push("500彩票网接口暂无可用胜平负赔率");
  } catch (error) {
    errors.push(`500彩票网接口失败：${error instanceof Error ? error.message : "未知错误"}`);
  }

  return {
    status: 502,
    body: failureBody({ date, errors, fallbackUsed: true }),
  };
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function queryFromRequest(request) {
  const url = new URL(request.url || "/", "http://localhost");
  const date = firstQueryValue(request.query?.date) || url.searchParams.get("date");

  return { date };
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function readCache(date, now) {
  const cached = cache.get(date);
  if (!cached || cached.expiresAt <= now()) return null;
  return cached.result;
}

function writeCache(date, result, now) {
  if (result.status !== 200) return;
  cache.set(date, {
    expiresAt: now() + CACHE_TTL_MS,
    result,
  });
}

function json(response, status, body) {
  response.status(status).json(body);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    json(response, 405, { success: false, message: "只支持 GET 请求" });
    return;
  }

  const { date } = queryFromRequest(request);
  if (!isValidDate(date)) {
    json(response, 400, { success: false, message: "缺少或无效的 date，格式应为 YYYY-MM-DD" });
    return;
  }

  const now = Date.now;
  const cached = readCache(date, now);
  if (cached) {
    response.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=180");
    response.setHeader("X-Odds-Cache", "HIT");
    json(response, cached.status, cached.body);
    return;
  }

  const result = await fetchOddsWithFallback({ date, now });
  writeCache(date, result, now);
  response.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=180");
  response.setHeader("X-Odds-Cache", "MISS");
  json(response, result.status, result.body);
}
