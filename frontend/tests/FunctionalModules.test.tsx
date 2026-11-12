import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
vi.mock("../src/services/api", () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock("../src/services/discounts", () => ({ fetchMyDiscountRequests: vi.fn(), createDiscountRequest: vi.fn() }));
vi.mock("../src/components/AppLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "customer1", role: "customer" } }) }));
import api from "../src/services/api";
import { createDiscountRequest, fetchMyDiscountRequests } from "../src/services/discounts";
import AdminSettingsView from "../src/components/admin/views/AdminSettingsView";
import InventoryDiscountsView from "../src/components/inventory/views/InventoryDiscountsView";
import ContactPage from "../src/pages/ContactPage";
import { DEFAULT_STORE_SETTINGS } from "../src/context/StoreSettingsContext";
import type { Product } from "../src/data/adminPrototypeTypes";

describe("functional modules", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it("persists administrative settings and does not claim success on an API failure", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { settings: DEFAULT_STORE_SETTINGS } });
    vi.mocked(api.put).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { settings: { ...DEFAULT_STORE_SETTINGS, storeName: "FitLook QA" } } });
    const user = userEvent.setup(); render(<MemoryRouter><AdminSettingsView /></MemoryRouter>);
    const name = await screen.findByLabelText("Nombre de la tienda"); await user.clear(name); await user.type(name, "FitLook QA");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" })); expect(screen.getByRole("status")).toHaveTextContent("No se pudo guardar");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" })); expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados en la base de datos");
    expect(api.put).toHaveBeenLastCalledWith("/admin/settings", expect.objectContaining({ storeName: "FitLook QA" }));
  });
  it("requests a quick duration without publishing the offer before approval", async () => {
    vi.mocked(fetchMyDiscountRequests).mockResolvedValue([]); vi.mocked(createDiscountRequest).mockResolvedValue([]);
    const product = { id: "p1", name: "Polo", price: 100, sizes: ["M"], stock: { M: 5 }, tallaIds: { M: "s1" }, image: "/polo.png" } as Product;
    const user = userEvent.setup(); render(<InventoryDiscountsView products={[product]} />);
    await screen.findByText("Aún no tienes solicitudes."); await user.click(screen.getByRole("button", { name: /Polo Stock/ })); await user.click(screen.getByRole("button", { name: "M", exact: true }));
    await user.selectOptions(screen.getByLabelText("Duración de la oferta"), "24"); await user.type(screen.getByPlaceholderText(/baja rotación/), "Fin de temporada");
    await user.click(screen.getByRole("button", { name: /Solicitar aprobación/ }));
    expect(createDiscountRequest).toHaveBeenCalledWith(["s1"], 30, "Fin de temporada", { duracionHoras: 24 });
    expect(await screen.findByText(/Solicitud enviada al administrador/)).toBeInTheDocument();
  });
  it("registers support requests and keeps the response history", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tickets: [] } });
    vi.mocked(api.post).mockResolvedValue({ data: { ticket: { id: "t1", subject: "Mi pedido", message: "Necesito información de mi pedido", status: "OPEN", response: null } } });
    const user = userEvent.setup(); render(<MemoryRouter><ContactPage /></MemoryRouter>);
    await screen.findByText("No tienes consultas registradas."); await user.type(screen.getByLabelText("Asunto"), "Mi pedido"); await user.type(screen.getByLabelText("Mensaje"), "Necesito información de mi pedido"); await user.click(screen.getByRole("button", { name: "Enviar consulta" }));
    expect(await screen.findByText("Mi pedido")).toBeInTheDocument(); expect(api.post).toHaveBeenCalledWith("/support", expect.objectContaining({ subject: "Mi pedido" }));
  });
});
