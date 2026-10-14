import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
vi.mock("../src/components/ProfileLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => ({ user: { name: "Ana", email: "ana@example.test", genero: "Mujer" }, updateProfile: vi.fn() }) }));
vi.mock("../src/context/FavoritesContext", () => ({ useFavorites: () => ({ favorites: [{ id: "p1" }, { id: "p2" }] }) }));
vi.mock("../src/services/orders", () => ({ fetchMyOrders: vi.fn() }));
import { fetchMyOrders, type OrderView } from "../src/services/orders";
import ProfilePage from "../src/pages/ProfilePage";
describe("profile live statistics", () => {
  beforeEach(() => vi.clearAllMocks());
  it("normalizes saved gender and uses actual orders, refunds and favorites", async () => {
    vi.mocked(fetchMyOrders).mockResolvedValue([{ id: "o1", estado: "delivered", total: 100, refundedAmount: 20 }, { id: "o2", estado: "pending", total: 1000 }] as OrderView[]);
    render(<ProfilePage />);
    expect(await screen.findByText("S/ 80.00")).toBeInTheDocument();
    expect(screen.getByLabelText("Género")).toHaveValue("Femenino");
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(fetchMyOrders).toHaveBeenCalledOnce();
  });
  it("does not pretend statistics are zero when the API fails", async () => {
    vi.mocked(fetchMyOrders).mockRejectedValue(new Error("offline")); render(<ProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron consultar");
    expect(screen.queryByText("S/ 0.00")).not.toBeInTheDocument();
  });
});
