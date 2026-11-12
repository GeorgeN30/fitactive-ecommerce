import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const state = vi.hoisted(() => {
  let releaseCatalog!: () => void;
  const catalogReady = new Promise<void>((resolve) => { releaseCatalog = resolve; });
  return {
    catalogReady, releaseCatalog,
    catalogLoaded: vi.fn(), adminLoaded: vi.fn(),
    auth: { user: null as null | { role: string; twoFactorEnabled: boolean }, loading: false },
    settings: { twoFactor: false },
  };
});

vi.mock("next-themes", () => ({ ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../../src/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => state.auth,
}));
vi.mock("../../src/context/StoreSettingsContext", () => ({
  StoreSettingsProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useStoreSettings: () => state.settings,
}));
vi.mock("../../src/context/CartContext", () => ({ CartProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../../src/context/FavoritesContext", () => ({ FavoritesProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../../src/pages/HomePage", () => ({ default: () => <h1>Home</h1> }));
vi.mock("../../src/pages/CatalogPage", async () => {
  state.catalogLoaded();
  await state.catalogReady;
  return { default: () => <h1>Catalog</h1> };
});
vi.mock("../../src/pages/TwoFaSetupPage", () => ({ default: () => <h1>MFA setup</h1> }));
vi.mock("../../src/components/admin/AdminLayout", () => {
  state.adminLoaded();
  return { default: () => <h1>Admin</h1> };
});
vi.mock("../../src/pages/ContactPage", () => { throw new Error("Chunk failed"); });

import App from "../../src/App";

describe("route-level lazy loading", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    state.auth.user = null;
    state.settings.twoFactor = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("renders Home eagerly without loading unrelated pages", () => {
    window.history.replaceState(null, "", "/");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(state.catalogLoaded).not.toHaveBeenCalled();
    expect(state.adminLoaded).not.toHaveBeenCalled();
  });

  it("shows the existing fallback until the requested page loads", async () => {
    window.history.replaceState(null, "", "/catalogo?genero=Mujer");
    render(<App />);
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    await act(async () => { state.releaseCatalog(); });
    expect(await screen.findByRole("heading", { name: "Catalog" })).toBeInTheDocument();
    expect(window.location.search).toBe("?genero=Mujer");
  });

  it("enforces staff MFA before loading the admin page", async () => {
    state.auth.user = { role: "admin", twoFactorEnabled: false };
    state.settings.twoFactor = true;
    window.history.replaceState(null, "", "/admin");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "MFA setup" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/2fa-setup");
    expect(state.adminLoaded).not.toHaveBeenCalled();
  });

  it("uses the route error boundary when a page import fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState(null, "", "/soporte/contacto");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "No se pudo mostrar esta página" })).toBeInTheDocument();
  });
});
