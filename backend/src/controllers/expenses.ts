import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { expenseService } from "../services/expenses";
import { FINANCE_PERIODS } from "../services/admin";
export const expenseController = {
  async list(req: Request, res: Response) {
    const period = typeof req.query.period === "string" ? req.query.period : "month";
    if (!FINANCE_PERIODS.includes(period as never)) { res.status(400).json({ error: "INVALID_FINANCE_PERIOD" }); return; }
    try { const expenses = await expenseService.list(period as never); res.json({ expenses: expenses.map((item) => ({ id: item.id, category: item.category, description: item.description, amount: item.amount.toNumber(), spentAt: item.spent_at, createdAt: item.created_at })) }); }
    catch { res.status(500).json({ error: "EXPENSE_LIST_FAILED" }); }
  },
  async create(req: AuthRequest, res: Response) {
    try { const expense = await expenseService.create(req.user!.userId, req.body); res.status(201).json({ expense: { ...expense, amount: expense.amount.toNumber() } }); }
    catch (err) {
      const code = err instanceof Error ? err.message : "EXPENSE_CREATE_FAILED";
      const allowed = ["INVALID_EXPENSE", "INVALID_EXPENSE_CATEGORY", "INVALID_EXPENSE_DESCRIPTION", "INVALID_EXPENSE_AMOUNT", "INVALID_EXPENSE_DATE"];
      res.status(allowed.includes(code) ? 400 : 500).json({ error: allowed.includes(code) ? code : "EXPENSE_CREATE_FAILED" });
    }
  },
};
