import { useState } from "react";

export function SettingsPage({ onHardReset, status }) {
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsResetting(true);
    const success = await onHardReset(password);
    if (success) setPassword("");
    setIsResetting(false);
  }

  return (
    <section className="grid gap-5">
      <div className="panel p-5">
        <p className="section-title">Settings</p>
        <h2 className="text-xl font-black">Account</h2>
        <p className="mt-2 text-sm text-muted">{status}</p>
      </div>

      <div className="panel border-coral/30 p-5">
        <p className="section-title text-coral">Danger zone</p>
        <h2 className="text-xl font-black">Hard Reset Account</h2>
        <p className="mt-2 text-sm text-muted">
          This clears all budgets, transactions, planned expenses, and trends back to zero. Enter your password to confirm.
        </p>
        <form className="mt-4 grid max-w-md gap-3" onSubmit={submit}>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Confirm password"
          />
          <button className="primary-button bg-coral hover:bg-coral/90" disabled={isResetting} type="submit">
            {isResetting ? "Resetting..." : "Hard reset account"}
          </button>
        </form>
      </div>
    </section>
  );
}
