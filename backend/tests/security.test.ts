import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/config/env", () => ({
  config: {
    port: 4000,
    clientUrl: "http://localhost:5173",
    databaseUrl: "file:./dev.db",
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
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { authService } from "../src/services/auth";
import { prisma } from "../src/config/prisma";
import { baas } from "../src/services/baas";

const mockPrisma = vi.mocked(prisma);
const mockBaas = vi.mocked(baas);

const SQL_INJECTION_EMAILS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR 1=1 --",
  "\"; DROP TABLE users;--",
  "' UNION SELECT * FROM users --",
  "admin'--",
  "x@example.com' OR '1'='1",
  "x@example.com; DROP TABLE users;--",
];

const MALFORMED_EMAILS = [
  "not-an-email",
  "foo@",
  "@bar.com",
  "foo bar@example.com",
  "foo@example",
  "foo@.com",
  "",
  "   ",
  "@",
  "a@@b.com",
];

function expectPrismaLiteralEmail(method: "findUnique" | "create", value: string) {
  const calls = mockPrisma.user[method as "findUnique"].mock.calls;
  const arg = calls[0]?.[0] as { where?: { email?: string }; data?: { email?: string } };
  const passed =
    method === "findUnique"
      ? arg?.where?.email
      : (arg as { data?: { email?: string } })?.data?.email;
  // Prisma uses parameterized queries; the raw value must be passed verbatim and
  // never concatenated into a SQL string. This asserts the value is treated as a literal.
  expect(passed).toBe(value);
}

describe("Security: SQL injection protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it.each(SQL_INJECTION_EMAILS)(
    "rejects SQL injection attempts in register email: %s",
    async (payload) => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        authService.register(payload, "password123")
      ).rejects.toThrow("INVALID_EMAIL");
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    }
  );

  it.each(SQL_INJECTION_EMAILS)(
    "rejects SQL injection attempts in requestRegisterOtp email: %s",
    async (payload) => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        authService.requestRegisterOtp(payload, "password123")
      ).rejects.toThrow("INVALID_EMAIL");
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    }
  );

  it.each(SQL_INJECTION_EMAILS)(
    "rejects SQL injection in forgotPassword email: %s",
    async (payload) => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        authService.forgotPassword(payload)
      ).rejects.toThrow("INVALID_EMAIL");
    }
  );

  it.each(SQL_INJECTION_EMAILS)(
    "rejects SQL injection in resetPassword email: %s",
    async (payload) => {
      await expect(
        authService.resetPassword(payload, "123456", "newpassword123")
      ).rejects.toThrow("INVALID_EMAIL");
    }
  );

  it.each(SQL_INJECTION_EMAILS)(
    "rejects SQL injection in requestOtp email: %s",
    async (payload) => {
      await expect(authService.requestOtp(payload)).rejects.toThrow(
        "INVALID_EMAIL"
      );
    }
  );
});

describe("Security: SQL injection does not alter DB queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("passes SQL injection payload as a literal value to loginWithPassword", async () => {
    // loginWithPassword does not validate email format, but must not build raw SQL.
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.loginWithPassword("' OR '1'='1", "password123")
    ).rejects.toThrow("INVALID_CREDENTIALS");
    expectPrismaLiteralEmail("findUnique", "' OR '1'='1");
  });

  it("passes SQL injection payload as a literal value to emailExists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await authService.emailExists("\"; DROP TABLE users;--");
    expectPrismaLiteralEmail("findUnique", "\"; DROP TABLE users;--");
  });
});

describe("Security: malformed emails are rejected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it.each([...MALFORMED_EMAILS, ...SQL_INJECTION_EMAILS])(
    "rejects register with malformed email: %j",
    async (payload) => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        authService.register(payload, "password123", "Test")
      ).rejects.toThrow("INVALID_EMAIL");
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    }
  );
});

describe("Security: fake / invalid data is rejected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("rejects register with malformed email even when other fields are valid", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.register("user@ example.com", "password123", "Fake")
    ).rejects.toThrow("INVALID_EMAIL");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("does not create users for fake emails with non-alphanumeric injection", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    for (const payload of ["a@b..c", "..@x.com", "a..b@c.com", "user@-x.com"]) {
      await expect(
        authService.register(payload, "password123")
      ).rejects.toThrow("INVALID_EMAIL");
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    }
  });

  it("rejects resetPassword with too-short new password", async () => {
    await expect(
      authService.resetPassword("user@example.com", "123456", "short")
    ).rejects.toThrow("PASSWORD_TOO_SHORT");
  });

  it("rejects changePassword with too-short new password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "some-hash",
    } as never);
    await expect(
      authService.changePassword("u1", "anything", "short")
    ).rejects.toThrow("PASSWORD_TOO_SHORT");
  });

  it("rejects setPassword with too-short password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
    } as never);
    await expect(authService.setPassword("u1", "short")).rejects.toThrow(
      "PASSWORD_TOO_SHORT"
    );
  });

  it("does not reveal whether a user exists via OTP name retention", async () => {
    // requestOtp with a name for a non-existent user still sends generic OTP
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBaas.generateOtp.mockResolvedValue({ message: "OTP sent" });
    const result = await authService.requestOtp("nonexistent@example.com", "Attacker");
    expect(result.message).toBe("OTP sent");
  });
});

describe("Security: missing required fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("rejects register with missing email (empty/whitespace)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.register("   ", "password123")
    ).rejects.toThrow("INVALID_EMAIL");
    await expect(authService.register("", "password123")).rejects.toThrow(
      "INVALID_EMAIL"
    );
  });

  it("rejects requestRegisterOtp with missing email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.requestRegisterOtp("", "password123")
    ).rejects.toThrow("INVALID_EMAIL");
  });
});
