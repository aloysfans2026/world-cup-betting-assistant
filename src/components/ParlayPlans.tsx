import type { ParlayPlan } from "../domain/types";

export function ParlayPlans({ plans }: { plans: ParlayPlan[] }) {
  return (
    <section className="panel">
      <h2>推荐串关</h2>
      <div className="parlay-grid">
        {plans.map((plan) => (
          <article className="parlay-card" key={plan.id}>
            <span>{plan.label}</span>
            <strong>{plan.type}</strong>
            <p>示例投入：{plan.sampleStake} 元</p>
            <p>风险：{plan.risk}</p>
            <small>{plan.picks.map((item) => item.title).join(" / ")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
