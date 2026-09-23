import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import {
  clearStoredSession,
  getStoredSessionValue,
  persistPreAuthToken,
  persistSession,
  updateStoredUser,
} from "../utils/session";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  picture: string | null;
  twoFactorEnabled?: boolean;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithOtp: (
    email: string,
    code: string,
    name?: string,
    rememberMe?: boolean,
  ) => Promise<boolean>;
  loginWithPassword: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<boolean>;
  loginWithGoogle: (accessToken: string, rememberMe?: boolean) => Promise<{
    requires2Fa: boolean;
    isNewUser: boolean;
    hasPassword: boolean;
  }>;
  verify2Fa: (code: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  preAuthUserId: string | null;
  clearPreAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeRole(role: string): string {
  return role === "receptionist" ? "inventory" : role;
}

function normalizeUser(sessionUser: User): User {
  const role = normalizeRole(sessionUser.role);
  return role === sessionUser.role ? sessionUser : { ...sessionUser, role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preAuthUserId, setPreAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = getStoredSessionValue("token");
    const storedUser = getStoredSessionValue("user");
    if (storedToken && storedUser) {
      try {
        const parsed: unknown = JSON.parse(storedUser);
        if (!parsed || typeof parsed !== "object" ||
          typeof (parsed as User).id !== "string" ||
          typeof (parsed as User).email !== "string" ||
          typeof (parsed as User).role !== "string") {
          throw new Error("INVALID_STORED_USER");
        }
        const storedSessionUser = normalizeUser(parsed as User);
        setToken(storedToken);
        setUser(storedSessionUser);
        updateStoredUser(storedSessionUser);
      } catch {
        clearStoredSession();
      }
    }
    setLoading(false);
  }, []);

  function saveSession(
    newToken: string,
    newUser: User,
    rememberMe = true,
  ) {
    const normalizedUser = normalizeUser(newUser);
    persistSession(newToken, normalizedUser, rememberMe);
    setToken(newToken);
    setUser(normalizedUser);
    setPreAuthUserId(null);
  }

  async function loginWithOtp(
    email: string,
    code: string,
    name?: string,
    rememberMe = true,
  ): Promise<boolean> {
    const { data } = await api.post("/auth/otp-verify", { email, code, name });
    if (data.requires2Fa) {
      persistPreAuthToken(data.token, rememberMe);
      setPreAuthUserId(data.userId);
      return true;
    }
    saveSession(data.token, data.user, rememberMe);
    return false;
  }

  async function loginWithPassword(
    email: string,
    password: string,
    rememberMe = true,
  ): Promise<boolean> {
    const { data } = await api.post("/auth/login-password", {
      email,
      password,
    });
    if (data.requires2Fa) {
      persistPreAuthToken(data.token, rememberMe);
      setPreAuthUserId(data.userId);
      return true;
    }
    saveSession(data.token, data.user, rememberMe);
    return false;
  }

  async function loginWithGoogle(
    accessToken: string,
    rememberMe = true,
  ): Promise<{
    requires2Fa: boolean;
    isNewUser: boolean;
    hasPassword: boolean;
  }> {
    const { data } = await api.post("/auth/google", {
      access_token: accessToken,
    });
    saveSession(data.token, data.user, rememberMe);
    return {
      requires2Fa: false,
      isNewUser: data.user.isNewUser ?? false,
      hasPassword: data.user.hasPassword ?? false,
    };
  }

  async function verify2Fa(code: string) {
    const preAuthToken = getStoredSessionValue("preAuth_token");
    const rememberMe = Boolean(localStorage.getItem("preAuth_token"));
    if (!preAuthToken || !preAuthUserId) {
      throw new Error("NO_PREAUTH_SESSION");
    }

    const { data } = await api.post(
      "/auth/2fa/verify",
      { code },
      { headers: { Authorization: `Bearer ${preAuthToken}` } },
    );

    localStorage.removeItem("preAuth_token");
    sessionStorage.removeItem("preAuth_token");
    saveSession(data.token, data.user, rememberMe);
  }

  function clearPreAuth() {
    localStorage.removeItem("preAuth_token");
    sessionStorage.removeItem("preAuth_token");
    setPreAuthUserId(null);
  }

  function logout() {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setPreAuthUserId(null);
  }

  function updateUser(partial: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      updateStoredUser(updated);
      return updated;
    });
  }

  async function refreshUser() {
    try {
      const { data } = await api.get("/auth/me");
      const freshUser = normalizeUser(data.user as User);
      updateStoredUser(freshUser);
      setUser(freshUser);
    } catch {}
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithOtp,
        loginWithPassword,
        loginWithGoogle,
        verify2Fa,
        updateUser,
        refreshUser,
        logout,
        isAdmin,
        preAuthUserId,
        clearPreAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
