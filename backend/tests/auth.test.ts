import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/config/env", () => ({
  config: {
    port: 4000,
    clientUrl: "http://localhost:5173",
    databaseUrl: "file:./dev.db",
    baas: { url: "https://mock.com", apiKey: "mock-key" },
    jwtAppId: "test-app",
    adminEmail: "admin@test.com",
    adminPassword: "Admin123",
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
import { baas } from "../src/services/baas";
import { prisma } from "../src/config/prisma";

const mockBaas = vi.mocked(baas);
const mockPrisma = vi.mocked(prisma);

describe("authService.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("should register a new user with valid data", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      role: "customer",
      provider: "password",
      picture: null,
      twoFactorEnabled: false,
      points: 0,
    } as never);

    const result = await authService.register(
      "test@example.com",
      "password123",
      "Test User"
    );

    expect(result.token).toBe("mock-jwt-token");
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.hasPassword).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
  });

  it("should throw INVALID_EMAIL for invalid email", async () => {
    await expect(
      authService.register("not-an-email", "password123")
    ).rejects.toThrow("INVALID_EMAIL");
  });

  it("should throw EMAIL_EXISTS for duplicate email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
    } as never);

    await expect(
      authService.register("test@example.com", "password123")
    ).rejects.toThrow("EMAIL_EXISTS");
  });

  it("should assign admin role for admin email", async () => {
    const originalEmail = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = "admin@test.com";
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "admin-1",
      email: "admin@test.com",
      name: "Admin",
      role: "admin",
      provider: "password",
      picture: null,
      twoFactorEnabled: false,
      points: 0,
    } as never);

    const result = await authService.register(
      "admin@test.com",
      "password123",
      "Admin"
    );

    expect(result.user.role).toBe("admin");
    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.role).toBe("admin");
    process.env.ADMIN_EMAIL = originalEmail;
  });
});

describe("authService.loginWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("should login with correct password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: hash,
      role: "customer",
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    const result = await authService.loginWithPassword(
      "test@example.com",
      "password123"
    );

    expect("token" in result).toBe(true);
    if ("token" in result) {
      expect(result.token).toBe("mock-jwt-token");
    }
  });

  it("should throw INVALID_CREDENTIALS for wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct-password", 12);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: hash,
      role: "customer",
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    await expect(
      authService.loginWithPassword("test@example.com", "wrong-password")
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("should throw INVALID_CREDENTIALS for user without password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: null,
      role: "customer",
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    await expect(
      authService.loginWithPassword("test@example.com", "password123")
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("should return requires2Fa when 2FA is enabled with valid totpSecret", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: hash,
      role: "customer",
      twoFactorEnabled: true,
      totpSecret: "some-secret",
    } as never);
    mockBaas.signJwt.mockResolvedValue({ token: "preauth-token" });

    const result = await authService.loginWithPassword(
      "test@example.com",
      "password123"
    );

    expect("requires2Fa" in result && result.requires2Fa).toBe(true);
  });

  it("should disable 2FA when twoFactorEnabled=true but totpSecret=null", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: hash,
      role: "customer",
      twoFactorEnabled: true,
      totpSecret: null,
    } as never);

    const result = await authService.loginWithPassword(
      "test@example.com",
      "password123"
    );

    expect("token" in result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { twoFactorEnabled: false },
    });
  });
});

describe("authService.hasPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return true when user has password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      passwordHash: "some-hash",
    } as never);

    const result = await authService.hasPassword("test@example.com");
    expect(result).toBe(true);
  });

  it("should return false when user has no password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      passwordHash: null,
    } as never);

    const result = await authService.hasPassword("test@example.com");
    expect(result).toBe(false);
  });

  it("should return false when user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.hasPassword("nonexistent@example.com");
    expect(result).toBe(false);
  });
});

describe("authService.verifyOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("should create new user and login via OTP", async () => {
    mockBaas.verifyOtp.mockResolvedValue({ valido: true, message: "ok" });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user",
      email: "new@example.com",
      name: null,
      role: "customer",
      provider: "otp",
      picture: null,
      twoFactorEnabled: false,
      points: 0,
    } as never);

    const result = await authService.verifyOtp("new@example.com", "123456");

    expect(result.token).toBe("mock-jwt-token");
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
  });

  it("should throw INVALID_OTP for wrong code", async () => {
    mockBaas.verifyOtp.mockResolvedValue({
      valido: false,
      message: "invalid",
    });

    await expect(
      authService.verifyOtp("test@example.com", "000000")
    ).rejects.toThrow("INVALID_OTP");
  });

  it("should return requires2Fa when user has 2FA enabled with valid totpSecret", async () => {
    mockBaas.verifyOtp.mockResolvedValue({ valido: true, message: "ok" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "customer",
      twoFactorEnabled: true,
      totpSecret: "some-secret",
    } as never);
    mockBaas.signJwt.mockResolvedValue({ token: "preauth-token" });

    const result = await authService.verifyOtp("test@example.com", "123456");

    expect("requires2Fa" in result && result.requires2Fa).toBe(true);
  });

  it("should disable 2FA when twoFactorEnabled=true but totpSecret=null", async () => {
    mockBaas.verifyOtp.mockResolvedValue({ valido: true, message: "ok" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "customer",
      twoFactorEnabled: true,
      totpSecret: null,
    } as never);

    const result = await authService.verifyOtp("test@example.com", "123456");

    expect("token" in result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { twoFactorEnabled: false },
    });
  });
});

describe("authService.requestRegisterOtp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should send OTP for registration", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.requestRegisterOtp(
      "new@example.com",
      "password123",
      "New User"
    );

    expect(result.message).toBe("OTP sent");
    expect(mockBaas.generateOtp).toHaveBeenCalledOnce();
  });

  it("should throw EMAIL_EXISTS if email is already taken", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "taken@example.com",
    } as never);

    await expect(
      authService.requestRegisterOtp("taken@example.com", "password123")
    ).rejects.toThrow("EMAIL_EXISTS");
  });
});

describe("authService.verifyRegisterOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("should throw NO_PENDING_REGISTRATION if no pending data", async () => {
    await expect(
      authService.verifyRegisterOtp("test@example.com", "123456")
    ).rejects.toThrow("NO_PENDING_REGISTRATION");
  });

  it("should throw INVALID_OTP for wrong code", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await authService.requestRegisterOtp("test@example.com", "password123");
    mockBaas.verifyOtp.mockResolvedValue({
      valido: false,
      message: "invalid",
    });

    await expect(
      authService.verifyRegisterOtp("test@example.com", "000000")
    ).rejects.toThrow("INVALID_OTP");
  });

  it("should create user after successful OTP verification", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await authService.requestRegisterOtp(
      "new@example.com",
      "password123",
      "New User"
    );
    mockBaas.verifyOtp.mockResolvedValue({ valido: true, message: "ok" });
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user",
      email: "new@example.com",
      name: "New User",
      role: "customer",
      provider: "password",
      picture: null,
      twoFactorEnabled: false,
      points: 0,
    } as never);

    const result = await authService.verifyRegisterOtp(
      "new@example.com",
      "123456"
    );

    expect(result.token).toBe("mock-jwt-token");
    expect(result.user.email).toBe("new@example.com");
    expect(result.user.hasPassword).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
  });
});

describe("authService.verify2Fa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBaas.signJwt.mockResolvedValue({ token: "mock-jwt-token" });
  });

  it("should verify TOTP and return session", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "customer",
      totpSecret: "some-secret",
      twoFactorEnabled: true,
    } as never);
    mockBaas.verifyTotp.mockResolvedValue({ valid: true });

    const result = await authService.verify2Fa("user-1", "123456");

    expect(result.token).toBe("mock-jwt-token");
  });

  it("should throw INVALID_TOTP for wrong code", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "customer",
      totpSecret: "some-secret",
      twoFactorEnabled: true,
    } as never);
    mockBaas.verifyTotp.mockResolvedValue({ valid: false });

    await expect(authService.verify2Fa("user-1", "000000")).rejects.toThrow(
      "INVALID_TOTP"
    );
  });

  it("should auto-disable 2FA when totpSecret is null", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "customer",
      totpSecret: null,
      twoFactorEnabled: true,
    } as never);

    const result = await authService.verify2Fa("user-1", "123456");

    expect(result.token).toBe("mock-jwt-token");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { twoFactorEnabled: false },
    });
  });
});

describe("authService.changePassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should change password with valid current password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("old-password", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: hash,
    } as never);

    const result = await authService.changePassword(
      "user-1",
      "old-password",
      "new-password-123"
    );

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledOnce();
  });

  it("should throw INVALID_CURRENT_PASSWORD for wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct-password", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: hash,
    } as never);

    await expect(
      authService.changePassword("user-1", "wrong", "new-password-123")
    ).rejects.toThrow("INVALID_CURRENT_PASSWORD");
  });

  it("should throw NO_PASSWORD_SET for user without password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: null,
    } as never);

    await expect(
      authService.changePassword("user-1", "any", "new-password-123")
    ).rejects.toThrow("NO_PASSWORD_SET");
  });

  it("should throw PASSWORD_TOO_SHORT for short password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "some-hash",
    } as never);

    await expect(
      authService.changePassword("user-1", "old", "short")
    ).rejects.toThrow("PASSWORD_TOO_SHORT");
  });
});

describe("authService.emailExists", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return true when user exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as never);

    const result = await authService.emailExists("test@example.com");
    expect(result).toBe(true);
  });

  it("should return false when user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.emailExists("nonexistent@example.com");
    expect(result).toBe(false);
  });
});

describe("authService.deleteAccount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should delete account without password for Google user (no passwordHash)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "google-user",
      email: "google@example.com",
      passwordHash: null,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    const result = await authService.deleteAccount("google-user");
    expect(result.success).toBe(true);
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: "google-user" },
    });
  });

  it("should delete account with valid password for password user", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "pw-user",
      email: "pw@example.com",
      passwordHash: hash,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    const result = await authService.deleteAccount("pw-user", "password123");
    expect(result.success).toBe(true);
  });

  it("should throw PASSWORD_REQUIRED when password user provides no password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "pw-user",
      email: "pw@example.com",
      passwordHash: hash,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    await expect(authService.deleteAccount("pw-user")).rejects.toThrow(
      "PASSWORD_REQUIRED"
    );
  });

  it("should throw USER_NOT_FOUND for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.deleteAccount("ghost")).rejects.toThrow(
      "USER_NOT_FOUND"
    );
  });
});

describe("authService.requestDeleteOtp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should send OTP for Google user without password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "google-user",
      email: "google@example.com",
      passwordHash: null,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    const result = await authService.requestDeleteOtp("google-user");
    expect(result.message).toBe("OTP sent");
    expect(mockBaas.generateOtp).toHaveBeenCalledWith("google@example.com", "Fitlook", "Fitlook");
  });

  it("should throw PASSWORD_REQUIRED when password user provides no password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "pw-user",
      email: "pw@example.com",
      passwordHash: hash,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    await expect(authService.requestDeleteOtp("pw-user")).rejects.toThrow(
      "PASSWORD_REQUIRED"
    );
  });

  it("should send OTP after valid password verification", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("password123", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "pw-user",
      email: "pw@example.com",
      passwordHash: hash,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    const result = await authService.requestDeleteOtp("pw-user", "password123");
    expect(result.message).toBe("OTP sent");
  });

  it("should throw INVALID_PASSWORD for wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correct-password", 12);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "pw-user",
      email: "pw@example.com",
      passwordHash: hash,
      twoFactorEnabled: false,
      totpSecret: null,
    } as never);

    await expect(authService.requestDeleteOtp("pw-user", "wrong")).rejects.toThrow(
      "INVALID_PASSWORD"
    );
  });
});

describe("authService.verifyDeleteOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete account after valid OTP", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as never);
    mockBaas.verifyOtp.mockResolvedValue({ valido: true, message: "ok" });

    const result = await authService.verifyDeleteOtp("user-1", "123456");
    expect(result.success).toBe(true);
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("should throw INVALID_OTP for wrong code", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as never);
    mockBaas.verifyOtp.mockResolvedValue({ valido: false, message: "invalid" });

    await expect(authService.verifyDeleteOtp("user-1", "000000")).rejects.toThrow(
      "INVALID_OTP"
    );
  });

  it("should throw USER_NOT_FOUND for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.verifyDeleteOtp("ghost", "123456")).rejects.toThrow(
      "USER_NOT_FOUND"
    );
  });
});
