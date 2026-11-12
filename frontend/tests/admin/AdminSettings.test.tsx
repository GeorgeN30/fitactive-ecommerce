import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
vi.mock("../../src/services/api", () => ({ default: { get: vi.fn(), put: vi.fn() } }));
import api from "../../src/services/api";
import AdminSettingsView from "../../src/components/admin/views/AdminSettingsView";
import { DEFAULT_STORE_SETTINGS } from "../../src/context/StoreSettingsContext";
describe("AdminSettingsView", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: { settings: DEFAULT_STORE_SETTINGS } }); });
  it("loads effective settings and exposes account security", async () => {
    render(<MemoryRouter><AdminSettingsView /></MemoryRouter>);
    expect(await screen.findByLabelText("Nombre de la tienda")).toHaveValue("FITLOOK Perú");
    expect(screen.getByRole("link", { name: "Seguridad de mi cuenta" })).toHaveAttribute("href", "/configuracion");
    expect(screen.queryByText("Modo Pruebas (Sandbox)")).not.toBeInTheDocument();
  });
  it("saves only changed fields, preserving another admin's unrelated settings", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { settings: { ...DEFAULT_STORE_SETTINGS, limit: 70 } } });
    const user = userEvent.setup(); render(<MemoryRouter><AdminSettingsView /></MemoryRouter>);
    const limit = await screen.findByLabelText("Sesiones del probador por IP al día"); await user.clear(limit); await user.type(limit, "70"); await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(api.put).toHaveBeenCalledWith("/admin/settings", { limit: 70 });
    expect(await screen.findByRole("status")).toHaveTextContent("Cambios guardados");
  });
});
