import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminFinanceView from "../../src/components/admin/views/AdminFinanceView";

describe("AdminFinanceView", () => {
  it("renders the mock financial summary and payment methods", () => {
    render(<AdminFinanceView />);

    expect(screen.getByRole("heading", { name: "Finanzas" })).toBeInTheDocument();
    expect(screen.getByText("Datos simulados para validar la experiencia visual. Mercado Pago y los reportes reales todavía no están conectados.")).toBeInTheDocument();
    expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
    expect(screen.getByText("Tarjeta de débito")).toBeInTheDocument();
  });

  it("changes the selected period", () => {
    render(<AdminFinanceView />);

    fireEvent.click(screen.getByRole("button", { name: "Semana" }));

    expect(screen.getByText("Últimos 7 días")).toBeInTheDocument();
    expect(screen.getByText("Comparativo semana")).toBeInTheDocument();
  });
});
