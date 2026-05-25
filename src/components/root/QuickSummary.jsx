import { currency } from "../../lib/formatters.js";

export function QuickSummary({ email, income, onIncomeChange, summary }) {
  const metrics = [
    ["Income", summary.income],
    ["Bills", summary.bills],
    ["Discretionary", summary.discretionary],
    ["Planned", summary.planned]
  ];

  return (
    <section className="panel grid gap-4 p-5">
      <div>
        <p className="section-title">QuickSummary</p>
        <h2 className="text-xl font-black">Monthly control</h2>
        <p className="text-sm text-muted">{email}</p>
      </div>

      <label className="grid gap-2 text-sm font-black text-muted">
        Monthly income
        <input value={income} onChange={(event) => onIncomeChange(event.target.value)} type="number" min="0" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-canvas p-3">
            <p className="text-xs font-black uppercase text-muted">{label}</p>
            <p className="mt-1 text-lg font-black">{currency.format(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
