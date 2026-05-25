import { useState } from "react";

export function AuthGate({ onSignIn, onSignUp, status }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function canSubmit() {
    return email.trim() && password;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5">
      <section className="panel grid w-full max-w-md gap-5 p-6">
        <div>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-ink text-white">PB</div>
          <p className="section-title">Secure cloud access</p>
          <h1 className="mt-1 text-3xl font-black">PulseBudget</h1>
          <p className="mt-2 text-sm text-muted">{status}</p>
        </div>

        <form className="grid gap-3">
          <label className="grid gap-2 text-sm font-black text-muted">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
          </label>
          <label className="grid gap-2 text-sm font-black text-muted">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="primary-button"
              type="button"
              onClick={() => canSubmit() && onSignIn(email.trim(), password)}
            >
              Sign in
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => canSubmit() && onSignUp(email.trim(), password)}
            >
              Create account
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
