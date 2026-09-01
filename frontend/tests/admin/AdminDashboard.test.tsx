import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "../../src/pages/admin/AdminDashboard";

vi.mock("react-chartjs-2", () => ({
  Line: () => null,
  Doughnut: () => null,
}));

describe("AdminDashboard", () => {
  it("carga las estadisticas del dashboard de forma asincrona", async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText("Panel de Control")).toBeInTheDocument();
    expect(await screen.findByText("Ventas Totales")).toBeInTheDocument();
  });

  it("muestra las ultimas ventas en la tabla", async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText("Últimas Ventas")).toBeInTheDocument();
    expect(await screen.findByText("#FL-2026-00847")).toBeInTheDocument();
  });
});