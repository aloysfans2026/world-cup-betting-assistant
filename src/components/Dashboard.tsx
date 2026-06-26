import type { AnalysisResult, Match, Recommendation } from "../domain/types";
import type { MatchServiceIssue } from "../services/matchService";
import type { RecognizedOddsRow } from "../services/ocrOddsService";
import type { ManualOddsByMatchId, ManualOddsInput } from "../services/oddsService";
import { MatchList } from "./MatchList";
import { ParlayPlans } from "./ParlayPlans";
import { RecommendationSection } from "./RecommendationSection";
import { ScreenshotOddsUploader } from "./ScreenshotOddsUploader";

export function Dashboard({
  matches,
  rawMatches,
  dataIssue,
  manualOdds,
  recognizedOddsRows,
  ocrMessage,
  isRecognizingOdds,
  hasAnalysis,
  analysis,
  onAnalyze,
  onSelectMatch,
  onSelectRecommendation,
  onApplyRecognizedOdds,
  onClearRecognizedOdds,
  onOcrMessageChange,
  onOddsChange,
  onRecognizedOddsRowsChange,
  onRecognizingOddsChange,
}: {
  matches: Match[];
  rawMatches: Match[];
  dataIssue: MatchServiceIssue | null;
  manualOdds: ManualOddsByMatchId;
  recognizedOddsRows: RecognizedOddsRow[];
  ocrMessage: string;
  isRecognizingOdds: boolean;
  hasAnalysis: boolean;
  analysis: AnalysisResult;
  onAnalyze: () => void;
  onSelectMatch: (match: Match) => void;
  onSelectRecommendation: (item: Recommendation) => void;
  onApplyRecognizedOdds: () => void;
  onClearRecognizedOdds: () => void;
  onOcrMessageChange: (message: string) => void;
  onOddsChange: (matchId: string, field: keyof ManualOddsInput, value: string) => void;
  onRecognizedOddsRowsChange: (rows: RecognizedOddsRow[]) => void;
  onRecognizingOddsChange: (isRecognizing: boolean) => void;
}) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">世界杯竞彩决策助手 MVP</p>
          <h1>30 秒看懂今天是否值得小额参与</h1>
          <p className="hero-copy">不是预测神器，只把比赛数据、推荐方向和风险提示放到一个清楚的决策面板里。</p>
        </div>
        <div className="summary-card">
          <span>今日结论</span>
          <strong>{hasAnalysis ? analysis.summary : "等待分析，先查看今日比赛。"}</strong>
        </div>
      </section>

      {dataIssue && (
        <section className="alert-panel" role="alert">
          <strong>{dataIssue.message}</strong>
          <span>{dataIssue.detail}</span>
        </section>
      )}

      <ScreenshotOddsUploader
        matches={rawMatches}
        rows={recognizedOddsRows}
        isRecognizing={isRecognizingOdds}
        message={ocrMessage}
        onApply={onApplyRecognizedOdds}
        onClear={onClearRecognizedOdds}
        onMessage={onOcrMessageChange}
        onRowsChange={onRecognizedOddsRowsChange}
        onRecognizingChange={onRecognizingOddsChange}
      />

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">今日世界杯赛事</p>
            <h2>{matches.length} 场比赛待分析</h2>
          </div>
          <button className="primary-button" onClick={onAnalyze}>
            开始分析
          </button>
        </div>
        <MatchList matches={matches} manualOdds={manualOdds} onOddsChange={onOddsChange} onSelect={onSelectMatch} />
      </section>

      {hasAnalysis && (
        <>
          <section className="recommendation-grid">
            <RecommendationSection title="今日稳胆 TOP3" items={analysis.safePicks} onSelect={onSelectRecommendation} />
            <RecommendationSection
              title="今日价值投注 TOP3"
              items={analysis.valuePicks}
              onSelect={onSelectRecommendation}
            />
            <RecommendationSection title="今日避坑比赛" items={analysis.trapMatches} onSelect={onSelectRecommendation} />
          </section>
          <ParlayPlans plans={analysis.parlayPlans} />
        </>
      )}
    </>
  );
}
