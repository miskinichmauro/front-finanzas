export interface MonthlySummaryDto {
  year: number;
  month: number;
  totalIncomes: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalDiscounts: number;
  finalBalance: number;
  averageDailyExpense: number;
  expensesByCategory: Record<string, number>;
}
