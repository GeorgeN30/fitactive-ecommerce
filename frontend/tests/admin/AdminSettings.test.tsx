import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminSettingsView from "../../src/components/admin/views/AdminSettingsView";

describe("AdminSettingsView", () => {
  it("muestra las secciones de configuracion", () => {
    render(<AdminSettingsView />);
    expect(screen.getByText("Configuración del Panel")).toBeInTheDocument();
    expect(screen.getByText("Configuración General")).toBeInTheDocument();
    expect(screen.getByText("Seguridad")).toBeInTheDocument();
  });

  it("alterna el modo de pruebas de pagos", async () => {
    const user = userEvent.setup();
    render(<AdminSettingsView />);
    const field = screen
      .getByText("Modo Pruebas (Sandbox)")
      .closest("div") as HTMLElement;
    const button = field.querySelector("button") as HTMLButtonElement;
    const status = field.querySelector("span") as HTMLSpanElement;
    expect(status).toHaveTextContent("Activado");
    await user.click(button);
    expect(status).toHaveTextContent("Desactivado");
  });
});