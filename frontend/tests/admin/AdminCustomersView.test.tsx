import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminCustomersView from "../../src/components/admin/views/AdminCustomersView";
import type { User } from "../../src/data/adminPrototypeTypes";

const customer: User = {
  id: "customer-1",
  name: "Cliente Demo",
  email: "customer@example.com",
  phone: "999999999",
  avatar: "https://example.com/avatar.png",
  role: "client",
  blocked: false,
  customerMeasurements: {
    chest: 96,
    waist: 82,
    hips: 100,
    updatedAt: "2026-01-01",
  },
  registeredAt: "2026-01-01",
  lastAccess: "2026-01-02",
  orders: 1,
  spent: 59.9,
};

describe("AdminCustomersView", () => {
  it("muestra medidas reales y permite bloquear al cliente", async () => {
    const user = userEvent.setup();
    const onToggleBlock = vi.fn().mockResolvedValue({
      ...customer,
      blocked: true,
    });

    render(
      <AdminCustomersView
        clients={[customer]}
        onToggleBlock={onToggleBlock}
      />,
    );

    await user.click(screen.getByText("Cliente Demo"));
    expect(screen.getByText("96 cm")).toBeInTheDocument();
    expect(screen.getByText("82 cm")).toBeInTheDocument();
    expect(screen.getByText("100 cm")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bloquear cliente" }));

    await waitFor(() => {
      expect(onToggleBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: customer.id,
          blocked: false,
          status: "active",
        }),
      );
      expect(
        screen.getByRole("button", { name: "Desbloquear cliente" }),
      ).toBeInTheDocument();
    });
    expect(screen.getAllByText("bloqueado")).toHaveLength(2);
  });
});
