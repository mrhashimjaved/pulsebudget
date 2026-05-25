import { useState } from "react";
import { usePulseBudget } from "./hooks/usePulseBudget.js";
import { AuthGate } from "./components/AuthGate.jsx";
import { DashboardRoot } from "./components/DashboardRoot.jsx";

export default function App() {
  const budget = usePulseBudget();
  const [activeTab, setActiveTab] = useState("Overview");
  const [activeCategory, setActiveCategory] = useState("Food");

  if (budget.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas">
        <div className="panel p-6 text-sm font-black text-muted">Loading PulseBudget...</div>
      </main>
    );
  }

  if (!budget.session) {
    return <AuthGate status={budget.status} onSignIn={budget.actions.signIn} onSignUp={budget.actions.signUp} />;
  }

  return (
    <DashboardRoot
      activeCategory={activeCategory}
      activeTab={activeTab}
      budget={budget}
      onSelectCategory={setActiveCategory}
      onSelectTab={setActiveTab}
    />
  );
}
