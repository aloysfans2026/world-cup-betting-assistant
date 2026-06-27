import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Disclaimer } from "./components/Disclaimer";
import { buildAnalysis } from "./domain/recommendations";
import type { Match } from "./domain/types";
import { getMatchesForDateRange, type MatchServiceIssue } from "./services/matchService";
import {
  applyOddsToMatches,
  fetchOddsRangeFromAppApi,
  mergeOddsIntoMatches,
  type OddsByMatchId,
} from "./services/oddsService";
import "./styles.css";

export type AutoOddsStatusState = "idle" | "loading" | "success" | "error";

export interface AutoOddsStatus {
  state: AutoOddsStatusState;
  message?: string;
}

export interface DateTab {
  date: string;
  displayDate: string;
  isToday: boolean;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatTabDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`;
}

function buildDateTabs(today: Date): DateTab[] {
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const date = addDays(today, offset);
    return {
      date: formatLocalDate(date),
      displayDate: formatTabDate(date),
      isToday: offset === 0,
    };
  });
}

function kickoffSortValue(match: Match): string {
  const kickoffTime = /^\d{2}:\d{2}$/.test(match.kickoffTime) ? match.kickoffTime : "99:99";
  return `${match.matchDate} ${kickoffTime}`;
}

function sortMatchesByKickoff(matches: Match[]): Match[] {
  return [...matches].sort((left, right) => kickoffSortValue(left).localeCompare(kickoffSortValue(right), "zh-CN"));
}

function displayTime(value: string | undefined): string {
  if (!value) return "刚刚";
  return value.match(/\d{2}:\d{2}/)?.[0] ?? value;
}

export default function App() {
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const dateTabs = useMemo(() => buildDateTabs(today), [today]);
  const weekDateFrom = dateTabs[0]?.date ?? formatLocalDate(today);
  const weekDateTo = dateTabs[dateTabs.length - 1]?.date ?? formatLocalDate(today);
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(today));
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [matchIssue, setMatchIssue] = useState<MatchServiceIssue | null>(null);
  const [oddsByMatchId, setOddsByMatchId] = useState<OddsByMatchId>({});
  const [autoOddsStatus, setAutoOddsStatus] = useState<AutoOddsStatus>({ state: "idle" });
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const matches = useMemo(() => allMatches.filter((match) => match.matchDate === selectedDate), [allMatches, selectedDate]);
  const sortedMatches = useMemo(() => sortMatchesByKickoff(matches), [matches]);
  const matchesWithOdds = useMemo(() => applyOddsToMatches(sortedMatches, oddsByMatchId), [oddsByMatchId, sortedMatches]);
  const analysis = useMemo(() => buildAnalysis(matchesWithOdds), [matchesWithOdds]);

  useEffect(() => {
    let isCurrent = true;

    setOddsByMatchId({});
    setAutoOddsStatus({ state: "idle" });
    setHasAnalysis(false);

    getMatchesForDateRange({ dateFrom: weekDateFrom, dateTo: weekDateTo }).then((result) => {
      if (!isCurrent) return;
      setAllMatches(result.matches);
      setMatchIssue(result.issue ?? null);
    });

    return () => {
      isCurrent = false;
    };
  }, [weekDateFrom, weekDateTo]);

  useEffect(() => {
    setAutoOddsStatus({ state: "idle" });
    setHasAnalysis(false);
  }, [selectedDate]);

  const handleAutoFetchOdds = async () => {
    if (matches.length === 0) {
      setAutoOddsStatus({ state: "error", message: "今日暂无世界杯比赛。" });
      return;
    }

    setOddsByMatchId({});
    setAutoOddsStatus({ state: "loading", message: "正在获取今日公开赔率..." });

    const result = await fetchOddsRangeFromAppApi(weekDateFrom, weekDateTo);
    if (!result.success || result.odds.length === 0) {
      setAutoOddsStatus({
        state: "error",
        message: "今日赔率获取失败，请稍后重试。",
      });
      return;
    }

    const mergeResult = mergeOddsIntoMatches(allMatches, result.odds, oddsByMatchId);

    if (mergeResult.matchedCount === 0) {
      setAutoOddsStatus({
        state: "error",
        message: "今日赔率获取失败，请稍后重试。",
      });
      return;
    }

    setOddsByMatchId(mergeResult.oddsByMatchId);

    const currentDateFilledCount = matches.filter((match) => mergeResult.oddsByMatchId[match.id]).length;
    const details = [`赔率已更新`, `当前日期 ${currentDateFilledCount}/${matches.length} 场`];
    if (currentDateFilledCount < matches.length) {
      details.push("部分比赛暂无胜平负赔率");
    } else if (result.updatedAt) {
      details.push(`更新 ${displayTime(result.updatedAt)}`);
    }

    setAutoOddsStatus({
      state: "success",
      message: details.join(" · "),
    });
  };

  return (
    <main className="app-shell">
      <Dashboard
        matches={matchesWithOdds}
        dateTabs={dateTabs}
        dataIssue={matchIssue}
        autoOddsStatus={autoOddsStatus}
        selectedDate={selectedDate}
        hasAnalysis={hasAnalysis}
        analysis={analysis}
        onAnalyze={() => setHasAnalysis(true)}
        onAutoFetchOdds={handleAutoFetchOdds}
        onDateChange={setSelectedDate}
      />
      <Disclaimer />
    </main>
  );
}
