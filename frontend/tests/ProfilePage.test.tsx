import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
vi.mock("../src/components/ProfileLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
const auth = vi.hoisted(() => ({
  user: { id: "u1", name: "Ana", email: "ana@example.test", genero: "Mujer", bodyType: null as "slim" | "average" | "broad" | null,
    preferencia_deporte: null as string | null, preferencia_ropa: null as string | null, preferencia_colores: null as string | null,
    onboarding_completado: true },
  updateProfile: vi.fn(),
}));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../src/context/FavoritesContext", () => ({ useFavorites: () => ({ favorites: [{ id: "p1" }, { id: "p2" }] }) }));
vi.mock("../src/services/orders", () => ({ fetchMyOrders: vi.fn() }));
vi.mock("../src/services/virtualTryOn", () => ({ fetchMyTryOnHistory: vi.fn().mockResolvedValue([]) }));
import { fetchMyOrders, type OrderView } from "../src/services/orders";
import ProfilePage from "../src/pages/ProfilePage";
describe("profile live statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    auth.user.bodyType = null;
    auth.user.preferencia_deporte = null;
    auth.user.preferencia_ropa = null;
    auth.user.preferencia_colores = null;
    auth.user.onboarding_completado = true;
    auth.updateProfile.mockResolvedValue(undefined);
    vi.mocked(fetchMyOrders).mockResolvedValue([]);
  });
  it("normalizes saved gender and uses actual orders, refunds and favorites", async () => {
    vi.mocked(fetchMyOrders).mockResolvedValue([{ id: "o1", estado: "delivered", total: 100, refundedAmount: 20 }, { id: "o2", estado: "pending", total: 1000 }] as OrderView[]);
    render(<ProfilePage />);
    expect(await screen.findByText("S/ 80.00")).toBeInTheDocument();
    expect(screen.getByLabelText("Género")).toHaveValue("Femenino");
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(fetchMyOrders).toHaveBeenCalledOnce();
  });
  it("does not pretend statistics are zero when the API fails", async () => {
    vi.mocked(fetchMyOrders).mockRejectedValue(new Error("offline")); render(<ProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron consultar");
    expect(screen.queryByText("S/ 0.00")).not.toBeInTheDocument();
  });

  it("saves the selected body type through the profile API", async () => {
    localStorage.setItem("fitlook_tipo_cuerpo_u1", "delgado");
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.selectOptions(screen.getByLabelText("Tipo de cuerpo"), "broad");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(auth.updateProfile).toHaveBeenCalledWith({ name: "Ana", genero: "Femenino", bodyType: "broad",
      preferencia_deporte: null, preferencia_ropa: null, preferencia_colores: null, onboarding_completado: true });
    expect(await screen.findByRole("status")).toHaveTextContent("Perfil guardado con éxito");
    expect(localStorage.getItem("fitlook_tipo_cuerpo_u1")).toBeNull();
  });

  it("recovers the legacy preference only when the account has none", async () => {
    localStorage.setItem("fitlook_tipo_cuerpo_u1", "ancho");
    const { unmount } = render(<ProfilePage />);
    expect(screen.getByLabelText("Tipo de cuerpo")).toHaveValue("broad");
    await screen.findByText("S/ 0.00");
    unmount();
    auth.user.bodyType = "slim";
    render(<ProfilePage />);
    expect(screen.getByLabelText("Tipo de cuerpo")).toHaveValue("slim");
    await screen.findByText("S/ 0.00");
    expect(auth.updateProfile).not.toHaveBeenCalled();
  });

  it("does not import another account's browser preference", async () => {
    localStorage.setItem("fitlook_tipo_cuerpo_u2", "ancho");
    render(<ProfilePage />);
    expect(screen.getByLabelText("Tipo de cuerpo")).toHaveValue("average");
    await screen.findByText("S/ 0.00");
  });

  it("keeps the legacy preference and reports a failed save honestly", async () => {
    localStorage.setItem("fitlook_tipo_cuerpo_u1", "ancho");
    auth.updateProfile.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.selectOptions(screen.getByLabelText("Tipo de cuerpo"), "slim");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar tus datos. Inténtalo de nuevo o continúa desde tu perfil."));
    expect(localStorage.getItem("fitlook_tipo_cuerpo_u1")).toBe("ancho");
    expect(auth.user.bodyType).toBeNull();
  });

  it("preloads preferences, saves edits and explicitly clears them with null", async () => {
    Object.assign(auth.user, { preferencia_deporte: "Running", preferencia_ropa: "Regular", preferencia_colores: "Oscuros" });
    const user = userEvent.setup();
    render(<ProfilePage />);
    expect(screen.getByLabelText("Deporte / Disciplina")).toHaveValue("Running");
    expect(screen.getByLabelText("Corte de prenda habitual")).toHaveValue("Regular");
    expect(screen.getByLabelText("Gama de color preferida")).toHaveValue("Oscuros");
    expect(screen.queryByText(/Tus preferencias están pendientes/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Deporte / Disciplina"), "Yoga");
    await user.selectOptions(screen.getByLabelText("Corte de prenda habitual"), "Oversize");
    await user.selectOptions(screen.getByLabelText("Gama de color preferida"), "Claros");
    expect(auth.updateProfile).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(auth.updateProfile).toHaveBeenLastCalledWith({ name: "Ana", genero: "Femenino", bodyType: "average",
      preferencia_deporte: "Yoga", preferencia_ropa: "Oversize", preferencia_colores: "Claros", onboarding_completado: true });
    for (const label of ["Deporte / Disciplina", "Corte de prenda habitual", "Gama de color preferida"]) {
      await user.selectOptions(screen.getByLabelText(label), "");
    }
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(auth.updateProfile).toHaveBeenLastCalledWith({ name: "Ana", genero: "Femenino", bodyType: "average",
      preferencia_deporte: null, preferencia_ropa: null, preferencia_colores: null, onboarding_completado: true });
  });

  it("reminds a customer who skipped that missing preferences remain optional", async () => {
    render(<ProfilePage />);
    expect(screen.getByText(/Tus preferencias están pendientes/)).toHaveTextContent("no son obligatorias para usar la tienda");
    for (const label of ["Deporte / Disciplina", "Corte de prenda habitual", "Gama de color preferida"]) {
      expect(screen.getByLabelText(label)).toHaveValue("");
    }
    await screen.findByText("S/ 0.00");
    expect(auth.updateProfile).not.toHaveBeenCalled();
  });
});
