import { useMemo, useState } from "react";
import { explainRecommendation } from "./domain/explanations";
import { buildAnalysis } from "./domain/recommendations";
import type { Match, Recommendation } from "./domain/types";
import { todayMatches } from "./fixtures/worldCupMatches";
import { Disclaimer } from "./components/Disclaimer";
import "./styles.css";

export default function App() {
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const analysis = useMemo(() => buildAnalysis(todayMatches), []);

  const openMatch = (match: Match) => {
    const recommendation =
      analysis.safePicks.find((item) => item.match.id === match.id) ??
      analysis.valuePicks.find((item) => item.match.id === match.id) ??
      analysis.trapMatches.find((item) => item.match.id === match.id);
    if (recommendation) setSelected(recommendation);
  };

  return (
    <main className="app-shell">
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

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">今日世界杯赛事</p>
            <h2>{todayMatches.length} 场比赛待分析</h2>
          </div>
          <button className="primary-button" onClick={() => setHasAnalysis(true)}>
            开始分析
          </button>
        </div>
        <div className="match-list">
          {todayMatches.map((match) => (
            <button className="match-row" key={match.id} onClick={() => openMatch(match)}>
              <span>{match.kickoffTime}</span>
              <strong>
                {match.homeTeam.name} VS {match.awayTeam.name}
              </strong>
              <em>{match.odds?.handicap ?? "盘口缺失"}</em>
            </button>
          ))}
        </div>
      </section>

      {hasAnalysis && (
        <>
          <section className="recommendation-grid">
            <RecommendationColumn title="今日稳胆 TOP3" items={analysis.safePicks} onSelect={setSelected} />
            <RecommendationColumn title="今日价值投注 TOP3" items={analysis.valuePicks} onSelect={setSelected} />
            <RecommendationColumn title="今日避坑比赛" items={analysis.trapMatches} onSelect={setSelected} />
          </section>
          <section className="panel">
            <h2>推荐串关</h2>
            <div className="parlay-grid">
              {analysis.parlayPlans.map((plan) => (
                <article className="parlay-card" key={plan.id}>
                  <span>{plan.label}</span>
                  <strong>{plan.type}</strong>
                  <p>示例投入：{plan.sampleStake} 元</p>
                  <p>风险：{plan.risk}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <Disclaimer />

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setSelected(null)}>
              关闭
            </button>
            <h2>
              {selected.match.homeTeam.name} VS {selected.match.awayTeam.name}
            </h2>
            <p>
              {selected.match.kickoffTime} 开赛 · 推荐方向：{selected.score.direction}
            </p>
            <div className="detail-grid">
              <div>
                <strong>{selected.match.homeTeam.name}</strong>
                <span>FIFA {selected.match.homeTeam.fifaRank}</span>
              </div>
              <div>
                <strong>{selected.match.awayTeam.name}</strong>
                <span>FIFA {selected.match.awayTeam.fifaRank}</span>
              </div>
            </div>
            <h3>评分拆解</h3>
            <ul className="breakdown-list">
              {Object.entries(selected.score.breakdown).map(([key, value]) => (
                <li key={key}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </li>
              ))}
            </ul>
            <h3>AI解释</h3>
            <p>{explainRecommendation(selected)}</p>
          </section>
        </div>
      )}
    </main>
  );
}

function RecommendationColumn({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: Recommendation[];
  onSelect: (item: Recommendation) => void;
}) {
  return (
    <section className="panel compact-panel">
      <h2>{title}</h2>
      {items.map((item, index) => (
        <article className="recommendation-card" key={item.id}>
          <span>#{index + 1}</span>
          <strong>{item.title}</strong>
          <p>
            信心：{item.score.confidence} · 风险：{item.score.risk}
          </p>
          <p>{item.reason}</p>
          <button onClick={() => onSelect(item)}>查看详情</button>
        </article>
      ))}
    </section>
  );
}
