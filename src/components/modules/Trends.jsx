import { SpendingChart } from "../charts/SpendingChart.jsx";

export function Trends({ engine, selectedCategory }) {
  const detail = engine.categoryDetail(selectedCategory);

  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="section-title">Second layer</p>
        <h2 className="text-xl font-black">Trends</h2>
        <p className="text-sm text-muted">Contextual trend for {selectedCategory}.</p>
      </div>
      <SpendingChart data={detail.trend} />
    </section>
  );
}
