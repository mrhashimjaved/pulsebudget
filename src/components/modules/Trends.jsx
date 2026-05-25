import { currency, monthLabel } from "../../lib/formatters.js";

export function Trends({ engine, selectedCategory }) {
  const detail = engine.categoryDetail(selectedCategory);
  const max = Math.max(...detail.trend.map((item) => item.spent), 1);

  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="section-title">Second layer</p>
        <h2 className="text-xl font-black">Trends</h2>
        <p className="text-sm text-muted">Contextual trend for {selectedCategory}.</p>
      </div>
      <div className="grid min-h-72 grid-cols-6 items-end gap-3">
        {detail.trend.map((item) => (
          <div key={item.month} className="grid gap-2 text-center">
            <div
              className="rounded-t-md bg-gradient-to-b from-saffron to-coral text-[10px] font-black text-white"
              style={{ height: Math.max((item.spent / max) * 210, 12) }}
              title={currency.format(item.spent)}
            />
            <span className="text-xs font-black text-muted">{monthLabel(item.month)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
