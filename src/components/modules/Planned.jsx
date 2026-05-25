import { useState } from "react";
import { categories } from "../../data/categories.js";
import { currency } from "../../lib/formatters.js";

export function Planned({ items, onAddPlanned }) {
  const [form, setForm] = useState({ name: "", amount: "", category: "Savings" });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name || !form.amount) return;
    onAddPlanned(form);
    setForm({ name: "", amount: "", category: form.category });
  }

  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="section-title">Second layer</p>
        <h2 className="text-xl font-black">Planned</h2>
      </div>
      <form className="mb-4 grid gap-3 md:grid-cols-[1fr_140px_160px_auto]" onSubmit={submit}>
        <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Future allocation" />
        <input value={form.amount} onChange={(event) => update("amount", event.target.value)} type="number" placeholder="Amount" />
        <select value={form.category} onChange={(event) => update("category", event.target.value)}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <button className="primary-button" type="submit">
          Allocate
        </button>
      </form>
      <div className="grid gap-2">
        {items.length === 0 && <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">No planned allocations yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-line bg-canvas p-3">
            <div>
              <p className="font-black">{item.name}</p>
              <p className="text-sm text-muted">{item.category}</p>
            </div>
            <span className="font-black text-river">{currency.format(item.amount)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
