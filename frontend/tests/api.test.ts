import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import api from "../src/services/api";

describe("API authorization interceptor", () => {
  const originalAdapter = api.defaults.adapter;
  let requestAuthorization: unknown;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    requestAuthorization = undefined;
    api.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      requestAuthorization = config.headers.get("Authorization");
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
});
