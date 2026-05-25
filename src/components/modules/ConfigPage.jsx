import { useState } from "react";
import { BudgetForm } from "../forms/BudgetForm.jsx";
import { currency } from "../../lib/formatters.js";

export function ConfigPage({ actions, categorySummaries, state }) {
  const [newCategory, setNewCategory] = useState("");

  function submitCategory(event) {
    event.preventDefault();
    actions.addCategory(newCategory);
    setNewCategory("");
  }

  return (
    <section className="grid gap-5">
      <div className="panel p-5">
        <p className="section-title">Config</p>
        <h2 className="text-xl font-black">Income settings</h2>
        <label className="mt-4 grid max-w-sm gap-2 text-sm font-black text-muted">
          Monthly income
          <input
            value={state.income}
            onChange={(event) => actions.updateIncome(event.target.value)}
            type="number"
            min="0"
          />
        </label>
      </div>

      <div className="panel p-5">
        <p className="section-title">Config</p>
        <h2 className="text-xl font-black">Budget settings</h2>
        <div className="mt-4 max-w-lg">
          <BudgetForm categories={categorySummaries} onUpdateBudget={actions.updateBudget} />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {categorySummaries.map((item) => (
            <div key={item.category} className="flex items-center justify-between rounded-md border border-line bg-canvas p-3">
              <span className="font-black">{item.category}</span>
              <span className="text-sm font-black text-river">{currency.format(item.budget)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <p className="section-title">Config</p>
        <h2 className="text-xl font-black">Category settings</h2>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={submitCategory}>
          <input
            className="min-w-60"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="New category"
          />
          <button className="primary-button" type="submit">
            Add category
          </button>
        </form>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {state.categories.map((category) => (
            <div key={category} className="flex items-center justify-between rounded-md border border-line bg-canvas p-3">
              <span className="font-black">{category}</span>
              <button className="text-sm font-black text-coral" type="button" onClick={() => actions.removeCategory(category)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
