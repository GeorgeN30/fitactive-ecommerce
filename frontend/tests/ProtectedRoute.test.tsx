import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { User } from "../src/context/AuthContext";
import ProtectedRoute from "../src/routes/ProtectedRoute";

const auth = vi.hoisted(() => ({ user: null as User | null, loading: false }));
const settings = vi.hoisted(() => ({ twoFactor: false }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../src/context/StoreSettingsContext", () => ({ useStoreSettings: () => settings }));

function renderRoute(requiredRole?: string | string[]) {
  return render(<MemoryRouter initialEntries={["/perfil"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/perfil" element={<ProtectedRoute requiredRole={requiredRole}><h1>Perfil accesible</h1></ProtectedRoute>} />
      <Route path="/login" element={<h1>Login</h1>} />
      <Route path="/" element={<h1>Inicio</h1>} />
      <Route path="/2fa-setup" element={<h1>Configurar MFA</h1>} />
    </Routes>
  </MemoryRouter>);
}

describe("ProtectedRoute optional onboarding", () => {
  beforeEach(() => {
    auth.loading = false;
    auth.user = { id: "u1", email: "ana@example.test", name: "Ana", picture: null, role: "customer", onboarding_completado: false };
    settings.twoFactor = false;
  });

  it("allows an incomplete customer to reach /perfil without requiring preferences or MFA", () => {
    settings.twoFactor = true;
    renderRoute();
    expect(screen.getByRole("heading", { name: "Perfil accesible" })).toBeInTheDocument();
  });

  it("waits for authentication before rendering protected content", () => {
    auth.loading = true;
    renderRoute();
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("still redirects anonymous users to login", () => {
    auth.user = null;
    renderRoute();
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  it.each([{ role: "admin" }, { role: ["inventory", "admin"] }])("still enforces role restriction $role before MFA", ({ role }) => {
    settings.twoFactor = true;
    renderRoute(role);
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeInTheDocument();
  });

  it.each([
    [true, false, "Configurar MFA"],
    [true, true, "Perfil accesible"],
    [false, false, "Perfil accesible"],
  ])("enforces configured MFA (%s) for authorized staff with enrollment %s", (required, enabled, heading) => {
    auth.user = { ...auth.user!, role: "admin", twoFactorEnabled: enabled };
    settings.twoFactor = required;
    renderRoute(["inventory", "admin"]);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });
});
