const STORAGE_KEY = "pulsebudget-state-v1";
const SUPABASE_TABLE = "finance_profiles";
const categories = ["Housing", "Food", "Transport", "Utilities", "Shopping", "Health", "Leisure", "Savings"];
const cloudConfig = window.PULSEBUDGET_CONFIG || {};
const isCloudConfigured = Boolean(cloudConfig.supabaseUrl && cloudConfig.supabaseAnonKey && window.supabase);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0
});

const preciseCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 2
});

const now = new Date();
const monthKey = (date) => date.toISOString().slice(0, 7);
const thisMonth = monthKey(now);

const monthsBack = (count) => {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
    return monthKey(date);
  });
};

const createId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function appUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

const starterState = {
  income: 0,
  budgets: {
    Housing: 0,
    Food: 0,
    Transport: 0,
    Utilities: 0,
    Shopping: 0,
    Health: 0,
    Leisure: 0,
    Savings: 0
  },
  expenses: [],
  planned: []
};

let state = loadState();
let supabaseClient = null;
let activeSession = null;
let saveTimer = null;
let isHydratingCloud = false;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(starterState);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...starterState,
      ...parsed,
      budgets: { ...starterState.budgets, ...parsed.budgets }
    };
  } catch {
    return structuredClone(starterState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  if (!supabaseClient || !activeSession || isHydratingCloud) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { error } = await supabaseClient.from(SUPABASE_TABLE).upsert({
      user_id: activeSession.user.id,
      state,
      updated_at: new Date().toISOString()
    });

    if (error) {
      setStorageStatus("error", "Cloud save failed. Local backup is still active.");
      return;
    }

    setStorageStatus("cloud", `Cloud sync active for ${activeSession.user.email}.`);
  }, 350);
}

function setStorageStatus(mode, message) {
  const status = document.querySelector("#storage-status");
  const copy = document.querySelector("#account-copy");
  if (!status || !copy) return;

  status.className = `status-dot ${mode}`;
  copy.textContent = message;
}

function setAppVisibility(isSignedIn) {
  document.querySelector("#auth-screen").classList.toggle("hidden", isSignedIn);
  document.querySelector("#app-shell").classList.toggle("hidden", !isSignedIn);
}

function applyAuthMessageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error_description") || hashParams.get("error_description");
  const type = params.get("type") || hashParams.get("type");

  if (error) {
    setStorageStatus("error", error.replace(/\+/g, " "));
    return;
  }

  if (type === "signup" || type === "email_change" || type === "recovery") {
    setStorageStatus("cloud", "Email confirmed. You can sign in now.");
  }
}

function updateAuthUi() {
  const form = document.querySelector("#auth-form");
  const signOut = document.querySelector("#sign-out");
  const signedInCopy = document.querySelector("#signed-in-copy");

  if (!isCloudConfigured) {
    form.classList.remove("hidden");
    signOut.classList.add("hidden");
    setAppVisibility(false);
    setStorageStatus("local", "Add Supabase keys in app-config.js to enable permanent cloud storage.");
    applyAuthMessageFromUrl();
    return;
  }

  if (activeSession) {
    form.classList.add("hidden");
    signOut.classList.remove("hidden");
    setAppVisibility(true);
    signedInCopy.textContent = `Signed in as ${activeSession.user.email}.`;
    setStorageStatus("cloud", `Cloud sync active for ${activeSession.user.email}.`);
  } else {
    form.classList.remove("hidden");
    signOut.classList.add("hidden");
    setAppVisibility(false);
    setStorageStatus("local", "Sign in to sync this budget across devices.");
    applyAuthMessageFromUrl();
  }
}

async function loadCloudState() {
  if (!supabaseClient || !activeSession) return;

  isHydratingCloud = true;
  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .select("state")
    .eq("user_id", activeSession.user.id)
    .maybeSingle();

  if (error) {
    isHydratingCloud = false;
    setStorageStatus("error", "Could not load cloud data. Local backup is still active.");
    return;
  }

  if (data?.state) {
    state = {
      ...starterState,
      ...data.state,
      budgets: { ...starterState.budgets, ...data.state.budgets }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    state = structuredClone(starterState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const { error: insertError } = await supabaseClient.from(SUPABASE_TABLE).insert({
      user_id: activeSession.user.id,
      state,
      updated_at: new Date().toISOString()
    });

    if (insertError) {
      isHydratingCloud = false;
      setStorageStatus("error", "Could not create your cloud profile. Try refreshing the page.");
      return;
    }
  }

  isHydratingCloud = false;
  render();
}

async function initCloudStorage() {
  if (!isCloudConfigured) {
    updateAuthUi();
    return;
  }

  supabaseClient = window.supabase.createClient(cloudConfig.supabaseUrl, cloudConfig.supabaseAnonKey);
  const { data } = await supabaseClient.auth.getSession();
  activeSession = data.session;
  updateAuthUi();

  if (activeSession) {
    await loadCloudState();
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    activeSession = session;
    updateAuthUi();
    if (session) {
      setTimeout(() => {
        loadCloudState();
      }, 0);
    }
  });
}

function byCurrentMonth(entry) {
  return entry.date && entry.date.startsWith(thisMonth);
}

function sum(entries, predicate = () => true) {
  return entries.filter(predicate).reduce((total, entry) => total + Number(entry.amount || 0), 0);
}

function byCategory(entries, category) {
  return entries.filter((entry) => entry.category === category);
}

function categorySpent(category) {
  return sum(byCategory(state.expenses.filter(byCurrentMonth), category));
}

function categoryPlanned(category) {
  return sum(byCategory(state.planned, category));
}

function categoryCommitted(category) {
  return categorySpent(category) + categoryPlanned(category);
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function setupSelectors() {
  const options = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  document.querySelector("#expense-category").innerHTML = options;
  document.querySelector("#planned-category").innerHTML = options;
  document.querySelector("#trend-category").innerHTML = `<option value="All">All categories</option>${options}`;
}

function render() {
  saveState();
  document.querySelector("#month-heading").textContent = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
  document.querySelector("#monthly-income").value = state.income;

  const spent = sum(state.expenses, byCurrentMonth);
  const planned = sum(state.planned);
  const budgeted = Object.values(state.budgets).reduce((total, value) => total + Number(value || 0), 0);
  const available = state.income - spent - planned;
  const unassigned = state.income - budgeted;

  document.querySelector("#spent-total").textContent = currency.format(spent);
  document.querySelector("#planned-total").textContent = currency.format(planned);
  document.querySelector("#unassigned-total").textContent = currency.format(unassigned);
  document.querySelector("#available-budget").textContent = currency.format(available);

  const health = document.querySelector("#budget-health");
  health.className = "health-pill";
  if (available < 0) {
    health.textContent = "Over monthly cash flow";
    health.classList.add("danger");
  } else if (available < state.income * 0.12) {
    health.textContent = "Tight but manageable";
    health.classList.add("warning");
  } else {
    health.textContent = "Room to plan ahead";
  }

  renderBudgets();
  renderPlanned();
  renderExpenses();
  renderTrends();
  renderInsights();
}

function renderBudgets() {
  document.querySelector("#budget-list").innerHTML = categories
    .map((category) => {
      const budget = Number(state.budgets[category] || 0);
      const committed = categoryCommitted(category);
      const percent = budget ? Math.min((committed / budget) * 100, 130) : 0;
      const statusClass = percent > 100 ? "over" : percent > 82 ? "hot" : "";
      const remaining = budget - committed;
      return `
        <div class="budget-row">
          <div class="budget-main">
            <strong>${category}</strong>
            <span>${currency.format(committed)} committed | ${currency.format(remaining)} left</span>
            <div class="progress-track" aria-hidden="true">
              <div class="progress-fill ${statusClass}" style="width:${Math.min(percent, 100)}%"></div>
            </div>
          </div>
          <label class="budget-control">
            Budget
            <input type="number" min="0" step="10" value="${budget}" data-budget="${category}" />
          </label>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll("[data-budget]").forEach((input) => {
    input.addEventListener("change", (event) => {
      state.budgets[event.target.dataset.budget] = Number(event.target.value || 0);
      render();
    });
  });
}

function renderPlanned() {
  const list = document.querySelector("#planned-list");
  if (!state.planned.length) {
    list.innerHTML = document.querySelector("#empty-state-template").innerHTML;
    return;
  }

  list.innerHTML = state.planned
    .map(
      (item) => `
        <div class="item-row">
          <div class="item-main">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.category)} allocation</span>
          </div>
          <span class="amount-pill">${currency.format(item.amount)}</span>
          <button class="icon-button" type="button" title="Remove planned expense" data-remove-plan="${item.id}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-remove-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      state.planned = state.planned.filter((item) => item.id !== button.dataset.removePlan);
      render();
    });
  });
}

function renderExpenses() {
  const list = document.querySelector("#expense-list");
  const recent = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  if (!recent.length) {
    list.innerHTML = document.querySelector("#empty-state-template").innerHTML;
    return;
  }

  list.innerHTML = recent
    .map(
      (expense) => `
        <div class="item-row">
          <div class="item-main">
            <strong>${escapeHtml(expense.note || expense.category)}</strong>
            <span>${escapeHtml(expense.category)} | ${expense.date}</span>
          </div>
          <span class="amount-pill">${preciseCurrency.format(expense.amount)}</span>
          <button class="icon-button" type="button" title="Remove expense" data-remove-expense="${expense.id}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-remove-expense]").forEach((button) => {
    button.addEventListener("click", () => {
      state.expenses = state.expenses.filter((item) => item.id !== button.dataset.removeExpense);
      render();
    });
  });
}

function renderTrends() {
  const selected = document.querySelector("#trend-category").value || "All";
  const months = monthsBack(6);
  const values = months.map((month) => {
    const entries = state.expenses.filter((expense) => expense.date.startsWith(month));
    return selected === "All" ? sum(entries) : sum(entries, (entry) => entry.category === selected);
  });
  const max = Math.max(...values, 1);

  document.querySelector("#trend-chart").innerHTML = months
    .map((month, index) => {
      const height = Math.max((values[index] / max) * 190, values[index] ? 18 : 6);
      return `
        <div class="bar-wrap">
          <div class="bar" style="height:${height}px">${values[index] ? currency.format(values[index]) : ""}</div>
          <div class="bar-label">${formatMonth(month)}</div>
        </div>
      `;
    })
    .join("");
}

function renderInsights() {
  const insights = [];
  const currentSpent = sum(state.expenses, byCurrentMonth);
  const lastSix = monthsBack(6);
  const previousMonths = lastSix.slice(0, -1);
  const previousAverage = previousMonths.length
    ? previousMonths.reduce((total, month) => total + sum(state.expenses, (entry) => entry.date.startsWith(month)), 0) /
      previousMonths.length
    : 0;

  if (previousAverage && currentSpent > previousAverage * 1.15) {
    insights.push({
      title: "Spending is trending higher",
      body: `This month is ${currency.format(currentSpent - previousAverage)} above your recent average. Hold new plans until essentials settle.`
    });
  }

  categories.forEach((category) => {
    const budget = Number(state.budgets[category] || 0);
    const committed = categoryCommitted(category);
    if (budget && committed > budget) {
      insights.push({
        title: `${category} needs attention`,
        body: `${category} is ${currency.format(committed - budget)} over budget after planned expenses. Move money from a lower-use category or reduce the plan.`
      });
    }
  });

  const overspentCategory = categories
    .map((category) => ({ category, spent: categorySpent(category), budget: Number(state.budgets[category] || 0) }))
    .filter((item) => item.budget > 0)
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)[0];

  if (overspentCategory && overspentCategory.spent > overspentCategory.budget * 0.75) {
    insights.push({
      title: `Watch ${overspentCategory.category}`,
      body: `You have used ${Math.round((overspentCategory.spent / overspentCategory.budget) * 100)}% of that budget. Future expenses in this category should be planned first.`
    });
  }

  if (!insights.length) {
    insights.push({
      title: "Your plan is balanced",
      body: "Budgets, spending, and planned expenses are currently aligned with your monthly income."
    });
  }

  document.querySelector("#insights").innerHTML = insights
    .slice(0, 4)
    .map(
      (insight) => `
        <div class="insight-item">
          <strong>${insight.title}</strong>
          <p>${insight.body}</p>
        </div>
      `
    )
    .join("");
}

function bindEvents() {
  document.querySelector("#monthly-income").addEventListener("input", (event) => {
    state.income = Number(event.target.value || 0);
    render();
  });

  document.querySelector("#expense-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.expenses.push({
      id: createId(),
      amount: Number(document.querySelector("#expense-amount").value || 0),
      category: document.querySelector("#expense-category").value,
      date: document.querySelector("#expense-date").value,
      note: document.querySelector("#expense-note").value.trim()
    });
    event.target.reset();
    document.querySelector("#expense-date").value = new Date().toISOString().slice(0, 10);
    render();
  });

  document.querySelector("#planned-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.planned.push({
      id: createId(),
      amount: Number(document.querySelector("#planned-amount").value || 0),
      category: document.querySelector("#planned-category").value,
      name: document.querySelector("#planned-name").value.trim()
    });
    event.target.reset();
    render();
  });

  document.querySelector("#trend-category").addEventListener("change", renderTrends);

  document.querySelector("#reset-demo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(starterState);
    setupDefaults();
    render();
    setStorageStatus("cloud", "Account data cleared. Cloud sync will save the zero balance.");
  });

  document.querySelector("#sign-in").addEventListener("click", async () => {
    if (!supabaseClient) {
      setStorageStatus("local", "Add Supabase keys in app-config.js before signing in.");
      return;
    }

    const email = document.querySelector("#auth-email").value.trim();
    const password = document.querySelector("#auth-password").value;
    if (!email || !password) {
      setStorageStatus("error", "Enter your email and password to continue.");
      return;
    }

    setStorageStatus("local", "Signing in...");
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) setStorageStatus("error", error.message);
  });

  document.querySelector("#sign-up").addEventListener("click", async () => {
    if (!supabaseClient) {
      setStorageStatus("local", "Add Supabase keys in app-config.js before creating an account.");
      return;
    }

    const email = document.querySelector("#auth-email").value.trim();
    const password = document.querySelector("#auth-password").value;
    if (!email || !password) {
      setStorageStatus("error", "Enter an email and password to create an account.");
      return;
    }

    setStorageStatus("local", "Creating account...");
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: appUrl()
      }
    });
    if (error) {
      setStorageStatus("error", error.message);
    } else {
      setStorageStatus("cloud", "Account created. Check your email if Supabase asks for confirmation.");
    }
  });

  document.querySelector("#sign-out").addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    activeSession = null;
    state = structuredClone(starterState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    updateAuthUi();
  });
}

function setupDefaults() {
  document.querySelector("#expense-date").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#expense-category").value = "Food";
  document.querySelector("#planned-category").value = "Savings";
}

setupSelectors();
bindEvents();
setupDefaults();
render();
initCloudStorage();
