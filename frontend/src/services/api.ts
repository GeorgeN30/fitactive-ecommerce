import axios from "axios";
import { clearStoredSession, getStoredSessionValue } from "../utils/session";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication entry points must not inherit an unrelated active session.
// In particular, /auth/2fa/verify supplies its own short-lived bearer token.
const AUTH_ENTRY_PATHS = new Set([
  "/auth/login-password",
  "/auth/otp-request",
  "/auth/otp-verify",
  "/auth/google",
  "/auth/2fa/verify",
]);

function isAuthEntryRequest(url?: string): boolean {
  return AUTH_ENTRY_PATHS.has((url ?? "").split("?")[0]);
}

api.interceptors.request.use((config) => {
  const explicitAuthorization = config.headers.get("Authorization");
  if (explicitAuthorization) {
    return config;
  }

  if (isAuthEntryRequest(config.url)) {
    return config;
  }

  const token = getStoredSessionValue("token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const activeToken = getStoredSessionValue("token");
    const requestToken = axios.AxiosHeaders.from(error.config?.headers)
      .get("Authorization");
    if (
      error.response?.status === 401 &&
      !isAuthEntryRequest(error.config?.url) &&
      activeToken &&
      requestToken === `Bearer ${activeToken}`
    ) {
      clearStoredSession();
    }
    return Promise.reject(error);
  },
);

export default api;
