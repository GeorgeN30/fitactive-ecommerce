import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import KPICard from "../../src/components/admin/KPICard";

describe("KPICard", () => {
  it("muestra titulo, valor y crecimiento", () => {
    render(<KPICard title="Ventas Totales" value="$1,234" growth={12.5} icon="fa-dollar-sign" />);
    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getByText("$1,234")).toBeInTheDocument();
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("este mes")).toBeInTheDocument();
  });

  it("muestra crecimiento negativo", () => {
    render(<KPICard title="Devoluciones" value="3" growth={-8} icon="fa-rotate-left" />);
    expect(screen.getByText("-8%")).toBeInTheDocument();
  });

  it("no muestra variacion cuando no hay crecimiento", () => {
    render(<KPICard title="Pedidos" value="42" icon="fa-cart-shopping" />);
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.queryByText(/este mes/)).not.toBeInTheDocument();
  });
});