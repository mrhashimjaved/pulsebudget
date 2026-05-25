import { categories } from "../data/categories.js";
import { monthKey, nextMonths } from "./formatters.js";

function sum(entries, predicate = () => true) {
  return entries.filter(predicate).reduce((total, entry) => total + Number(entry.amount || 0), 0);
}

function inMonth(entry, key) {
  return entry.date?.startsWith(key);
}

function monthlyTotal(entries, key, category = "All") {
  return sum(entries, (entry) => inMonth(entry, key) && (category === "All" || entry.category === category));
}

export function cashFlowEngine(state, options = {}) {
  const currentMonth = options.currentMonth || monthKey();
  const forecastMonths = options.forecastMonths || nextMonths(12);
  const income = Number(state.income || 0);
  const openingBalance = Number(state.openingBalance || 0);
  const expenses = state.expenses || [];
  const planned = state.planned || [];
  const budgets = state.budgets || {};

  let runningBalance = openingBalance;
  const projection = forecastMonths.map((key, index) => {
    const monthIncome = income;
    const monthExpenses = monthlyTotal(expenses, key);
    const monthPlanned = index === 0 ? sum(planned) : 0;
    const net = monthIncome - monthExpenses - monthPlanned;
    runningBalance += net;

    return {
      month: key,
      income: monthIncome,
      expenses: monthExpenses,
      planned: monthPlanned,
      net,
      balance: runningBalance
    };
  });

  const currentSpent = monthlyTotal(expenses, currentMonth);
  const plannedTotal = sum(planned);
  const budgetedTotal = Object.values(budgets).reduce((total, value) => total + Number(value || 0), 0);
  const available = income - currentSpent - plannedTotal;

  const categorySummaries = categories.map((category) => {
    const spent = monthlyTotal(expenses, currentMonth, category);
    const allocated = sum(planned, (item) => item.category === category);
    const budget = Number(budgets[category] || 0);
    const committed = spent + allocated;
    const remaining = budget - committed;
    const utilization = budget > 0 ? committed / budget : 0;

    return {
      category,
      budget,
      spent,
      allocated,
      committed,
      remaining,
      utilization
    };
  });

  return {
    currentMonth,
    projection,
    quickSummary: {
      income,
      bills: categorySummaries.find((item) => item.category === "Housing")?.committed || 0,
      discretionary: available,
      spent: currentSpent,
      planned: plannedTotal,
      budgeted: budgetedTotal
    },
    categorySummaries,
    categoryDetail(category) {
      const categoryExpenses = expenses.filter((entry) => entry.category === category);
      const categoryPlanned = planned.filter((entry) => entry.category === category);
      const trendMonths = nextMonths(6, new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1));
      const trend = trendMonths.map((key) => ({
        month: key,
        spent: monthlyTotal(expenses, key, category)
      }));

      return {
        category,
        transactions: categoryExpenses,
        planned: categoryPlanned,
        trend,
        forecastImpact: projection.map((month) => ({
          month: month.month,
          balanceImpact:
            monthlyTotal(categoryExpenses, month.month, category) +
            (month.month === currentMonth ? sum(categoryPlanned) : 0)
        }))
      };
    }
  };
}
