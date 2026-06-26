import type { AutoOddsStatus, DateTab } from "../App";
import type { AnalysisResult, Match } from "../domain/types";
import type { MatchServiceIssue } from "../services/matchService";
import { MatchList } from "./MatchList";
import { ParlayPlans } from "./ParlayPlans";
import { RecommendationSection } from "./RecommendationSection";

export function Dashboard({
  matches,
  dateTabs,
  dataIssue,
  autoOddsStatus,
  selectedDate,
  hasAnalysis,
  analysis,
  onAnalyze,
  onAutoFetchOdds,
  onDateChange,
}: {
  matches: Match[];
  dateTabs: DateTab[];
  dataIssue: MatchServiceIssue | null;
  autoOddsStatus: AutoOddsStatus;
  selectedDate: string;
  hasAnalysis: boolean;
  analysis: AnalysisResult;
  onAnalyze: () => void;
  onAutoFetchOdds: () => void;
  onDateChange: (date: string) => void;
}) {
  return (
    <>
      <section className="hero">
        <div>
          <h1>世界杯竞彩决策助手</h1>
          <p className="hero-copy">今日世界杯赛事</p>
          <p className="current-date">{selectedDate}</p>
          <div className="date-tabs" role="tablist" aria-label="选择比赛日期">
            {dateTabs.map((tab) => (
              <button
                aria-selected={tab.date === selectedDate}
                className={tab.date === selectedDate ? "date-tab active" : "date-tab"}
                key={tab.date}
                onClick={() => onDateChange(tab.date)}
                role="tab"
                type="button"
              >
                <span>{tab.label}</span>
                <small>{tab.displayDate}</small>
              </button>
            ))}
          </div>
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
            <p className="eyebrow">比赛列表</p>
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
