import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminFinanceView from "../../src/components/admin/views/AdminFinanceView";
import { createFinanceExpense, fetchFinanceData } from "../../src/services/finance";

vi.mock("../../src/services/finance", () => ({
  fetchFinanceData: vi.fn(),
  createFinanceExpense: vi.fn(),
}));

const financeData = {
  period: "month" as const,
  periodLabel: "Últimos 12 meses",
  revenue: 1250,
  ordersCount: 3,
  returnsCount: 0,
  monthlyRevenue: [
    { label: "Oct", value: 1250 },
    { label: "Nov", value: 0 },
  ],
  transactions: [
    {
      reference: "ORD-001",
      description: "Venta online",
      date: "2026-10-01",
      amount: 1250,
      type: "Ingreso" as const,
    },
  ],
  categories: [
    { name: "Clothing", amount: 1250, units: 3, percentage: 100 },
  ],
  expenses: [],
  expenseTotal: 0,
  paymentMethods: [{ name: "Mercado Pago", transactions: 3, amount: 1250, percentage: 100 }],
};

describe("AdminFinanceView", () => {
  beforeEach(() => {
    vi.mocked(fetchFinanceData).mockResolvedValue(financeData);
  });

  it("renders persisted sales and payment summaries", async () => {
    render(<AdminFinanceView />);

    expect(await screen.findByText("Finanzas")).toBeInTheDocument();
    expect(screen.queryByText("Conectado")).not.toBeInTheDocument();
    expect(screen.getAllByText("S/ 1,250.00").length).toBeGreaterThan(0);
    expect(screen.getByText("3 pedidos, gastos y reembolsos del periodo")).toBeInTheDocument();
    expect(screen.getByText("Métodos de pago")).toBeInTheDocument();
    expect(screen.getByText(/3 pagos aprobados/)).toBeInTheDocument();
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Registrar egreso" })).toBeInTheDocument();
  });

  it("shows an honest empty state when the database has no finance data", async () => {
    vi.mocked(fetchFinanceData).mockResolvedValue({
      period: "month",
      periodLabel: "Últimos 12 meses",
      revenue: 0,
      ordersCount: 0,
      returnsCount: 0,
      monthlyRevenue: [],
      transactions: [],
      categories: [],
      expenses: [],
      expenseTotal: 0,
      paymentMethods: [],
    });
    render(<AdminFinanceView />);

    await waitFor(() => {
      expect(screen.getByText("Aún no hay ventas registradas en la base de datos.")).toBeInTheDocument();
    });
    expect(screen.getByText("No hay movimientos financieros registrados todavía.")).toBeInTheDocument();
  });

  it("saves operating expenses and refreshes the financial data", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    vi.mocked(createFinanceExpense).mockResolvedValue({ id: "expense1", category: "Operaciones", description: "Flete", amount: 25, spentAt: "2026-10-08" });
    vi.mocked(fetchFinanceData).mockResolvedValueOnce(financeData).mockResolvedValueOnce({ ...financeData, revenue: 1225, expenseTotal: 25, expenses: [{ id: "expense1", category: "Operaciones", description: "Flete", amount: 25, spentAt: "2026-10-08" }] });
    render(<AdminFinanceView />);
    await user.type(await screen.findByLabelText("Descripción"), "Flete");
    await user.type(screen.getByLabelText("Importe (S/)"), "25");
    await user.click(screen.getByRole("button", { name: "Registrar egreso" }));
    expect(createFinanceExpense).toHaveBeenCalledWith(expect.objectContaining({ category: "Operaciones", description: "Flete", amount: 25 }));
    expect(await screen.findByText("Flete")).toBeInTheDocument();
  });
});
