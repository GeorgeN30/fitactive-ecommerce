import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import api from "../src/services/api";

describe("API authorization interceptor", () => {
  const originalAdapter = api.defaults.adapter;
  let requestAuthorization: unknown;
  let rejectWith401 = false;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    requestAuthorization = undefined;
    rejectWith401 = false;
    api.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      requestAuthorization = config.headers.get("Authorization");
      if (rejectWith401) {
        throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
          data: { error: "INVALID_CREDENTIALS" },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        });
      }
      return {
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }) as AxiosAdapter;
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    localStorage.clear();
    sessionStorage.clear();
  });

  it("preserves an explicit MFA challenge token over the stored session token", async () => {
    localStorage.setItem("token", "existing-admin-session");

    await api.post(
      "/auth/2fa/verify",
      { code: "123456" },
      { headers: { Authorization: "Bearer short-lived-mfa-challenge" } },
    );

    expect(requestAuthorization).toBe("Bearer short-lived-mfa-challenge");
  });

  it("uses the stored session token when a request has no explicit authorization", async () => {
    sessionStorage.setItem("token", "session-scoped-session");

    await api.get("/auth/me");

    expect(requestAuthorization).toBe("Bearer session-scoped-session");
  });

  it("does not send an old session token to password login or clear MFA state on a 401", async () => {
    localStorage.setItem("token", "old-session");
    sessionStorage.setItem("preAuth_token", "pending-mfa-challenge");
    sessionStorage.setItem("preAuth_user_id", "mfa-user");
    rejectWith401 = true;

    await expect(api.post("/auth/login-password", {
      email: "user@example.com",
      password: "wrong-password",
    })).rejects.toMatchObject({ response: { status: 401 } });

    expect(requestAuthorization).toBeUndefined();
    expect(localStorage.getItem("token")).toBe("old-session");
    expect(sessionStorage.getItem("preAuth_token")).toBe("pending-mfa-challenge");
    expect(sessionStorage.getItem("preAuth_user_id")).toBe("mfa-user");
  });

  it("leaves the pending MFA challenge untouched on an MFA endpoint 401", async () => {
    sessionStorage.setItem("preAuth_token", "pending-mfa-challenge");
    sessionStorage.setItem("preAuth_user_id", "mfa-user");
    rejectWith401 = true;

    await expect(api.post("/auth/2fa/verify", { code: "123456" }, {
      headers: { Authorization: "Bearer pending-mfa-challenge" },
    })).rejects.toMatchObject({ response: { status: 401 } });

    expect(requestAuthorization).toBe("Bearer pending-mfa-challenge");
    expect(sessionStorage.getItem("preAuth_token")).toBe("pending-mfa-challenge");
    expect(sessionStorage.getItem("preAuth_user_id")).toBe("mfa-user");
  });

  it("clears only the active session after its own token fails on a protected endpoint", async () => {
    localStorage.setItem("token", "expired-session");
    sessionStorage.setItem("preAuth_token", "pending-mfa-challenge");
    rejectWith401 = true;

    await expect(api.get("/auth/me")).rejects.toMatchObject({ response: { status: 401 } });

    expect(requestAuthorization).toBe("Bearer expired-session");
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("preAuth_token")).toBeNull();
  });

  it("does not clear an active session when a different explicit token fails", async () => {
    localStorage.setItem("token", "valid-session");
    rejectWith401 = true;

    await expect(api.get("/auth/me", {
      headers: { Authorization: "Bearer other-token" },
    })).rejects.toMatchObject({ response: { status: 401 } });

    expect(localStorage.getItem("token")).toBe("valid-session");
  });
});
