import { ExpenseForm } from "../forms/ExpenseForm.jsx";
import { currency } from "../../lib/formatters.js";

export function Planned({ categories, engine, items, onAddPlanned }) {
  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="section-title">Second layer</p>
        <h2 className="text-xl font-black">Planned</h2>
        <p className="text-sm text-muted">Future allocations show up in the cash-flow forecast for their scheduled month.</p>
      </div>
      <div className="mb-5 max-w-xl">
        <ExpenseForm categories={categories} mode="planned" onSubmit={onAddPlanned} />
      </div>
      <div className="grid gap-2">
        {items.length === 0 && <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">No planned allocations yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-line bg-canvas p-3">
            <div>
              <p className="font-black">{item.name}</p>
              <p className="text-sm text-muted">
                {item.category} | {item.date}
              </p>
            </div>
            <span className="font-black text-river">{currency.format(item.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {engine.projection.slice(0, 3).map((month) => (
          <div key={month.month} className="rounded-md border border-line bg-white p-3">
            <p className="text-xs font-black uppercase text-muted">{month.month}</p>
            <p className="text-sm text-muted">Planned impact</p>
            <p className="text-lg font-black text-coral">{currency.format(month.planned)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
