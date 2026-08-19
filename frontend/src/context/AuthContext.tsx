import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

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
  loginWithOtp: (email: string, code: string, name?: string) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (accessToken: string) => Promise<boolean>;
  verify2Fa: (code: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  preAuthUserId: string | null;
  clearPreAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preAuthUserId, setPreAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession(newToken: string, newUser: User) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setPreAuthUserId(null);
  }

  async function loginWithOtp(email: string, code: string, name?: string): Promise<boolean> {
    const { data } = await api.post("/auth/otp-verify", { email, code, name });
    if (data.requires2Fa) {
      localStorage.setItem("preAuth_token", data.token);
      setPreAuthUserId(data.userId);
      return true;
    }
    persistSession(data.token, data.user);
    return false;
  }

  async function loginWithPassword(email: string, password: string): Promise<boolean> {
    const { data } = await api.post("/auth/login-password", { email, password });
    if (data.requires2Fa) {
      localStorage.setItem("preAuth_token", data.token);
      setPreAuthUserId(data.userId);
      return true;
    }
    persistSession(data.token, data.user);
    return false;
  }

  async function loginWithGoogle(accessToken: string): Promise<boolean> {
    const { data } = await api.post("/auth/google", { access_token: accessToken });
    persistSession(data.token, data.user);
    return false;
  }

  async function verify2Fa(code: string) {
    const preAuthToken = localStorage.getItem("preAuth_token");
    if (!preAuthToken || !preAuthUserId) {
      throw new Error("NO_PREAUTH_SESSION");
    }

    const { data } = await api.post(
      "/auth/2fa/verify",
      { code },
      { headers: { Authorization: `Bearer ${preAuthToken}` } }
    );

    localStorage.removeItem("preAuth_token");
    persistSession(data.token, data.user);
  }

  function clearPreAuth() {
    localStorage.removeItem("preAuth_token");
    setPreAuthUserId(null);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("preAuth_token");
    setToken(null);
    setUser(null);
    setPreAuthUserId(null);
  }

  function updateUser(partial: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }

  async function refreshUser() {
    try {
      const { data } = await api.get("/auth/me");
      const freshUser = data.user as User;
      localStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
    } catch {
      // keep current state
    }
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
