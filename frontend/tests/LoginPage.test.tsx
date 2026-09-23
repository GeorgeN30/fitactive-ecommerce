import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../src/pages/LoginPage";

const { loginWithPassword } = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
}));

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ loginWithPassword, user: null }),
}));

vi.mock("../src/services/api", () => ({
  default: { post: vi.fn() },
}));

vi.mock("../src/components/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/components/SuccessOverlay", () => ({
  default: () => null,
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    loginWithPassword.mockReset();
    loginWithPassword.mockResolvedValue(false);
  });

  it("shows email and password together on the first screen", () => {
    renderLogin();

    expect(screen.getByPlaceholderText("tu@email.com")).toBeVisible();
    expect(screen.getByPlaceholderText("Tu contrasena")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Continuar" })).toBeNull();
  });

  it("submits both credentials directly", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("tu@email.com"), " User@Example.com ");
    await user.type(screen.getByPlaceholderText("Tu contrasena"), "secret");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith("user@example.com", "secret", true);
    });
  });

  it("allows disabling persistent login", async () => {
    const user = userEvent.setup();
    renderLogin();

    const rememberMe = screen.getByRole("checkbox", { name: "Recordarme" });
    expect(rememberMe).toBeChecked();
    await user.click(rememberMe);
    await user.type(screen.getByPlaceholderText("tu@email.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Tu contrasena"), "secret");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith("user@example.com", "secret", false);
    });
  });
});
