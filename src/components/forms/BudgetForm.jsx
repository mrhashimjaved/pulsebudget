import { useState } from "react";
import { categories as allCategories } from "../../data/categories.js";

export function BudgetForm({ categories, onUpdateBudget }) {
  const [category, setCategory] = useState("Food");
  const current = categories.find((item) => item.category === category);

  return (
    <section className="panel p-4">
      <p className="section-title">Reusable form</p>
      <h3 className="mb-4 text-lg font-black">BudgetForm</h3>
      <div className="grid gap-3">
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {allCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input
          value={current?.budget || 0}
          onChange={(event) => onUpdateBudget(category, event.target.value)}
          type="number"
          min="0"
        />
      </div>
    </section>
  );
}
