import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../../src/components/admin/StatusBadge";

describe("StatusBadge", () => {
  it("muestra la etiqueta en español para estados conocidos", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toHaveClass("bg-slate-200");
  });

  it("si no hay etiqueta mapeada muestra el valor capitalizado", () => {
    render(<StatusBadge status="Delivered" />);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("prioriza la etiqueta explícita sobre el mapeo", () => {
    render(<StatusBadge status="pending" label="Espera" />);
    expect(screen.getByText("Espera")).toBeInTheDocument();
  });

  it("renderiza el rol Admin", () => {
    render(<StatusBadge status="Admin" />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});