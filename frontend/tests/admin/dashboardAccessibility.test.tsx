import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardView from "../../src/components/admin/views/DashboardView";

vi.mock("react-chartjs-2", () => ({ Line: () => null }));

function contrast(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = hex.match(/\w\w/g)!.map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Dashboard accessibility", () => {
  it("renders accessible headings and contrasting populated content", () => {
    const goToOrders = vi.fn();
    render(<DashboardView
      goToOrders={goToOrders}
      metrics={[{ label: "Ventas", value: "10", inc: "+5%" }]}
      salesData={{ labels: ["Ene"], values: [1234] }}
      recentOrders={[{ id: "ORD-1", client: "Ana", total: "S/ 50", status: "cancelled", time: "10:00" }]}
      summary={{ activeCustomers: 1, productsSold: 2, totalReturns: 0 }}
    />);

    expect(screen.getByRole("heading", { name: "Dashboard Financiero", level: 1 })).toBeInTheDocument();
    for (const name of ["Ingresos", "Indicadores operativos", "Últimos pedidos"]) {
      expect(screen.getByRole("heading", { name, level: 2 })).toBeInTheDocument();
    }
    for (const text of ["Vista estratégica del negocio - FITLOOK", "Datos de los últimos 12 meses", "10:00"]) {
      expect(screen.getByText(text)).toHaveClass("text-gray-700", "dark:text-gray-400");
    }
    expect(screen.getByText("S/ 1,234", { selector: "span" })).toHaveClass("text-gray-700", "dark:text-gray-400");
    for (const text of ["Ver todos", "S/ 50", "+5%"]) {
      expect(screen.getByText(text)).toHaveClass("text-green-700", "dark:text-[#00FF66]");
    }
    expect(screen.getByText("Cancelado")).toHaveClass("bg-red-100", "text-red-800");
    expect(screen.getByRole("table", { name: "Ingresos por periodo en soles" })).toHaveTextContent("Ene");
    expect(screen.getByRole("table", { name: "Ingresos por periodo en soles" })).toHaveTextContent("S/ 1,234");
    fireEvent.click(screen.getByRole("button", { name: "Ver todos" }));
    expect(goToOrders).toHaveBeenCalledOnce();
  });

  it("keeps empty-state text readable in both themes", () => {
    render(<DashboardView />);
    for (const text of ["No hay estadísticas disponibles.", "No hay ventas registradas.", "No hay pedidos registrados."]) {
      expect(screen.getByText(text)).toHaveClass("text-gray-700", "dark:text-gray-400");
    }
    expect(screen.queryByRole("button", { name: "Ver todos" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ingresos", level: 2 })).toBeInTheDocument();
  });

  it("uses WCAG AA color pairs for normal text", () => {
    // Tailwind's default palette, including the hovered order row backgrounds.
    for (const [foreground, background] of [
      ["374151", "ffffff"], ["374151", "f9fafb"],
      ["9ca3af", "18181b"], ["9ca3af", "27272a"],
      ["15803d", "ffffff"], ["15803d", "f9fafb"],
      ["00ff66", "18181b"], ["00ff66", "27272a"],
      ["991b1b", "fee2e2"],
    ]) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
