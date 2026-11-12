import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("../../src/services/returns", async (original) => ({ ...(await original<typeof import("../../src/services/returns")>()), fetchReturns: vi.fn(), updateReturn: vi.fn() }));
import { fetchReturns, updateReturn, type ReturnRequest } from "../../src/services/returns";
import AdminReturnsView from "../../src/components/admin/views/AdminReturnsView";
const request: ReturnRequest = { id: "r1", orderId: "o1", orderNumber: "ORD-QA", customer: { name: "Ana", email: "ana@example.test" }, status: "PENDING", reason: "Cambio de talla", comment: null, amount: 80, createdAt: "2026-10-08", refundStatus: "NOT_REQUESTED", receivedAt: null, refundedAt: null, items: [{ sizeId: "s1", name: "Polo", size: "M", quantity: 1 }] };
describe("real return workflow UI", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchReturns).mockResolvedValue([request]); });
  it("loads real requests and persists approval before offering receipt", async () => {
    vi.mocked(updateReturn).mockResolvedValue({ ...request, status: "APPROVED", comment: "Validar talla" });
    const user = userEvent.setup(); render(<AdminReturnsView />);
    expect(await screen.findByText(/ORD-QA/)).toBeInTheDocument(); expect(screen.queryByText("Mock")).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Comentario opcional"), "Validar talla"); await user.click(screen.getByRole("button", { name: "Aprobar devolución" }));
    expect(updateReturn).toHaveBeenCalledWith("r1", "review", { decision: "APPROVED", comment: "Validar talla" });
    expect(await screen.findByRole("button", { name: /Confirmar recepción/ })).toBeInTheDocument();
    expect(screen.queryByText("Reembolso confirmado")).not.toBeInTheDocument();
  });
  it("does not advance status when the server rejects the decision", async () => {
    vi.mocked(updateReturn).mockRejectedValue(new Error("offline")); const user = userEvent.setup(); render(<AdminReturnsView />);
    await screen.findByText(/ORD-QA/); await user.click(screen.getByRole("button", { name: "Aprobar devolución" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar");
    expect(screen.getByRole("button", { name: "Aprobar devolución" })).toBeInTheDocument();
  });
});
