import { describe, expect, it, vi } from "vitest";
vi.mock("../src/config/prisma", () => ({ prisma: { financial_expenses: { create: vi.fn(), findMany: vi.fn() } } }));
import { prisma } from "../src/config/prisma";
import { expenseService, financePeriodStart, validateExpense } from "../src/services/expenses";

describe("financial expense ledger", () => {
  it("validates and rounds expenses before database insertion", async () => {
    vi.mocked(prisma.financial_expenses.create).mockResolvedValue({ id: "e1", category: "Operaciones", description: "Flete", amount: { toNumber: () => 25.51 }, spent_at: new Date("2026-10-01"), created_at: new Date() } as never);
    expect(validateExpense({ category: "  Operaciones ", description: " Flete ", amount: 25.514, spentAt: "2026-10-01" })).toMatchObject({ category: "Operaciones", description: "Flete", amount: 25.51 });
    const created = await expenseService.create("user-1", { category: "Operaciones", description: "Flete", amount: 25.514, spentAt: "2026-10-01" });
    expect(created.id).toBe("e1");
    expect(prisma.financial_expenses.create).toHaveBeenCalledWith({ data: expect.objectContaining({ category: "Operaciones", amount: 25.51, created_by: "user-1" }) });
  });
  it("rejects malformed, future-dated and unreasonable expense submissions", () => {
    for (const invalid of [null, {}, { category: "x", description: "ok", amount: 1 }, { category: "Rent", description: "Rent", amount: 0 }, { category: "Rent", description: "Rent", amount: Infinity }, { category: "Rent", description: "Rent", amount: 1, spentAt: "2099-01-01" }]) expect(() => validateExpense(invalid)).toThrow("INVALID_EXPENSE");
  });
  it("calculates the correct beginning of each supported reporting range", () => {
    const now = new Date(2026, 9, 8, 10);
    expect(financePeriodStart("week", now)).toEqual(new Date(2026, 9, 2));
    expect(financePeriodStart("month", now)).toEqual(new Date(2025, 10, 1));
    expect(financePeriodStart("quarter", now)).toEqual(new Date(2026, 0, 1));
    expect(financePeriodStart("year", now)).toEqual(new Date(2023, 0, 1));
  });
});
