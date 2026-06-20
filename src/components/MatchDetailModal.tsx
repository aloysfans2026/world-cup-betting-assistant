import { explainRecommendation } from "../domain/explanations";
import type { Recommendation } from "../domain/types";

const labels: Record<string, string> = {
  strength: "球队实力",
  form: "近期状态",
  attack: "进攻能力",
  defense: "防守能力",
  headToHead: "历史交锋",
  market: "市场赔率",
};

export function MatchDetailModal({
  recommendation,
  onClose,
}: {
  recommendation: Recommendation;
  onClose: () => void;
}) {
  const { match, score } = recommendation;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          关闭
        </button>
        <h2>
          {match.homeTeam.name} VS {match.awayTeam.name}
        </h2>
        <p>
          {match.kickoffTime} 开赛 · 推荐方向：{score.direction}
        </p>
        <div className="detail-grid">
          <div>
            <strong>{match.homeTeam.name}</strong>
            <span>FIFA {match.homeTeam.fifaRank}</span>
          </div>
          <div>
            <strong>{match.awayTeam.name}</strong>
            <span>FIFA {match.awayTeam.fifaRank}</span>
          </div>
        </div>
        <h3>最近5场</h3>
        <div className="form-grid">
          <p>
            {match.homeTeam.name}：{match.homeTeam.recentForm.map((item) => item.result).join(" ")}
          </p>
          <p>
            {match.awayTeam.name}：{match.awayTeam.recentForm.map((item) => item.result).join(" ")}
          </p>
        </div>
        <h3>评分拆解</h3>
        <ul className="breakdown-list">
          {Object.entries(score.breakdown).map(([key, value]) => (
            <li key={key}>
              <span>{labels[key]}</span>
              <strong>{value}</strong>
            </li>
          ))}
        </ul>
        <h3>AI解释</h3>
        <p>{explainRecommendation(recommendation)}</p>
      </section>
    </div>
  );
}
