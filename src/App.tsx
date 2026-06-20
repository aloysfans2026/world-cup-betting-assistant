import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Disclaimer } from "./components/Disclaimer";
import { MatchDetailModal } from "./components/MatchDetailModal";
import { buildAnalysis } from "./domain/recommendations";
import type { Match, Recommendation } from "./domain/types";
import { getTodayMatches } from "./services/matchService";
import "./styles.css";

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const analysis = useMemo(() => buildAnalysis(matches), [matches]);

  useEffect(() => {
    let isCurrent = true;

    getTodayMatches().then((loadedMatches) => {
      if (isCurrent) setMatches(loadedMatches);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

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
        matches={matches}
        hasAnalysis={hasAnalysis}
        analysis={analysis}
        onAnalyze={() => setHasAnalysis(true)}
        onSelectMatch={openMatch}
        onSelectRecommendation={setSelected}
      />
      <Disclaimer />
      {selected && <MatchDetailModal recommendation={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
