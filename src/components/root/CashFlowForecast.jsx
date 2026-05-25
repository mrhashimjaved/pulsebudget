import { currency, monthLabel } from "../../lib/formatters.js";

export function CashFlowForecast({ projection }) {
  const maxBalance = Math.max(...projection.map((month) => Math.abs(month.balance)), 1);

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="section-title">12-month projection</p>
          <h2 className="text-xl font-black">CashFlowForecast</h2>
        </div>
        <p className="text-right text-sm text-muted">Balances are calculated by `cashFlowEngine()`.</p>
      </div>

      <div className="grid min-h-72 grid-cols-6 items-end gap-3 md:grid-cols-12">
        {projection.map((month) => {
          const height = Math.max((Math.abs(month.balance) / maxBalance) * 210, 14);
          return (
            <div key={month.month} className="grid gap-2 text-center">
              <div
                className="rounded-t-md bg-gradient-to-b from-river to-pine text-[10px] font-black text-white"
                style={{ height }}
                title={currency.format(month.balance)}
              />
              <span className="text-xs font-black text-muted">{monthLabel(month.month)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
