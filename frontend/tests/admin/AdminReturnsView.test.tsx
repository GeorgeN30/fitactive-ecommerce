import { fireEvent, render, screen } from "@testing-library/react";
import AdminReturnsView from "../../src/components/admin/views/AdminReturnsView";

describe("AdminReturnsView", () => {
  it("muestra solicitudes pendientes en modo mock", () => {
    render(<AdminReturnsView />);

    expect(screen.getByText("Mock")).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00841")).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00836")).toBeInTheDocument();
    expect(screen.queryByText("ORD-2026-00812")).not.toBeInTheDocument();
  });

  it("permite registrar una decisión local sobre una solicitud", () => {
    render(<AdminReturnsView />);

    fireEvent.change(screen.getAllByPlaceholderText("Comentario opcional")[0], {
      target: { value: "Validar cambio de talla." },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Aprobar/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Todas" }));

    expect(screen.getByText("Validar cambio de talla.")).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00841")).toBeInTheDocument();
  });
});
