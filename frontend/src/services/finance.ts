import api from "./api";

export type FinancePeriod = "week" | "month" | "quarter" | "year";

export interface FinanceTransaction {
  reference: string;
  description: string;
  date: string;
  amount: number;
  type: "Ingreso" | "Devolución" | "Gasto";
}

export interface FinanceExpense { id: string; category: string; description: string; amount: number; spentAt: string; }
export interface PaymentMethodSummary { name: string; transactions: number; amount: number; percentage: number; }

export interface FinanceCategory {
  name: string;
  amount: number;
  units: number;
  percentage: number;
}

export interface FinanceData {
  period: FinancePeriod;
  periodLabel: string;
  revenue: number;
  ordersCount: number;
  returnsCount: number;
  monthlyRevenue: { label: string; value: number }[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  expenses: FinanceExpense[];
  expenseTotal: number;
  paymentMethods: PaymentMethodSummary[];
}

export async function fetchFinanceData(period: FinancePeriod = "month"): Promise<FinanceData> {
  const { data } = await api.get("/admin/finance/summary", { params: { period } });
  const summary = data.summary || {};
  return {
    period: summary.period || period,
    periodLabel: summary.periodLabel || "Periodo seleccionado",
    revenue: summary.revenue ?? 0,
    ordersCount: summary.ordersCount ?? 0,
    returnsCount: summary.returnsCount ?? 0,
    monthlyRevenue: summary.monthlyRevenue || [],
    categories: summary.categories || [],
    transactions: summary.transactions || [],
    expenses: summary.expenses || [],
    expenseTotal: summary.expenseTotal ?? 0,
    paymentMethods: summary.paymentMethods || [],
  };
}

export async function createFinanceExpense(input: { category: string; description: string; amount: number; spentAt?: string }) {
  const { data } = await api.post("/admin/finance/expenses", input);
  return data.expense as FinanceExpense;
}
