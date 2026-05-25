import { currency } from "../../lib/formatters.js";

export function Budgets({ categories, compact = false, onSelectCategory, onUpdateBudget }) {
  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="section-title">Second layer</p>
        <h2 className="text-xl font-black">Budgets</h2>
      </div>
      <div className={`grid gap-3 ${compact ? "md:grid-cols-2" : ""}`}>
        {categories.map((item) => (
          <article key={item.category} className="rounded-md border border-line bg-canvas p-3">
            <button className="mb-2 text-left text-base font-black" type="button" onClick={() => onSelectCategory(item.category)}>
              {item.category}
            </button>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full ${item.utilization > 1 ? "bg-coral" : item.utilization > 0.8 ? "bg-saffron" : "bg-pine"}`}
                style={{ width: `${Math.min(item.utilization * 100, 100)}%` }}
              />
            </div>
            <div className="grid gap-1 text-sm text-muted">
              <span>Committed: {currency.format(item.committed)}</span>
              <span>Remaining: {currency.format(item.remaining)}</span>
            </div>
            <input
              className="mt-3 w-full"
              value={item.budget}
              onChange={(event) => onUpdateBudget(item.category, event.target.value)}
              type="number"
              min="0"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
