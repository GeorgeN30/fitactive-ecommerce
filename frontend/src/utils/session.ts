export const SESSION_CLEARED_EVENT = "fitlook:session-cleared";

const SESSION_KEYS = ["token", "user", "preAuth_token"] as const;

export type SessionPersistence = "local" | "session";

export function getStoredSessionValue(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function getSessionPersistence(): SessionPersistence | null {
  if (localStorage.getItem("token")) return "local";
  if (sessionStorage.getItem("token")) return "session";
  return null;
}

export function getSessionScopedValue(key: string): string | null {
  const persistence = getSessionPersistence();
  if (!persistence) return null;
  const storage = persistence === "local" ? localStorage : sessionStorage;
  return storage.getItem(key);
}

export function persistSession(
  token: string,
  user: unknown,
  rememberMe: boolean,
): void {
  const primaryStorage = rememberMe ? localStorage : sessionStorage;
  const secondaryStorage = rememberMe ? sessionStorage : localStorage;

  primaryStorage.setItem("token", token);
  primaryStorage.setItem("user", JSON.stringify(user));
  secondaryStorage.removeItem("token");
  secondaryStorage.removeItem("user");
}

export function persistPreAuthToken(token: string, rememberMe: boolean): void {
  const primaryStorage = rememberMe ? localStorage : sessionStorage;
  const secondaryStorage = rememberMe ? sessionStorage : localStorage;

  primaryStorage.setItem("preAuth_token", token);
  secondaryStorage.removeItem("preAuth_token");
}

export function updateStoredUser(user: unknown): void {
  const persistence = getSessionPersistence();
  if (!persistence) return;
  const storage = persistence === "local" ? localStorage : sessionStorage;
  storage.setItem("user", JSON.stringify(user));
}

export function clearStoredSession(): void {
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  localStorage.removeItem("favorites");
  sessionStorage.removeItem("favorites");
  localStorage.removeItem("fitactive-cart");
  sessionStorage.removeItem("fitactive-cart");
  window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
}
