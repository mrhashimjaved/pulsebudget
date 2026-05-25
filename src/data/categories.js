export const categories = ["Housing", "Food", "Transport", "Utilities", "Shopping", "Health", "Leisure", "Savings"];

export function budgetMapFor(categoryList = categories, current = {}) {
  return categoryList.reduce((budgetMap, category) => {
    budgetMap[category] = Number(current[category] || 0);
    return budgetMap;
  }, {});
}

export const emptyBudgetMap = categories.reduce((budgetMap, category) => {
  budgetMap[category] = 0;
  return budgetMap;
}, {});

export const starterState = {
  income: 0,
  openingBalance: 0,
  categories,
  budgets: emptyBudgetMap,
  expenses: [],
  planned: []
};
