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

  it("permite buscar y paginar usuarios del sistema", () => {
    const manyUsers = [
      ...users,
      ...Array.from({ length: 10 }, (_, index) => ({
        ...users[0],
        id: `u-${index + 3}`,
        name: `Usuario ${index + 3}`,
        email: `usuario${index + 3}@example.com`,
      })),
    ];

    render(<AdminRolesAccessView users={manyUsers} onRoleChange={vi.fn()} />);

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Usuario 3")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar usuarios del sistema" }), {
      target: { value: "Usuario 12" },
    });

    expect(screen.getByText("Usuario 12")).toBeInTheDocument();
    expect(screen.queryByText("Usuario 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Página 1 de 2")).not.toBeInTheDocument();
  });
});
