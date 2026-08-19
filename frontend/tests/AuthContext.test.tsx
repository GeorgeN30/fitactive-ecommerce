import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from "../src/services/api";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

const mockApi = vi.mocked(api);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts with loading=false and no user (initial render completes useEffect)", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("restores session from localStorage", async () => {
    const fakeUser = {
      id: "u1",
      email: "test@example.com",
      name: "Test",
      role: "customer",
      picture: null,
    };
    localStorage.setItem("token", "stored-token");
    localStorage.setItem("user", JSON.stringify(fakeUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.token).toBe("stored-token");
  });

  it("loginWithPassword persists session on success", async () => {
    const fakeUser = {
      id: "u1",
      email: "test@example.com",
      name: "Test",
      role: "customer",
      picture: null,
      twoFactorEnabled: false,
      points: 0,
      hasPassword: true,
    };
    mockApi.post.mockResolvedValueOnce({
      data: { token: "new-token", user: fakeUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let requires2Fa: boolean;
    await act(async () => {
      requires2Fa = await result.current.loginWithPassword(
        "test@example.com",
        "password123"
      );
    });

    expect(requires2Fa!).toBe(false);
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.token).toBe("new-token");
    expect(localStorage.getItem("token")).toBe("new-token");
  });

  it("loginWithPassword returns true when requires2Fa", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        requires2Fa: true,
        userId: "u1",
        token: "preauth-token",
        user: { id: "u1", email: "test@example.com" },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let requires2Fa: boolean;
    await act(async () => {
      requires2Fa = await result.current.loginWithPassword(
        "test@example.com",
        "password123"
      );
    });

    expect(requires2Fa!).toBe(true);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("preAuth_token")).toBe("preauth-token");
    expect(result.current.preAuthUserId).toBe("u1");
  });

  it("loginWithOtp persists session on success", async () => {
    const fakeUser = {
      id: "u1",
      email: "test@example.com",
      name: null,
      role: "customer",
      picture: null,
      twoFactorEnabled: false,
      points: 0,
      hasPassword: false,
    };
    mockApi.post.mockResolvedValueOnce({
      data: { token: "otp-token", user: fakeUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let requires2Fa: boolean;
    await act(async () => {
      requires2Fa = await result.current.loginWithOtp(
        "test@example.com",
        "123456"
      );
    });

    expect(requires2Fa!).toBe(false);
    expect(result.current.token).toBe("otp-token");
  });

  it("logout clears all storage and state", async () => {
    localStorage.setItem("token", "some-token");
    localStorage.setItem("user", JSON.stringify({ id: "u1" }));
    localStorage.setItem("preAuth_token", "preauth");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("preAuth_token")).toBeNull();
  });

  it("clearPreAuth removes preauth data", async () => {
    localStorage.setItem("preAuth_token", "preauth");
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.clearPreAuth();
    });

    expect(localStorage.getItem("preAuth_token")).toBeNull();
    expect(result.current.preAuthUserId).toBeNull();
  });

  it("isAdmin returns true for admin role", async () => {
    const fakeUser = {
      id: "u1",
      email: "admin@test.com",
      name: "Admin",
      role: "admin",
      picture: null,
    };
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify(fakeUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it("isAdmin returns false for customer role", async () => {
    const fakeUser = {
      id: "u1",
      email: "user@test.com",
      name: "User",
      role: "customer",
      picture: null,
    };
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify(fakeUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it("updateUser merges partial user data", async () => {
    const fakeUser = {
      id: "u1",
      email: "test@example.com",
      name: "Old Name",
      role: "customer",
      picture: null,
    };
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify(fakeUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateUser({ name: "New Name" });
    });

    expect(result.current.user?.name).toBe("New Name");
    expect(result.current.user?.email).toBe("test@example.com");
  });
});
