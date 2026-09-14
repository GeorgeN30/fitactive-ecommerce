import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/config/env", () => ({
  config: {
    port: 4000,
    clientUrl: "http://localhost:5173",
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/fitactive",
    baas: { url: "https://mock.com", apiKey: "mock-key" },
    jwtAppId: "test-app",
    adminEmail: "admin@test.com",
    adminPassword: "Admin123",
    receptionistEmail: "receptionist@test.com",
    receptionistPassword: "Admin123",
  },
}));

vi.mock("../src/services/baas", () => ({
  baas: {
    signJwt: vi.fn().mockResolvedValue({ token: "mock-jwt-token" }),
    verifyOtp: vi.fn(),
    verifyTotp: vi.fn(),
    generateTotp: vi.fn().mockResolvedValue({
      secret: "mock-secret",
      qr_svg: "<svg>mock</svg>",
      uri: "otpauth://totp/mock",
    }),
    generateOtp: vi.fn().mockResolvedValue({ message: "OTP sent" }),
    verifyGoogleToken: vi.fn(),
  },
}));

vi.mock("../src/config/prisma", () => ({
  prisma: {
    usuarios: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { authService } from "../src/services/auth";
import { prisma } from "../src/config/prisma";

const mockPrisma = vi.mocked(prisma);

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "customer",
    provider: "password",
    picture: null,
    twoFactorEnabled: false,
    points: 0,
    passwordHash: null,
    totpSecret: null,
    ...overrides,
  } as never;
}

describe("Robustness: password boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a password shorter than 8 characters on register", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(null);
    await expect(
      authService.register("short@example.com", "short")
    ).rejects.toThrow("PASSWORD_TOO_SHORT");
    expect(mockPrisma.usuarios.create).not.toHaveBeenCalled();
  });

  it("rejects a password longer than the 72-byte bcrypt limit on register", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(null);
    const longPassword = "x".repeat(73);
    await expect(
      authService.register("long@example.com", longPassword)
    ).rejects.toThrow("PASSWORD_TOO_LONG");
    expect(mockPrisma.usuarios.create).not.toHaveBeenCalled();
  });

  it("accepts a password of exactly 72 bytes", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(null);
    mockPrisma.usuarios.create.mockResolvedValue(baseUser());
    const result = await authService.register(
      "boundary@example.com",
      "x".repeat(72)
    );
    expect(result.token).toBe("mock-jwt-token");
    expect(mockPrisma.usuarios.create).toHaveBeenCalledOnce();
  });

  it("rejects over-length passwords before hashing in requestRegisterOtp", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(null);
    await expect(
      authService.requestRegisterOtp("long@example.com", "x".repeat(73))
    ).rejects.toThrow("PASSWORD_TOO_LONG");
  });

  it("rejects over-length passwords in setPassword", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(baseUser());
    await expect(
      authService.setPassword("user-1", "x".repeat(73))
    ).rejects.toThrow("PASSWORD_TOO_LONG");
  });

  it("rejects over-length passwords in changePassword", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(
      baseUser({ passwordHash: "some-hash" })
    );
    await expect(
      authService.changePassword("user-1", "current-pw", "x".repeat(73))
    ).rejects.toThrow("PASSWORD_TOO_LONG");
  });

  it("rejects over-length passwords in resetPassword", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(baseUser());
    await expect(
      authService.resetPassword("test@example.com", "123456", "x".repeat(73))
    ).rejects.toThrow("PASSWORD_TOO_LONG");
  });
});

describe("Robustness: DB failure handling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("propagates database errors from register (create)", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue(null);
    mockPrisma.usuarios.create.mockRejectedValue(new Error("db connection lost"));
    await expect(
      authService.register("user@example.com", "password123")
    ).rejects.toThrow("db connection lost");
  });

  it("propagates database errors from loginWithPassword (findUnique)", async () => {
    mockPrisma.usuarios.findUnique.mockRejectedValue(new Error("db timeout"));
    await expect(
      authService.loginWithPassword("user@example.com", "password123")
    ).rejects.toThrow("db timeout");
  });

  it("propagates database errors from verifyOtp (create)", async () => {
    const { baas } = await import("../src/services/baas");
    vi.mocked(baas).verifyOtp.mockResolvedValue({ valido: true, message: "ok" });
    mockPrisma.usuarios.findUnique.mockResolvedValue(null);
    mockPrisma.usuarios.create.mockRejectedValue(new Error("db unavailable"));
    await expect(
      authService.verifyOtp("new@example.com", "123456")
    ).rejects.toThrow("db unavailable");
  });
});

describe("Robustness: rate limiting blocks brute force", () => {
  it("OTP request limiter blocks after the configured maximum", async () => {
    const express = (await import("express")).default;
    const { otpRequestLimiter } = await import("../src/middlewares/rateLimit");
    const app = express();
    let hits = 0;
    app.post("/test", otpRequestLimiter, (_req, res) => {
      hits += 1;
      res.json({ ok: true });
    });
    const server = app.listen(0);
    const { port } = server.address() as { port: number };
    try {
      const url = `http://127.0.0.1:${port}/test`;
      let sawSuccess = false;
      let lastStatus = 0;
      for (let i = 0; i < 8; i += 1) {
        const res = await fetch(url, { method: "POST" });
        lastStatus = res.status;
        if (res.status === 200) sawSuccess = true;
      }
      expect(sawSuccess).toBe(true);
      expect(lastStatus).toBe(429);
      const blocked = await fetch(url, { method: "POST" });
      expect(await blocked.json()).toEqual({ error: "TOO_MANY_OTP_REQUESTS" });
    } finally {
      server.close();
    }
  });

  it("auth limiter blocks password brute force after the configured maximum", async () => {
    const express = (await import("express")).default;
    const { authLimiter } = await import("../src/middlewares/rateLimit");
    const app = express();
    app.post("/login", authLimiter, (_req, res) => res.json({ ok: true }));
    const server = app.listen(0);
    const { port } = server.address() as { port: number };
    try {
      const url = `http://127.0.0.1:${port}/login`;
      let lastStatus = 0;
      for (let i = 0; i < 12; i += 1) {
        lastStatus = (await fetch(url, { method: "POST" })).status;
      }
      expect(lastStatus).toBe(429);
      const blocked = await fetch(url, { method: "POST" });
      expect(await blocked.json()).toEqual({ error: "TOO_MANY_AUTH_ATTEMPTS" });
    } finally {
      server.close();
    }
  });
});