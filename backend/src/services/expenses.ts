import { prisma } from "../config/prisma";
import type { FinancePeriod } from "./admin";

export interface ExpenseInput { category: string; description: string; amount: number; spentAt?: string; }
export function validateExpense(input: unknown): ExpenseInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_EXPENSE");
  const data = input as Record<string, unknown>;
  if (typeof data.category !== "string" || data.category.trim().length < 2 || data.category.length > 100) throw new Error("INVALID_EXPENSE_CATEGORY");
  if (typeof data.description !== "string" || data.description.trim().length < 3 || data.description.length > 255) throw new Error("INVALID_EXPENSE_DESCRIPTION");
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0 || data.amount > 99_999_999) throw new Error("INVALID_EXPENSE_AMOUNT");
  if (data.spentAt !== undefined) {
    if (typeof data.spentAt !== "string" || !Number.isFinite(Date.parse(data.spentAt))) throw new Error("INVALID_EXPENSE_DATE");
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data.spentAt);
    const normalized = new Date(data.spentAt);
    const isCalendarDayInFuture = isDateOnly && data.spentAt > new Date().toISOString().slice(0, 10);
    if (isCalendarDayInFuture || !isDateOnly && normalized.getTime() > Date.now()) throw new Error("INVALID_EXPENSE_DATE");
  }
  return { category: data.category.trim(), description: data.description.trim(), amount: Math.round(data.amount * 100) / 100, spentAt: data.spentAt as string | undefined };
}
export function financePeriodStart(period: FinancePeriod, now = new Date()) {
  if (period === "week") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  if (period === "quarter") return new Date(now.getFullYear(), now.getMonth() - 9, 1);
  if (period === "year") return new Date(now.getFullYear() - 3, 0, 1);
  return new Date(now.getFullYear(), now.getMonth() - 11, 1);
}
export const expenseService = {
  async create(userId: string, input: unknown) {
    const data = validateExpense(input);
    return prisma.financial_expenses.create({ data: { category: data.category, description: data.description, amount: data.amount, spent_at: data.spentAt ? new Date(data.spentAt) : new Date(), created_by: userId } });
  },
  async list(period: FinancePeriod, now = new Date()) {
    return prisma.financial_expenses.findMany({ where: { spent_at: { gte: financePeriodStart(period, now), lte: now } }, orderBy: { spent_at: "desc" } });
  },
};
