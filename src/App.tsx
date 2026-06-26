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

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayTime(value: string | undefined): string {
  if (!value) return "刚刚";
  return value.match(/\d{2}:\d{2}/)?.[0] ?? value;
}

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchIssue, setMatchIssue] = useState<MatchServiceIssue | null>(null);
  const [oddsByMatchId, setOddsByMatchId] = useState<OddsByMatchId>({});
  const [autoOddsStatus, setAutoOddsStatus] = useState<AutoOddsStatus>({ state: "idle" });
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const matchesWithOdds = useMemo(() => applyOddsToMatches(matches, oddsByMatchId), [matches, oddsByMatchId]);
  const analysis = useMemo(() => buildAnalysis(matchesWithOdds), [matchesWithOdds]);

  useEffect(() => {
    let isCurrent = true;

    getTodayMatches().then((result) => {
      if (!isCurrent) return;
      setMatches(result.matches);
      setMatchIssue(result.issue ?? null);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleAutoFetchOdds = async () => {
    if (matches.length === 0) {
      setAutoOddsStatus({ state: "error", message: "今日暂无世界杯比赛。" });
      return;
    }

    const date = formatLocalDate(new Date());
    setAutoOddsStatus({ state: "loading", message: "正在获取今日公开赔率..." });

    const result = await fetchOddsFromAppApi(date);
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
        dataIssue={matchIssue}
        autoOddsStatus={autoOddsStatus}
        hasAnalysis={hasAnalysis}
        analysis={analysis}
        onAnalyze={() => setHasAnalysis(true)}
        onAutoFetchOdds={handleAutoFetchOdds}
      />
      <Disclaimer />
    </main>
  );
}
