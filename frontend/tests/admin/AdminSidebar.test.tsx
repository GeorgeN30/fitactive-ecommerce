import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminSidebar from "../../src/components/admin/AdminSidebar";
import { AuthProvider } from "../../src/context/AuthContext";

function renderSidebar(activeTab: "dashboard" = "dashboard") {
  const onTabChange = vi.fn();
  render(
    <AuthProvider>
      <MemoryRouter>
        <AdminSidebar activeTab={activeTab} onTabChange={onTabChange} />
      </MemoryRouter>
    </AuthProvider>
  );
  return { onTabChange };
}

describe("AdminSidebar", () => {
  it("muestra la marca FITLOOK y la etiqueta ADMIN", () => {
    renderSidebar();
    expect(screen.getByText("FITLOOK")).toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("muestra todos los items de navegacion", () => {
    renderSidebar();
    for (const label of ["Dashboard", "Productos", "Inventario", "Pedidos", "Clientes", "Devoluciones", "Métricas", "Notificaciones", "Configuración"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("notifica el cambio de tab al hacer click", async () => {
    const user = userEvent.setup();
    const { onTabChange } = renderSidebar();
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(onTabChange).toHaveBeenCalledWith("notifications");
  });
});