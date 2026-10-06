import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../src/context/AuthContext";
import api from "../src/services/api";
import SettingsPage from "../src/pages/SettingsPage";

vi.mock("../src/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../src/services/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../src/components/ProfileLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const updateUser = vi.fn();

describe("SettingsPage 2FA security settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1", email: "user@example.com", twoFactorEnabled: true },
      updateUser,
      logout: vi.fn(),
    } as never);
    vi.mocked(api.get).mockResolvedValue({
      data: { user: { hasPassword: true } },
    } as never);
  });

  function renderPage() {
    return render(<MemoryRouter><SettingsPage /></MemoryRouter>);
  }

  it("removes 2FA only after the current six-digit code succeeds", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } } as never);
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Desactivar 2FA" }));
    await user.type(screen.getByRole("textbox", { name: "Código TOTP actual" }), "12a3456");
    await user.click(screen.getByRole("button", { name: "Confirmar desactivación" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/2fa/disable", { code: "123456" });
      expect(updateUser).toHaveBeenCalledWith({ twoFactorEnabled: false });
    });
    expect(screen.getByRole("status")).toHaveTextContent("2FA desactivado");
  });

  it("preserves 2FA and displays an error when the code is rejected", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 400, data: { error: "INVALID_TOTP" } },
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Desactivar 2FA" }));
    await user.type(screen.getByRole("textbox", { name: "Código TOTP actual" }), "000000");
    await user.click(screen.getByRole("button", { name: "Confirmar desactivación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El código TOTP es incorrecto");
    expect(updateUser).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Código TOTP actual" })).toBeVisible();
    expect(screen.getByText("2FA activo")).toBeVisible();
  });
});
