import { currency, monthLabel } from "../../lib/formatters.js";

export function CategoryDetail({ categoryOptions, detail, onSelectCategory }) {
  const totalImpact = detail.forecastImpact.reduce((total, item) => total + item.balanceImpact, 0);

  return (
    <section className="panel p-4">
      <div className="mb-4">
        <p className="section-title">Third layer drill-down</p>
        <h2 className="text-xl font-black">CategoryDetail</h2>
      </div>

      <select className="mb-4 w-full" value={detail.category} onChange={(event) => onSelectCategory(event.target.value)}>
        {categoryOptions.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>

      <div className="mb-4 rounded-md border border-line bg-canvas p-3">
        <p className="section-title">ForecastImpact</p>
        <p className="mt-1 text-2xl font-black">{currency.format(totalImpact)}</p>
      </div>

      <div className="mb-5">
        <p className="mb-2 font-black">Transactions</p>
        <div className="grid gap-2">
          {detail.transactions.length === 0 && (
            <p className="rounded-md border border-dashed border-line p-3 text-sm text-muted">No transactions in this category.</p>
          )}
          {detail.transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="rounded-md border border-line bg-canvas p-3">
              <p className="font-black">{transaction.note || detail.category}</p>
              <p className="text-sm text-muted">{transaction.date}</p>
              <p className="text-sm font-black text-river">{currency.format(transaction.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-black">Contextual trend</p>
        <div className="grid grid-cols-3 gap-2">
          {detail.trend.slice(-3).map((item) => (
            <div key={item.month} className="rounded-md border border-line bg-canvas p-2">
              <p className="text-xs font-black text-muted">{monthLabel(item.month)}</p>
              <p className="text-sm font-black">{currency.format(item.spent)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
