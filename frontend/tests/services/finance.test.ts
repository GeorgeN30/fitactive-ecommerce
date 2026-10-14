import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import api from "../../src/services/api";
import { createFinanceExpense, fetchFinanceData } from "../../src/services/finance";
describe("finance API service", () => {
  beforeEach(() => vi.clearAllMocks());
  it("maps persisted reports and supplies honest empty defaults", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { summary: { period: "week", revenue: 120, ordersCount: 2, returnsCount: 1, expenses: [{ id: "e1" }], expenseTotal: 20, paymentMethods: [{ name: "Mercado Pago" }] } } }).mockResolvedValueOnce({ data: {} });
    const data = await fetchFinanceData("week");
    expect(data).toMatchObject({ period: "week", revenue: 120, expenses: [{ id: "e1" }], expenseTotal: 20, paymentMethods: [{ name: "Mercado Pago" }] });
    expect(await fetchFinanceData("month")).toMatchObject({ period: "month", revenue: 0, expenses: [], expenseTotal: 0, paymentMethods: [] });
  });
  it("persists an expense to the admin API", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { expense: { id: "e1" } } });
    await createFinanceExpense({ category: "Operaciones", description: "Flete", amount: 20 });
    expect(api.post).toHaveBeenCalledWith("/admin/finance/expenses", { category: "Operaciones", description: "Flete", amount: 20 });
  });
});
