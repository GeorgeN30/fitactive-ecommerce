import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "../src/pages/RegisterPage";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ establishSession: vi.fn() }),
}));

vi.mock("../src/components/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LegalModal: () => null,
}));

vi.mock("../src/components/SuccessOverlay", () => ({ default: () => null }));

function renderRegistration() {
  return render(<MemoryRouter><RegisterPage /></MemoryRouter>);
}

describe("RegisterPage validation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("shows associated neutral hints and password requirements before interaction", () => {
    renderRegistration();

    expect(screen.getByLabelText("Nombre Completo")).toHaveAttribute("autocomplete", "name");
    const email = screen.getByLabelText("Correo Electrónico");
    expect(email).toHaveAttribute("aria-invalid", "false");
    expect(email).toHaveAccessibleDescription("Aceptamos Gmail, Outlook, Hotmail, Live, Yahoo, iCloud y Proton.");
    expect(screen.getByText(/Aceptamos Gmail/).closest("p")).toHaveClass("text-sm", "text-slate-600");
    const password = screen.getByLabelText("Contraseña", { exact: true });
    expect(password).toHaveAttribute("aria-invalid", "false");
    expect(password).toHaveAccessibleDescription(/Tu contraseña debe incluir:/);
    expect(screen.getAllByText("Pendiente:")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeDisabled();
  });

  it("distinguishes missing, unsupported and valid emails without changing accepted domains", async () => {
    const user = userEvent.setup();
    renderRegistration();
    const email = screen.getByLabelText("Correo Electrónico");
    await user.click(email);
    await user.tab();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Ingresa tu correo electrónico.");

    await user.type(email, "user@example.com");
    expect(email).toHaveAccessibleDescription("Utiliza un correo personal de un proveedor admitido.");
    await user.clear(email);
    await user.type(email, "user@gmail.com");
    expect(email).toHaveAttribute("aria-invalid", "false");
    expect(email).toHaveAccessibleDescription("Correo personal válido.");
    expect(screen.getByText("Correo personal válido.").closest("p")).toHaveClass("text-emerald-700");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("updates password requirement states and removes the associated error when satisfied", async () => {
    const user = userEvent.setup();
    renderRegistration();
    const password = screen.getByLabelText("Contraseña", { exact: true });
    await user.type(password, "a");

    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAccessibleDescription(/Completa los requisitos de la contraseña/);
    expect(screen.getAllByText("Cumplido:")).toHaveLength(1);
    expect(screen.getAllByText("Pendiente:")).toHaveLength(4);

    await user.type(password, "A123456!");
    expect(password).toHaveAttribute("aria-invalid", "false");
    expect(password).toHaveAttribute("aria-describedby", "registration-password-requirements");
    expect(screen.queryByText("Completa los requisitos de la contraseña.")).not.toBeInTheDocument();
    expect(screen.getAllByText("Cumplido:")).toHaveLength(5);
    expect(screen.queryByText("Pendiente:")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("aA123456!");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute("aria-controls", password.id);
  });

  it("preserves consent gating and the registration request payload", async () => {
    const user = userEvent.setup();
    renderRegistration();
    await user.type(screen.getByLabelText("Nombre Completo"), "Carlos Fuentes");
    await user.type(screen.getByLabelText("Correo Electrónico"), "user@gmail.com");
    await user.type(screen.getByLabelText("Contraseña", { exact: true }), "Strong123!");
    const submit = screen.getByRole("button", { name: "Crear cuenta" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(fetch).toHaveBeenCalledWith("/api/auth/register-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@gmail.com", password: "Strong123!", name: "Carlos Fuentes" }),
    });
    expect(await screen.findByRole("heading", { name: "Verifica tu correo" })).toBeVisible();
  });
});
