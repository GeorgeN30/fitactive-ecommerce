import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminCustomers from "../../src/pages/admin/AdminCustomers";

describe("AdminCustomers", () => {
  it("muestra la tabla de clientes con el detalle del primero seleccionado", () => {
    render(<AdminCustomers />);
    expect(screen.getByText("Gestion de Clientes")).toBeInTheDocument();
    expect(screen.getAllByText("Diego Fernandez").length).toBeGreaterThan(0);
    expect(screen.getByText("Activo - Click para Bloquear")).toBeInTheDocument();
  });

  it("selecciona otro cliente y muestra su detalle", async () => {
    const user = userEvent.setup();
    render(<AdminCustomers />);
    await user.click(screen.getByText("Javier Morales"));
    expect(screen.getAllByText("Javier Morales").length).toBeGreaterThan(0);
  });

  it("bloquea y reactiva el estado de la cuenta", async () => {
    const user = userEvent.setup();
    render(<AdminCustomers />);
    await user.click(screen.getByText("Activo - Click para Bloquear"));
    expect(screen.getByText("Bloqueado - Click para Activar")).toBeInTheDocument();
    await user.click(screen.getByText("Bloqueado - Click para Activar"));
    expect(screen.getByText("Activo - Click para Bloquear")).toBeInTheDocument();
  });

  it("cambia el rol del usuario seleccionado", async () => {
    const user = userEvent.setup();
    render(<AdminCustomers />);
    const roleSelect = screen.getAllByRole("combobox")[2];
    await user.selectOptions(roleSelect, "Admin");
    expect((roleSelect as HTMLSelectElement).value).toBe("Admin");
  });
});