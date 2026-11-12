import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuth, type User } from "../src/context/AuthContext";
import OnboardingModal from "../src/components/OnboardingModal";
import api from "../src/services/api";

vi.mock("../src/services/api", () => ({ default: { put: vi.fn() } }));
vi.mock("../src/context/StoreSettingsContext", () => ({ useStoreSettings: () => ({ timeout: 30 }) }));

const customer: User = {
  id: "u1", name: "Ana", email: "ana@example.test", role: "customer", picture: null,
  onboarding_completado: false,
};
const preferences = { preferencia_deporte: "Yoga", preferencia_ropa: "Oversize", preferencia_colores: "Claros" };

function Journey() {
  const { establishSession } = useAuth();
  const { key, pathname } = useLocation();
  return <>
    <Link to="/catalogo">Catálogo</Link>
    <Link to="/carrito">Carrito</Link>
    <button onClick={() => establishSession("other-token", { ...customer, id: "u2", genero: "Hombre" })}>Cambiar cuenta</button>
    <p>Ruta: {pathname}</p>
    <OnboardingModal key={key} />
  </>;
}

function renderJourney(path = "/catalogo") {
  return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider><Journey /></AuthProvider>
  </MemoryRouter>);
}

async function selectPreferences(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Mujer" }));
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
  await user.selectOptions(screen.getByLabelText("Deporte / Disciplina"), "Yoga");
  await user.selectOptions(screen.getByLabelText("Corte de prenda habitual"), "Oversize");
  await user.selectOptions(screen.getByLabelText("Gama de color preferida"), "Claros");
}

describe("optional onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify(customer));
  });

  it("renders outside transformed route containers so the modal stays viewport centered", () => {
    const view = renderJourney();
    const overlay = screen.getByRole("dialog").parentElement;
    expect(overlay?.parentElement).toBe(document.body);
    expect(view.container).not.toContainElement(screen.getByRole("dialog"));
  });

  it("saves only gender and preferences, then stays hidden after navigation and session reload", async () => {
    const saved = { ...customer, genero: "Mujer", ...preferences, onboarding_completado: true };
    vi.mocked(api.put).mockResolvedValue({ data: { user: saved } });
    const user = userEvent.setup();
    const view = renderJourney();
    await selectPreferences(user);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(api.put).toHaveBeenCalledExactlyOnceWith("/auth/me", {
      genero: "Mujer", ...preferences, onboarding_completado: true,
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("link", { name: "Carrito" }));
    expect(screen.getByText("Ruta: /carrito")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    view.unmount();
    renderJourney();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(saved);
  });

  it.each([1, 2])("top skip on step %s sends only the handled flag and waits for confirmation", async (step) => {
    const existing = { ...customer, preferencia_deporte: "Running" };
    localStorage.setItem("user", JSON.stringify(existing));
    let confirm!: (value: { data: { user: User } }) => void;
    vi.mocked(api.put).mockImplementation(() => new Promise((resolve) => { confirm = resolve; }));
    const user = userEvent.setup();
    const view = renderJourney();
    await user.click(screen.getByRole("button", { name: "Mujer" }));
    if (step === 2) await selectPreferences(user);
    expect(api.put).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(existing);
    await user.click(screen.getByRole("button", { name: "Omitir por ahora" }));
    expect(api.put).toHaveBeenCalledExactlyOnceWith("/auth/me", { onboarding_completado: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Omitir por ahora" })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(existing);
    const saved = { ...existing, onboarding_completado: true };
    await act(async () => { confirm({ data: { user: saved } }); });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(saved);
    await user.click(screen.getByRole("link", { name: "Carrito" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    view.unmount();
    renderJourney();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["profile", customer, "/perfil"],
    ["handled customer", { ...customer, onboarding_completado: true }, "/catalogo"],
    ["legacy customer", { ...customer, onboarding_completado: undefined }, "/catalogo"],
    ["admin", { ...customer, role: "admin" }, "/catalogo"],
    ["anonymous", null, "/catalogo"],
  ] as const)("does not prompt %s", (_label, account, path) => {
    if (account) localStorage.setItem("user", JSON.stringify(account));
    else localStorage.clear();
    renderJourney(path);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();
  });

  it.each([
    [400, "No pudimos guardar tus datos. Revisa los valores seleccionados e inténtalo de nuevo."],
    [undefined, "No pudimos conectar con el servidor. Inténtalo de nuevo o continúa desde tu perfil."],
  ])("reports %s failures accurately, retaining selections for retry", async (status, message) => {
    vi.mocked(api.put).mockRejectedValueOnce({ isAxiosError: true, response: status ? { status } : undefined })
      .mockResolvedValueOnce({ data: { user: { ...customer, ...preferences, genero: "Mujer", onboarding_completado: true } } });
    const user = userEvent.setup();
    renderJourney();
    await selectPreferences(user);
    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("link", { name: "Continuar desde mi perfil" })).toHaveAttribute("href", "/perfil");
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(customer);
    expect(screen.getByLabelText("Deporte / Disciplina")).toHaveValue("Yoga");
    expect(screen.getByLabelText("Corte de prenda habitual")).toHaveValue("Oversize");
    expect(screen.getByLabelText("Gama de color preferida")).toHaveValue("Claros");
    await user.click(screen.getByRole("button", { name: "Atrás" }));
    expect(screen.getByRole("button", { name: "Mujer" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(api.put).toHaveBeenNthCalledWith(2, "/auth/me", { genero: "Mujer", ...preferences, onboarding_completado: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("lets a failed skip escape to profile without marking onboarding handled", async () => {
    vi.mocked(api.put).mockRejectedValue({ isAxiosError: true });
    const user = userEvent.setup();
    renderJourney();
    await user.click(screen.getByRole("button", { name: "Omitir por ahora" }));
    await user.click(await screen.findByRole("link", { name: "Continuar desde mi perfil" }));
    expect(screen.getByText("Ruta: /perfil")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("user")!).onboarding_completado).toBe(false);
  });

  it("discards the previous account's unsaved step and preferences on account switch", async () => {
    const user = userEvent.setup();
    renderJourney();
    await selectPreferences(user);
    await user.click(screen.getByRole("button", { name: "Cambiar cuenta" }));
    expect(screen.getByRole("button", { name: "Hombre" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mujer" })).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    for (const select of screen.getAllByRole("combobox")) expect(select).toHaveValue("");
    expect(api.put).not.toHaveBeenCalled();
  });
});
