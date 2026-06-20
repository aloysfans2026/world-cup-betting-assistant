import type { Recommendation } from "../domain/types";

export function RecommendationSection({
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
      {items.length === 0 && <p className="empty-state">推荐结果不足，请谨慎参考。</p>}
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
