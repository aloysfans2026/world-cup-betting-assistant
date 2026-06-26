import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Disclaimer } from "./components/Disclaimer";
import { MatchDetailModal } from "./components/MatchDetailModal";
import { buildAnalysis } from "./domain/recommendations";
import type { Match, Recommendation } from "./domain/types";
import { applyRecognizedOdds, type RecognizedOddsRow } from "./services/ocrOddsService";
import { getTodayMatches, type MatchServiceIssue } from "./services/matchService";
import { applyManualOdds, readManualOdds, saveManualOdds, type ManualOddsByMatchId } from "./services/oddsService";
import "./styles.css";

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchIssue, setMatchIssue] = useState<MatchServiceIssue | null>(null);
  const [manualOdds, setManualOdds] = useState<ManualOddsByMatchId>(() => readManualOdds());
  const [recognizedOddsRows, setRecognizedOddsRows] = useState<RecognizedOddsRow[]>([]);
  const [ocrMessage, setOcrMessage] = useState("");
  const [isRecognizingOdds, setIsRecognizingOdds] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const matchesWithOdds = useMemo(() => applyManualOdds(matches, manualOdds), [matches, manualOdds]);
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

  useEffect(() => {
    saveManualOdds(manualOdds);
  }, [manualOdds]);

  const openMatch = (match: Match) => {
    if (!hasAnalysis) return;

    const recommendation =
      analysis.safePicks.find((item) => item.match.id === match.id) ??
      analysis.valuePicks.find((item) => item.match.id === match.id) ??
      analysis.trapMatches.find((item) => item.match.id === match.id);
    if (recommendation) setSelected(recommendation);
  };

  return (
    <main className="app-shell">
      <Dashboard
        matches={matchesWithOdds}
        rawMatches={matches}
        dataIssue={matchIssue}
        manualOdds={manualOdds}
        recognizedOddsRows={recognizedOddsRows}
        ocrMessage={ocrMessage}
        isRecognizingOdds={isRecognizingOdds}
        hasAnalysis={hasAnalysis}
        analysis={analysis}
        onAnalyze={() => setHasAnalysis(true)}
        onSelectMatch={openMatch}
        onSelectRecommendation={setSelected}
        onApplyRecognizedOdds={() => {
          setManualOdds((current) => applyRecognizedOdds(current, recognizedOddsRows));
          setOcrMessage("已应用到今日比赛。赔率来自截图识别，请人工核对。");
        }}
        onClearRecognizedOdds={() => {
          setRecognizedOddsRows([]);
          setOcrMessage("");
        }}
        onOcrMessageChange={setOcrMessage}
        onOddsChange={(matchId, field, value) => {
          setManualOdds((current) => ({
            ...current,
            [matchId]: {
              ...current[matchId],
              [field]: value,
              source: current[matchId]?.source ?? "manual",
            },
          }));
        }}
        onRecognizedOddsRowsChange={setRecognizedOddsRows}
        onRecognizingOddsChange={setIsRecognizingOdds}
      />
      <Disclaimer />
      {selected && <MatchDetailModal recommendation={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
