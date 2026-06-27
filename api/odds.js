const SPORTTERY_ODDS_URL =
  "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry?channel=c&poolCode=hhad,had";
const FALLBACK_500_ODDS_URL = "https://ews.500.com/static/ews/jczq/jczq.json";
const FALLBACK_500_MATCHES_URL = "https://trade.500.com/jczq/";
const CACHE_TTL_MS = 120_000;
const FETCH_TIMEOUT_MS = 8_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const GB18030_DECODER = new TextDecoder("gb18030");

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

function sportteryUpdatedAt(rootValue, had) {
  const updateDate = asString(had.updateDate);
  const updateTime = asString(had.updateTime);
  if (updateDate && updateTime) return `${updateDate} ${updateTime}`;

  return asString(rootValue.lastUpdateTime) || undefined;
}

function rangeFromInput(input) {
  if (typeof input === "string") return { dateFrom: input, dateTo: input };
  return {
    dateFrom: asString(input?.dateFrom || input?.date),
    dateTo: asString(input?.dateTo || input?.dateFrom || input?.date),
  };
}

export function parseSportteryOdds(response, dateOrRange) {
  const { dateFrom, dateTo } = rangeFromInput(dateOrRange);
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

      const matchDate = asString(match.matchDate) || asString(match.businessDate) || groupBusinessDate;
      if (!inDateRange(matchDate, dateFrom, dateTo)) return [];

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

export function parseFallback500Odds(response, dateOrRange) {
  const { dateFrom, dateTo } = rangeFromInput(dateOrRange);
  const root = asRecord(response);
  const data = asRecord(root?.data);
  if (!data) return [];

  return asArray(data.matches).flatMap((matchRaw) => {
    const match = asRecord(matchRaw);
    if (!match) return [];

    const matchDate = asString(match.matchdate || match.matchDate || match.ownerdate);
    if (!inDateRange(matchDate, dateFrom, dateTo)) return [];

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

function parseNspfOddsFrom500Row(rowHtml) {
  const odds = {};
  for (const button of rowHtml.matchAll(/<p\b[^>]*data-type="nspf"[^>]*>/g)) {
    const attrs = parseAttributes(button[0]);
    const odd = parseOdd(attrs["data-sp"]);
    if (!odd) continue;

    if (attrs["data-value"] === "3") odds.homeWin = odd;
    if (attrs["data-value"] === "1") odds.draw = odd;
    if (attrs["data-value"] === "0") odds.awayWin = odd;
  }

  return odds.homeWin && odds.draw && odds.awayWin ? odds : null;
}

export function parseFallback500HtmlOdds(html, dateOrRange) {
  const { dateFrom, dateTo } = rangeFromInput(dateOrRange);

  return [...asString(html).matchAll(/<tr\b[^>]*class="[^"]*\bbet-tb-tr\b[^"]*"[^>]*>[\s\S]*?<\/tr>/g)].flatMap(
    (rowMatch) => {
      const rowHtml = rowMatch[0];
      const openTag = rowHtml.match(/<tr\b[^>]*>/)?.[0] || "";
      const attrs = parseAttributes(openTag);
      const leagueName = asString(attrs["data-simpleleague"]) || "世界杯";
      const matchDate = asString(attrs["data-matchdate"]);
      if (!leagueName.includes("世界杯") || !inDateRange(matchDate, dateFrom, dateTo)) return [];

      const parsedOdds = parseNspfOddsFrom500Row(rowHtml);
      const homeTeam = asString(attrs["data-homesxname"]);
      const awayTeam = asString(attrs["data-awaysxname"]);
      if (!parsedOdds || !homeTeam || !awayTeam) return [];

      const quote = {
        homeTeam,
        awayTeam,
        homeWin: parsedOdds.homeWin,
        draw: parsedOdds.draw,
        awayWin: parsedOdds.awayWin,
        updatedAt: matchDate && attrs["data-matchtime"] ? `${matchDate} ${attrs["data-matchtime"]}` : undefined,
        source: "500",
      };

      const matchId = asString(attrs["data-id"]);
      const matchNo = asString(attrs["data-matchnum"]);
      if (matchId) quote.matchId = matchId;
      if (matchNo) {
        quote.matchNo = matchNo;
        quote.matchNumStr = matchNo;
      }

      return [quote];
    },
  );
}

function latestUpdatedAt(odds, now) {
  return odds.find((quote) => quote.updatedAt)?.updatedAt || new Date(now()).toISOString();
}

function mergeQuotes(primaryOdds, fallbackOdds) {
  const merged = [...primaryOdds];
  fallbackOdds.forEach((quote) => {
    const exists = merged.some((existing) => {
      if (quote.matchId && existing.matchId && quote.matchId === existing.matchId) return true;
      if (quote.matchNo && existing.matchNo && quote.matchNo === existing.matchNo) return true;
      return quote.homeTeam === existing.homeTeam && quote.awayTeam === existing.awayTeam;
    });
    if (!exists) merged.push(quote);
  });
  return merged;
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

async function fetchPublicDecodedText({ fetcher, timeoutMs, url }) {
  const response = await fetchWithTimeout(
    fetcher,
    url,
    {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    },
    timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`500彩票网公开页面返回 ${response.status}`);
  }

  const body = await response.arrayBuffer();
  return GB18030_DECODER.decode(body);
}

async function fetchFallback500HtmlOddsRange({ dateFrom, dateTo, fetcher, timeoutMs }) {
  const processDates = datesBetween(addDays(dateFrom, -1), dateTo);
  const pages = await Promise.allSettled(
    processDates.map(async (processDate) => {
      const url = new URL(FALLBACK_500_MATCHES_URL);
      url.searchParams.set("date", processDate);
      return fetchPublicDecodedText({ fetcher, timeoutMs, url: url.toString() });
    }),
  );

  return pages.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    return parseFallback500HtmlOdds(result.value, { dateFrom, dateTo });
  });
}

function successBody({ dateFrom, dateTo, errors, fallbackUsed, now, odds, source }) {
  return {
    success: true,
    date: dateFrom === dateTo ? dateFrom : undefined,
    dateFrom,
    dateTo,
    source,
    fallbackUsed,
    updatedAt: latestUpdatedAt(odds, now),
    odds,
    errors,
  };
}

function failureBody({ dateFrom, dateTo, errors, fallbackUsed }) {
  return {
    success: false,
    date: dateFrom === dateTo ? dateFrom : undefined,
    dateFrom,
    dateTo,
    source: null,
    fallbackUsed,
    odds: [],
    message: "今日赔率获取失败，请稍后重试。",
    errors,
  };
}

export async function fetchOddsWithFallback({
  date,
  dateFrom,
  dateTo,
  fetcher = fetch,
  now = Date.now,
  timeoutMs = FETCH_TIMEOUT_MS,
} = {}) {
  const errors = [];
  const range = {
    dateFrom: dateFrom || date,
    dateTo: dateTo || dateFrom || date,
  };
  let sportteryOdds = [];
  let fallbackOdds = [];

  try {
    const sportteryData = await fetchPublicJson({ fetcher, timeoutMs, url: SPORTTERY_ODDS_URL });
    sportteryOdds = parseSportteryOdds(sportteryData, range);

    if (sportteryOdds.length === 0) errors.push("中国竞彩网接口暂无可用胜平负赔率");
  } catch (error) {
    errors.push(`中国竞彩网接口失败：${error instanceof Error ? error.message : "未知错误"}`);
  }

  try {
    const fallbackData = await fetchPublicJson({ fetcher, timeoutMs, url: FALLBACK_500_ODDS_URL });
    fallbackOdds = parseFallback500Odds(fallbackData, range);
  } catch (error) {
    errors.push(`500彩票网接口失败：${error instanceof Error ? error.message : "未知错误"}`);
  }

  try {
    fallbackOdds = fallbackOdds.concat(
      await fetchFallback500HtmlOddsRange({
        ...range,
        fetcher,
        timeoutMs,
      }),
    );
  } catch (error) {
    errors.push(`500彩票网历史页面失败：${error instanceof Error ? error.message : "未知错误"}`);
  }

  const odds = mergeQuotes(sportteryOdds, fallbackOdds);
  if (odds.length > 0) {
    return {
      status: 200,
      body: successBody({
        ...range,
        errors,
        fallbackUsed: fallbackOdds.length > 0,
        now,
        odds,
        source: sportteryOdds.length > 0 ? "sporttery" : "500",
      }),
    };
  }

  errors.push("公开接口暂无可用胜平负赔率");
  return {
    status: 502,
    body: failureBody({ ...range, errors, fallbackUsed: true }),
  };
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function queryFromInput({ query, url: requestUrl } = {}) {
  const url = new URL(requestUrl || "/", "http://localhost");
  const date = firstQueryValue(query?.date) || url.searchParams.get("date");
  const dateFrom = firstQueryValue(query?.dateFrom) || url.searchParams.get("dateFrom");
  const dateTo = firstQueryValue(query?.dateTo) || url.searchParams.get("dateTo");

  return { date, dateFrom, dateTo };
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function cacheKey({ date, dateFrom, dateTo }) {
  return date || `${dateFrom}:${dateTo}`;
}

function readCache(key, now) {
  const cached = cache.get(key);
  if (!cached || cached.expiresAt <= now()) return null;
  return cached.result;
}

function writeCache(key, result, now) {
  if (result.status !== 200) return;
  cache.set(key, {
    expiresAt: now() + CACHE_TTL_MS,
    result,
  });
}

function sendJsonResult(response, result) {
  Object.entries(result.headers || {}).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
  response.status(result.status).json(result.body);
}

export async function handleOddsRequest({
  method = "GET",
  url,
  query: rawQuery,
  fetcher = fetch,
  now = Date.now,
  timeoutMs = FETCH_TIMEOUT_MS,
} = {}) {
  if (method !== "GET") {
    return { status: 405, headers: {}, body: { success: false, message: "只支持 GET 请求" } };
  }

  const query = queryFromInput({ query: rawQuery, url });
  const dateFrom = query.dateFrom || query.date;
  const dateTo = query.dateTo || dateFrom;
  if (!isValidDate(dateFrom) || !isValidDate(dateTo) || dateFrom > dateTo) {
    return {
      status: 400,
      headers: {},
      body: { success: false, message: "缺少或无效的日期，格式应为 YYYY-MM-DD" },
    };
  }

  const key = cacheKey({ date: query.date, dateFrom, dateTo });
  const cached = readCache(key, now);
  if (cached) {
    return {
      status: cached.status,
      headers: {
        "Cache-Control": "s-maxage=120, stale-while-revalidate=180",
        "X-Odds-Cache": "HIT",
      },
      body: cached.body,
    };
  }

  const result = await fetchOddsWithFallback({ dateFrom, dateTo, fetcher, now, timeoutMs });
  writeCache(key, result, now);
  return {
    status: result.status,
    headers: {
      "Cache-Control": "s-maxage=120, stale-while-revalidate=180",
      "X-Odds-Cache": "MISS",
    },
    body: result.body,
  };
}

export default async function handler(request, response) {
  const result = await handleOddsRequest({
    method: request.method,
    url: request.url,
    query: request.query,
  });
  sendJsonResult(response, result);
}
