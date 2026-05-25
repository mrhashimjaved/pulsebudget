import { useState } from "react";
import { categories } from "../../data/categories.js";
import { monthKey } from "../../lib/formatters.js";

export function ExpenseForm({ onAddExpense }) {
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    date: monthKey(),
    note: ""
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.amount) return;
    onAddExpense(form);
    setForm({ amount: "", category: form.category, date: monthKey(), note: "" });
  }

  return (
    <section className="panel p-4">
      <p className="section-title">Reusable form</p>
      <h3 className="mb-4 text-lg font-black">ExpenseForm</h3>
      <form className="grid gap-3" onSubmit={submit}>
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
          Add expense
        </button>
      </form>
    </section>
  );
}
