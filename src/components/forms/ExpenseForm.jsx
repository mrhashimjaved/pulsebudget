import { useState } from "react";
import { monthKey } from "../../lib/formatters.js";

export function ExpenseForm({ categories, mode = "expense", onSubmit }) {
  const isPlanned = mode === "planned";
  const fallbackCategory = categories[0] || "General";
  const [form, setForm] = useState({
    amount: "",
    category: categories.includes("Food") ? "Food" : fallbackCategory,
    date: monthKey(),
    note: "",
    goal: ""
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.amount) return;
    if (isPlanned && !form.goal.trim()) return;
    onSubmit({
      amount: Number(form.amount || 0),
      category: form.category,
      date: form.date,
      note: form.note,
      name: form.goal
    });
    setForm({
      amount: "",
      category: form.category,
      date: monthKey(),
      note: "",
      goal: ""
    });
  }

  return (
    <section className="panel p-4">
      <p className="section-title">Reusable form</p>
      <h3 className="mb-4 text-lg font-black">{isPlanned ? "Planned allocation" : "Add Expense"}</h3>
      <form className="grid gap-3" onSubmit={submit}>
        {isPlanned && (
          <input
            value={form.goal}
            onChange={(event) => update("goal", event.target.value)}
            placeholder="Goal or planned expense"
          />
        )}
        <input
          value={form.amount}
          onChange={(event) => update("amount", event.target.value)}
          type="number"
          min="0"
          placeholder="Amount"
        />
        <select value={form.category} onChange={(event) => update("category", event.target.value)}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input value={form.date} onChange={(event) => update("date", event.target.value)} type="date" />
        <input value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Note" />
        <button className="primary-button" type="submit">
          {isPlanned ? "Plan expense" : "Add expense"}
        </button>
      </form>
    </section>
  );
}
