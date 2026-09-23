import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GoogleCallbackPage from "../src/pages/GoogleCallbackPage";

const { loginWithGoogle, navigate } = vi.hoisted(() => ({
  loginWithGoogle: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ loginWithGoogle }),
}));

vi.mock("../src/components/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigate };
});

describe("GoogleCallbackPage", () => {
  beforeEach(() => {
    window.location.hash = "#access_token=google-token";
    loginWithGoogle.mockReset();
    navigate.mockReset();
    loginWithGoogle.mockResolvedValue({
      requires2Fa: false,
      isNewUser: true,
      hasPassword: false,
    });
  });

  it("lets Google users enter the app without forcing a password", async () => {
    render(
      <MemoryRouter>
        <GoogleCallbackPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/", { replace: true });
    });
    expect(navigate).not.toHaveBeenCalledWith(
      "/set-password?firstTime=true",
      expect.anything(),
    );
  });
});
