import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminSettings from "../../src/pages/admin/AdminSettings";

describe("AdminSettings", () => {
  it("muestra las preferencias y la gestion de roles", () => {
    render(<AdminSettings />);
    expect(screen.getByText("Configuracion")).toBeInTheDocument();
    expect(screen.getByText("Notificaciones en tiempo real")).toBeInTheDocument();
    expect(screen.getByText("Gestion de Roles")).toBeInTheDocument();
    expect(screen.getByText("Diego Fernandez")).toBeInTheDocument();
  });

  it("alterna las notificaciones en tiempo real", async () => {
    const user = userEvent.setup();
    render(<AdminSettings />);
    const toggle = screen.getByRole("button", { name: "Notificaciones en tiempo real" });
    const knob = toggle.querySelector("span");
    expect(knob).toHaveClass("translate-x-6");
    await user.click(toggle);
    expect(knob).not.toHaveClass("translate-x-6");
  });

  it("cambia el rol de un usuario y bloquea su cuenta", async () => {
    const user = userEvent.setup();
    render(<AdminSettings />);
    const roleSelect = screen.getByLabelText("Rol de Diego Fernandez");
    await user.selectOptions(roleSelect, "Admin");
    expect((roleSelect as HTMLSelectElement).value).toBe("Admin");

    await user.click(screen.getAllByRole("button", { name: "Bloquear" })[0]);
    expect(screen.getAllByRole("button", { name: "Activar" }).length).toBeGreaterThan(0);
  });
});