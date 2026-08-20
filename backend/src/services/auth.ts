import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { baas } from "./baas";
import { config } from "../config/env";
import { ROLES } from "../constants";

const APP_NAME = "Fitlook";

const pendingNames = new Map<string, { name: string; expiresAt: number }>();
const PENDING_NAMES_TTL = 10 * 60 * 1000;

interface PendingRegistration {
  email: string;
  passwordHash: string;
  name: string | null;
  expiresAt: number;
}

const pendingRegistrations = new Map<string, PendingRegistration>();
const PENDING_REG_TTL = 10 * 60 * 1000;

function setPendingName(email: string, name: string) {
  pendingNames.set(email, { name, expiresAt: Date.now() + PENDING_NAMES_TTL });
}

function getPendingName(email: string): string | null {
  const entry = pendingNames.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pendingNames.delete(email);
    return null;
  }
  pendingNames.delete(email);
  return entry.name;
}

function setPendingRegistration(email: string, passwordHash: string, name: string | null) {
  pendingRegistrations.set(email, {
    email,
    passwordHash,
    name,
    expiresAt: Date.now() + PENDING_REG_TTL,
  });
}

function getPendingRegistration(email: string): PendingRegistration | null {
  const entry = pendingRegistrations.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pendingRegistrations.delete(email);
    return null;
  }
  pendingRegistrations.delete(email);
  return entry;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resolveRole(email: string): string {
  if (config.adminEmail && email === config.adminEmail.toLowerCase()) {
    return ROLES.ADMIN;
  }
  return ROLES.CUSTOMER;
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  picture: string | null;
  twoFactorEnabled: boolean;
  points: number;
  provider: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    picture: user.picture,
    twoFactorEnabled: user.twoFactorEnabled,
    points: user.points,
    hasPassword: false,
    isNewUser: false,
  };
}

export const authService = {
  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<{ token: string; user: ReturnType<typeof sanitizeUser> }> {
    if (!isValidEmail(email)) {
      throw new Error("INVALID_EMAIL");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const role = resolveRole(email);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role,
        provider: "password",
        passwordHash,
      },
    });

    const jwtResult = await baas.signJwt(user.id, { role: user.role });

    return {
      token: jwtResult.token,
      user: { ...sanitizeUser(user), hasPassword: true },
    };
  },

  async requestRegisterOtp(
    email: string,
    password: string,
    name?: string
  ): Promise<{ message: string }> {
    if (!isValidEmail(email)) {
      throw new Error("INVALID_EMAIL");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    setPendingRegistration(email, passwordHash, name || null);

    return baas.generateOtp(email, APP_NAME, APP_NAME);
  },

  async verifyRegisterOtp(
    email: string,
    code: string
  ): Promise<{ token: string; user: ReturnType<typeof sanitizeUser> }> {
    const pending = getPendingRegistration(email);
    if (!pending) {
      throw new Error("NO_PENDING_REGISTRATION");
    }

    const result = await baas.verifyOtp(email, code);
    if (!result.valido) {
      throw new Error("INVALID_OTP");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("EMAIL_EXISTS");
    }

    const role = resolveRole(email);

    const user = await prisma.user.create({
      data: {
        email,
        name: pending.name,
        role,
        provider: "password",
        passwordHash: pending.passwordHash,
      },
    });

    const jwtResult = await baas.signJwt(user.id, { role: user.role });

    return {
      token: jwtResult.token,
      user: { ...sanitizeUser(user), hasPassword: true },
    };
  },

  async loginWithPassword(
    email: string,
    password: string
  ): Promise<
    | { token: string; user: ReturnType<typeof sanitizeUser> }
    | { requires2Fa: true; userId: string; token: string; user: ReturnType<typeof sanitizeUser> }
  > {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const resolvedRole = resolveRole(email);
    if (user.role !== resolvedRole) {
      await prisma.user.update({ where: { id: user.id }, data: { role: resolvedRole } });
      user.role = resolvedRole;
    }

    if (user.twoFactorEnabled) {
      if (!user.totpSecret) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: false },
        });
        user.twoFactorEnabled = false;
      } else {
        const preAuthToken = await baas.signJwt(user.id, { purpose: "mfa_pending" }, 300);
        return {
          requires2Fa: true,
          userId: user.id,
          token: preAuthToken.token,
          user: sanitizeUser(user),
        };
      }
    }

    const jwtResult = await baas.signJwt(user.id, { role: user.role });

    return {
      token: jwtResult.token,
      user: sanitizeUser(user),
    };
  },

  async hasPassword(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });
    return !!user?.passwordHash;
  },

  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  },

  async requestOtp(email: string, name?: string): Promise<{ message: string }> {
    if (!isValidEmail(email)) {
      throw new Error("INVALID_EMAIL");
    }
    if (name) {
      setPendingName(email, name);
    }
    return baas.generateOtp(email, APP_NAME, APP_NAME);
  },

  async verifyOtp(
    email: string,
    code: string,
    name?: string
  ): Promise<{ token: string; user: ReturnType<typeof sanitizeUser>; requires2Fa?: boolean; userId?: string }> {
    const result = await baas.verifyOtp(email, code);
    if (!result.valido) {
      throw new Error("INVALID_OTP");
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const resolvedName = name || getPendingName(email) || null;
      const role = resolveRole(email);
      user = await prisma.user.create({
        data: {
          email,
          name: resolvedName,
          role,
          provider: "otp",
        },
      });
    } else {
      const resolvedRole = resolveRole(email);
      if (user.role !== resolvedRole) {
        await prisma.user.update({ where: { id: user.id }, data: { role: resolvedRole } });
        user.role = resolvedRole;
      }
    }

    if (user.twoFactorEnabled) {
      if (!user.totpSecret) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: false },
        });
        user.twoFactorEnabled = false;
      } else {
        const preAuthToken = await baas.signJwt(user.id, { purpose: "mfa_pending" }, 300);
        return {
          token: preAuthToken.token,
          user: sanitizeUser(user),
          requires2Fa: true,
          userId: user.id,
        };
      }
    }

    const jwtResult = await baas.signJwt(user.id, { role: user.role });

    return {
      token: jwtResult.token,
      user: sanitizeUser(user),
    };
  },

  async googleAuth(
    accessToken: string
  ): Promise<{ token: string; user: ReturnType<typeof sanitizeUser> }> {
    const googleProfile = await baas.verifyGoogleToken(accessToken);

    let user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
    });

    const resolvedRole = resolveRole(googleProfile.email);
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          picture: googleProfile.picture,
          role: resolvedRole,
          provider: "google",
          providerId: googleProfile.provider_id,
        },
      });
    } else {
      const updates: { name: string; picture: string; providerId: string; role?: string } = {
        name: googleProfile.name,
        picture: googleProfile.picture,
        providerId: googleProfile.provider_id,
      };
      if (user.role !== resolvedRole) {
        updates.role = resolvedRole;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }

    const jwtResult = await baas.signJwt(user.id, { role: user.role });

    return {
      token: jwtResult.token,
      user: {
        ...sanitizeUser(user),
        hasPassword: !!user.passwordHash,
        isNewUser,
      },
    };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!isValidEmail(email)) {
      throw new Error("INVALID_EMAIL");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return { message: "Si el correo existe, recibiras un codigo." };
    }

    return baas.generateOtp(email, APP_NAME, APP_NAME);
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    if (!isValidEmail(email)) {
      throw new Error("INVALID_EMAIL");
    }
    if (newPassword.length < 8) {
      throw new Error("PASSWORD_TOO_SHORT");
    }

    const result = await baas.verifyOtp(email, code);
    if (!result.valido) {
      throw new Error("INVALID_OTP");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  },

  async setPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    if (newPassword.length < 8) {
      throw new Error("PASSWORD_TOO_SHORT");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    if (newPassword.length < 8) {
      throw new Error("PASSWORD_TOO_SHORT");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new Error("NO_PASSWORD_SET");
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error("INVALID_CURRENT_PASSWORD");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  },

  async deleteAccount(
    userId: string,
    password: string,
    totpCode?: string
  ): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.passwordHash) {
      if (!password) {
        throw new Error("PASSWORD_REQUIRED");
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new Error("INVALID_PASSWORD");
      }
    }

    if (user.twoFactorEnabled) {
      if (!totpCode) {
        throw new Error("TOTP_REQUIRED");
      }
      if (!user.totpSecret) {
        throw new Error("TOTP_NOT_SETUP");
      }
      const result = await baas.verifyTotp(user.totpSecret, totpCode);
      if (!result.valid) {
        throw new Error("INVALID_TOTP");
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
  },

  async requestDeleteOtp(
    userId: string,
    password: string,
    totpCode?: string
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.passwordHash) {
      if (!password) {
        throw new Error("PASSWORD_REQUIRED");
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new Error("INVALID_PASSWORD");
      }
    }

    if (user.twoFactorEnabled) {
      if (!totpCode) {
        throw new Error("TOTP_REQUIRED");
      }
      if (!user.totpSecret) {
        throw new Error("TOTP_NOT_SETUP");
      }
      const result = await baas.verifyTotp(user.totpSecret, totpCode);
      if (!result.valid) {
        throw new Error("INVALID_TOTP");
      }
    }

    return baas.generateOtp(user.email, APP_NAME, APP_NAME);
  },

  async verifyDeleteOtp(
    userId: string,
    deleteCode: string
  ): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const result = await baas.verifyOtp(user.email, deleteCode);
    if (!result.valido) {
      throw new Error("INVALID_OTP");
    }

    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
  },

  async setup2Fa(
    userId: string
  ): Promise<{ secret: string; qrSvg: string; uri: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const result = await baas.generateTotp(APP_NAME, user.email);

    await prisma.user.update({
      where: { id: userId },
      data: { totpSecret: result.secret },
    });

    return {
      secret: result.secret,
      qrSvg: result.qr_svg,
      uri: result.uri,
    };
  },

  async enable2Fa(
    userId: string,
    code: string
  ): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new Error("TOTP_NOT_SETUP");
    }

    const result = await baas.verifyTotp(user.totpSecret, code);
    if (!result.valid) {
      throw new Error("INVALID_TOTP");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { success: true };
  },

  async verify2Fa(
    userId: string,
    code: string
  ): Promise<{ token: string; user: ReturnType<typeof sanitizeUser> }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("TOTP_NOT_SETUP");
    }

    if (!user.totpSecret) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
      });
      const jwtResult = await baas.signJwt(user.id, { role: user.role });
      return {
        token: jwtResult.token,
        user: sanitizeUser({ ...user, twoFactorEnabled: false }),
      };
    }

    const result = await baas.verifyTotp(user.totpSecret, code);
    if (!result.valid) {
      throw new Error("INVALID_TOTP");
    }

    const jwtResult = await baas.signJwt(user.id, { role: user.role });

    return {
      token: jwtResult.token,
      user: sanitizeUser(user),
    };
  },

  async disable2Fa(
    userId: string,
    code: string
  ): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new Error("TOTP_NOT_SETUP");
    }

    const result = await baas.verifyTotp(user.totpSecret, code);
    if (!result.valid) {
      throw new Error("INVALID_TOTP");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, totpSecret: null },
    });

    return { success: true };
  },

  async verifyToken(
    token: string
  ): Promise<{ valid: boolean; claims: Record<string, unknown> }> {
    return baas.verifyJwt(token);
  },
};
