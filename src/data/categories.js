export const categories = ["Housing", "Food", "Transport", "Utilities", "Shopping", "Health", "Leisure", "Savings"];

export const emptyBudgetMap = categories.reduce((budgetMap, category) => {
  budgetMap[category] = 0;
  return budgetMap;
}, {});

export const starterState = {
  income: 0,
  openingBalance: 0,
  budgets: emptyBudgetMap,
  expenses: [],
  planned: []
};
