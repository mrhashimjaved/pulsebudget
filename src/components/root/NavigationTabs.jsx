const tabs = ["Overview", "Budgets", "Planned", "Trends", "Config", "Settings"];

export function NavigationTabs({ activeTab, onSelectTab }) {
  return (
    <nav className="panel flex flex-wrap gap-2 p-2" aria-label="Dashboard sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-button ${activeTab === tab ? "tab-button-active" : ""}`}
          type="button"
          onClick={() => onSelectTab(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
