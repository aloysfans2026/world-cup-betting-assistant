import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Disclaimer } from "./components/Disclaimer";
import { buildAnalysis } from "./domain/recommendations";
import type { Match } from "./domain/types";
import { getTodayMatches, type MatchServiceIssue } from "./services/matchService";
import {
  applyOddsToMatches,
  fetchOddsFromAppApi,
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
  label: string;
  displayDate: string;
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

function labelForDate(date: Date, today: Date): string {
  const difference = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (difference === -1) return "昨天";
  if (difference === 0) return "今天";
  if (difference === 1) return "明天";
  return formatTabDate(date);
}

function buildDateTabs(today: Date): DateTab[] {
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const date = addDays(today, offset);
    return {
      date: formatLocalDate(date),
      label: labelForDate(date, today),
      displayDate: formatTabDate(date),
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
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(today));
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchIssue, setMatchIssue] = useState<MatchServiceIssue | null>(null);
  const [oddsByMatchId, setOddsByMatchId] = useState<OddsByMatchId>({});
  const [autoOddsStatus, setAutoOddsStatus] = useState<AutoOddsStatus>({ state: "idle" });
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const sortedMatches = useMemo(() => sortMatchesByKickoff(matches), [matches]);
  const matchesWithOdds = useMemo(() => applyOddsToMatches(sortedMatches, oddsByMatchId), [oddsByMatchId, sortedMatches]);
  const analysis = useMemo(() => buildAnalysis(matchesWithOdds), [matchesWithOdds]);

  useEffect(() => {
    let isCurrent = true;

    setOddsByMatchId({});
    setAutoOddsStatus({ state: "idle" });
    setHasAnalysis(false);

    getTodayMatches({ date: new Date(`${selectedDate}T00:00:00`) }).then((result) => {
      if (!isCurrent) return;
      setMatches(result.matches);
      setMatchIssue(result.issue ?? null);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedDate]);

  const handleAutoFetchOdds = async () => {
    if (matches.length === 0) {
      setAutoOddsStatus({ state: "error", message: "今日暂无世界杯比赛。" });
      return;
    }

    setAutoOddsStatus({ state: "loading", message: "正在获取今日公开赔率..." });

    const result = await fetchOddsFromAppApi(selectedDate);
    if (!result.success || result.odds.length === 0) {
      setAutoOddsStatus({
        state: "error",
        message: "今日赔率获取失败，请稍后重试。",
      });
      return;
    }

    const mergeResult = mergeOddsIntoMatches(matches, result.odds, oddsByMatchId);

    if (mergeResult.matchedCount === 0) {
      setAutoOddsStatus({
        state: "error",
        message: "今日赔率获取失败，请稍后重试。",
      });
      return;
    }

    setOddsByMatchId(mergeResult.oddsByMatchId);

    const details = [`赔率已更新`, `更新 ${displayTime(result.updatedAt)}`, `已填充 ${mergeResult.matchedCount} 场`];

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
