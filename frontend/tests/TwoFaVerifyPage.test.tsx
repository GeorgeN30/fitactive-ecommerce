import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../src/context/AuthContext";
import TwoFaVerifyPage from "../src/pages/TwoFaVerifyPage";

vi.mock("../src/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../src/components/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../src/components/SuccessOverlay", () => ({
  default: ({ onDone }: { onDone: () => void }) => (
    <button type="button" onClick={onDone}>Continuar al panel</button>
  ),
}));

const verify2Fa = vi.fn();
const clearPreAuth = vi.fn();
let authState: { verify2Fa: typeof verify2Fa; clearPreAuth: typeof clearPreAuth; preAuthUserId: string | null; user: { role: string } | null };

function LoginFeedback() {
  const location = useLocation();
  return <p>{(location.state as { authError?: string } | null)?.authError}</p>;
}

function renderMfaPage() {
  return render(
    <MemoryRouter initialEntries={["/2fa-verify"]}>
      <Routes>
        <Route path="/2fa-verify" element={<TwoFaVerifyPage />} />
        <Route path="/login" element={<LoginFeedback />} />
        <Route path="/admin" element={<p>Panel admin</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TwoFaVerifyPage", () => {
  beforeEach(() => {
    verify2Fa.mockReset();
    clearPreAuth.mockReset();
    authState = {
      verify2Fa,
      clearPreAuth,
      preAuthUserId: "mfa-user",
      user: null,
    };
    vi.mocked(useAuth).mockImplementation(() => authState as never);
  });

  it("keeps the success overlay and redirects to admin after successful verification", async () => {
    verify2Fa.mockImplementation(async () => {
      authState = { ...authState, preAuthUserId: null, user: { role: "admin" } };
    });
    const user = userEvent.setup();
    renderMfaPage();

    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    await user.click(await screen.findByRole("button", { name: "Continuar al panel" }));
    expect(screen.getByText("Panel admin")).toBeVisible();
    expect(screen.queryByText(/No hay una verificación 2FA pendiente/)).not.toBeInTheDocument();
    expect(clearPreAuth).not.toHaveBeenCalled();
  });

  it("keeps the form open and explains a rejected authenticator code", async () => {
    verify2Fa.mockRejectedValue({ response: { status: 400, data: { error: "INVALID_TOTP" } } });
    const user = userEvent.setup();
    renderMfaPage();

    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByText(/El código es inválido o expiró/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Verificación de doble factor" })).toBeVisible();
    expect(clearPreAuth).not.toHaveBeenCalled();
  });

  it("explains an invalid MFA challenge before returning to login", async () => {
    verify2Fa.mockRejectedValue({ response: { status: 401, data: { error: "MFA_REQUIRED" } } });
    const user = userEvent.setup();
    renderMfaPage();

    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByText(/El token enviado no corresponde a una verificación 2FA/)).toBeVisible();
    expect(clearPreAuth).toHaveBeenCalledOnce();
  });
});
