import type { AutoOddsStatus } from "../App";
import type { AnalysisResult, Match } from "../domain/types";
import type { MatchServiceIssue } from "../services/matchService";
import { MatchList } from "./MatchList";
import { ParlayPlans } from "./ParlayPlans";
import { RecommendationSection } from "./RecommendationSection";

export function Dashboard({
  matches,
  dataIssue,
  autoOddsStatus,
  hasAnalysis,
  analysis,
  onAnalyze,
  onAutoFetchOdds,
}: {
  matches: Match[];
  dataIssue: MatchServiceIssue | null;
  autoOddsStatus: AutoOddsStatus;
  hasAnalysis: boolean;
  analysis: AnalysisResult;
  onAnalyze: () => void;
  onAutoFetchOdds: () => void;
}) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">世界杯竞彩决策助手</p>
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
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">今日世界杯赛事</p>
            <h2>{matches.length} 场比赛待分析</h2>
          </div>
          <div className="section-actions">
            <button
              className="secondary-button"
              disabled={autoOddsStatus.state === "loading"}
              onClick={onAutoFetchOdds}
            >
              {autoOddsStatus.state === "loading" ? "获取中..." : "自动获取赔率"}
            </button>
            <button className="primary-button" onClick={onAnalyze}>
              开始分析
            </button>
          </div>
        </div>
        {autoOddsStatus.state !== "idle" && autoOddsStatus.message && (
          <p className={`odds-fetch-status ${autoOddsStatus.state}`}>{autoOddsStatus.message}</p>
        )}
        <MatchList matches={matches} />
      </section>

      {hasAnalysis && (
        <>
          <section className="recommendation-grid">
            <RecommendationSection title="今日稳胆前三" items={analysis.safePicks} />
            <RecommendationSection title="今日价值前三" items={analysis.valuePicks} />
            <RecommendationSection title="今日避坑比赛" items={analysis.trapMatches} />
          </section>
          <ParlayPlans plans={analysis.parlayPlans} />
        </>
      )}
    </>
  );
}
