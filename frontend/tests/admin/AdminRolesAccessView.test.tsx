import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminRolesAccessView from "../../src/components/admin/views/AdminRolesAccessView";
import type { User } from "../../src/data/adminPrototypeTypes";

const users: User[] = [
  {
    id: "u1",
    name: "Ana Cliente",
    email: "ana@example.com",
    phone: "",
    avatar: "https://example.com/ana.jpg",
    role: "client",
    blocked: false,
    registeredAt: "2026-09-01",
    lastAccess: "2026-09-01",
  },
  {
    id: "u2",
    name: "Bruno Inventario",
    email: "bruno@example.com",
    phone: "",
    avatar: "https://example.com/bruno.jpg",
    role: "inventory",
    blocked: false,
    registeredAt: "2026-09-02",
    lastAccess: "2026-09-02",
  },
];

describe("AdminRolesAccessView", () => {
  it("muestra usuarios y actualiza la fila después de cambiar el rol", async () => {
    const onRoleChange = vi.fn().mockResolvedValue({
      ...users[0],
      role: "inventory",
    });

    render(<AdminRolesAccessView users={users} onRoleChange={onRoleChange} />);

    expect(screen.getByText("Ana Cliente")).toBeInTheDocument();
    expect(screen.getByText("Bruno Inventario")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);

    fireEvent.change(screen.getByRole("combobox", { name: "Rol de Ana Cliente" }), {
      target: { value: "inventory" },
    });

    await waitFor(() => {
      expect(onRoleChange).toHaveBeenCalledWith(users[0], "inventory");
    });
    expect(screen.getByRole("combobox", { name: "Rol de Ana Cliente" })).toHaveValue(
      "inventory",
    );
  });
});
