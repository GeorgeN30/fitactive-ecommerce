import { describe, it, expect, vi, beforeAll } from "vitest";

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
});
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AdminDashboard from "../../src/pages/admin/AdminDashboard";

vi.mock("react-chartjs-2", () => ({
  Line: () => null,
  Doughnut: () => null,
}));

function renderDashboard() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe("AdminDashboard", () => {
  it("muestra el dashboard financiero por defecto", async () => {
    renderDashboard();
    expect(screen.getByText("Dashboard Financiero")).toBeInTheDocument();
    expect(screen.getByText("Últimos pedidos")).toBeInTheDocument();
  });

  it("navega a la vista de pedidos desde el sidebar", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByRole("button", { name: "Pedidos" }));
    expect(await screen.findByText("Gestión de Pedidos")).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-001")).toBeInTheDocument();
  });
});