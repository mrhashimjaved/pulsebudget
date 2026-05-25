import { ExpenseForm } from "./forms/ExpenseForm.jsx";
import { Budgets } from "./modules/Budgets.jsx";
import { CategoryDetail } from "./modules/CategoryDetail.jsx";
import { ConfigPage } from "./modules/ConfigPage.jsx";
import { Planned } from "./modules/Planned.jsx";
import { SettingsPage } from "./modules/SettingsPage.jsx";
import { Trends } from "./modules/Trends.jsx";
import { CashFlowForecast } from "./root/CashFlowForecast.jsx";
import { NavigationTabs } from "./root/NavigationTabs.jsx";
import { QuickSummary } from "./root/QuickSummary.jsx";

export function DashboardRoot({ activeCategory, activeTab, budget, onSelectCategory, onSelectTab }) {
  const { actions, engine, session, state, status } = budget;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="section-title">PulseBudget</p>
            <h1 className="text-2xl font-black">Cash flow command center</h1>
            <p className="text-sm text-muted">{status}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="primary-button" type="button" onClick={actions.signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5">
        <section className="grid gap-5 lg:grid-cols-[1.55fr_0.9fr]">
          <CashFlowForecast projection={engine.projection} />
          <QuickSummary
            email={session?.user?.email}
            summary={engine.quickSummary}
          />
        </section>

        <NavigationTabs activeTab={activeTab} onSelectTab={onSelectTab} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            {activeTab === "Overview" && (
              <>
                <ExpenseForm categories={state.categories} onSubmit={actions.addExpense} />
                <Budgets
                  categories={engine.categorySummaries}
                  compact
                  onSelectCategory={onSelectCategory}
                  onUpdateBudget={actions.updateBudget}
                />
                <Planned categories={state.categories} engine={engine} items={state.planned} onAddPlanned={actions.addPlanned} />
              </>
            )}
            {activeTab === "Budgets" && (
              <Budgets
                categories={engine.categorySummaries}
                onSelectCategory={onSelectCategory}
                onUpdateBudget={actions.updateBudget}
              />
            )}
            {activeTab === "Planned" && (
              <Planned categories={state.categories} engine={engine} items={state.planned} onAddPlanned={actions.addPlanned} />
            )}
            {activeTab === "Trends" && <Trends engine={engine} selectedCategory={activeCategory} />}
            {activeTab === "Config" && (
              <ConfigPage actions={actions} categorySummaries={engine.categorySummaries} state={state} />
            )}
            {activeTab === "Settings" && <SettingsPage onHardReset={actions.hardReset} status={status} />}
          </div>

          <aside className="grid content-start gap-5">
            <CategoryDetail
              categoryOptions={state.categories}
              detail={engine.categoryDetail(activeCategory)}
              onSelectCategory={onSelectCategory}
            />
          </aside>
        </section>
      </main>
    </div>
  );
}
