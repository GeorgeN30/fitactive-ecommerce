import { Request, Response } from "express";
import { authService } from "../services/auth";
import { HTTP_STATUS, ROLES } from "../constants";
import { AuthRequest } from "../middlewares/auth";
import { Prisma } from "@prisma/client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidMeasurement(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export const authController = {
  // POST /api/auth/register-request
  async requestRegisterOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "EMAIL_AND_PASSWORD_REQUIRED" });
        return;
      }
      if (password.length < 8) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      const result = await authService.requestRegisterOtp(
        email.trim().toLowerCase(),
        password,
        name
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "REGISTER_REQUEST_FAILED";

      if (message === "INVALID_EMAIL") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_EMAIL" });
        return;
      }
      if (message === "EMAIL_EXISTS") {
        res.status(HTTP_STATUS.CONFLICT).json({ error: "EMAIL_EXISTS" });
        return;
      }

      console.error("Register request error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "REGISTER_REQUEST_FAILED" });
    }
  },

  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, code } = req.body;
      if (!email || !password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "EMAIL_AND_PASSWORD_REQUIRED" });
        return;
      }
      if (password.length < 8) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      if (code) {
        const result = await authService.verifyRegisterOtp(
          email.trim().toLowerCase(),
          code.trim()
        );
        res.status(HTTP_STATUS.CREATED).json(result);
        return;
      }

      const result = await authService.register(
        email.trim().toLowerCase(),
        password,
        name
      );
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "REGISTER_FAILED";

      if (message === "INVALID_EMAIL") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_EMAIL" });
        return;
      }
      if (message === "EMAIL_EXISTS") {
        res.status(HTTP_STATUS.CONFLICT).json({ error: "EMAIL_EXISTS" });
        return;
      }
      if (message === "NO_PENDING_REGISTRATION") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "NO_PENDING_REGISTRATION" });
        return;
      }
      if (message === "INVALID_OTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_OTP" });
        return;
      }

      console.error("Register error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "REGISTER_FAILED" });
    }
  },

  // POST /api/auth/login-password
  async loginWithPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "EMAIL_AND_PASSWORD_REQUIRED" });
        return;
      }

      const result = await authService.loginWithPassword(
        email.trim().toLowerCase(),
        password
      );

      if ("requires2Fa" in result && result.requires2Fa) {
        res.status(HTTP_STATUS.OK).json(result);
        return;
      }

      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "LOGIN_FAILED";

      if (message === "INVALID_CREDENTIALS") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "INVALID_CREDENTIALS" });
        return;
      }
      if (message === "ACCOUNT_BLOCKED") {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: "ACCOUNT_BLOCKED" });
        return;
      }

      console.error("Login error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "LOGIN_FAILED" });
    }
  },

  // GET /api/auth/check-password?email=...
  async checkPassword(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;
      if (!email) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "EMAIL_REQUIRED" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const [hasPassword, exists] = await Promise.all([
        authService.hasPassword(normalizedEmail),
        authService.emailExists(normalizedEmail),
      ]);
      res.status(HTTP_STATUS.OK).json({ hasPassword, exists });
    } catch (err) {
      console.error("Check password error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "CHECK_FAILED" });
    }
  },

  // POST /api/auth/otp-request
  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, name } = req.body;
      if (!email || typeof email !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "EMAIL_REQUIRED" });
        return;
      }

      const result = await authService.requestOtp(
        email.trim().toLowerCase(),
        name
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OTP_REQUEST_FAILED";

      if (message === "INVALID_EMAIL") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_EMAIL" });
        return;
      }
      if (message === "ACCOUNT_BLOCKED") {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: "ACCOUNT_BLOCKED" });
        return;
      }

      console.error("OTP request error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "OTP_REQUEST_FAILED" });
    }
  },

  // POST /api/auth/otp-verify
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "EMAIL_AND_CODE_REQUIRED" });
        return;
      }

      const result = await authService.verifyOtp(
        email.trim().toLowerCase(),
        code.trim(),
        req.body.name
      );

      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OTP_VERIFY_FAILED";

      if (message === "INVALID_OTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_OTP" });
        return;
      }
      if (message === "ACCOUNT_BLOCKED") {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: "ACCOUNT_BLOCKED" });
        return;
      }

      console.error("OTP verify error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "OTP_VERIFY_FAILED" });
    }
  },

  // POST /api/auth/google
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { access_token } = req.body;
      if (!access_token) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "ACCESS_TOKEN_REQUIRED" });
        return;
      }

      const result = await authService.googleAuth(access_token);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err) {
      if (err instanceof Error && err.message === "ACCOUNT_BLOCKED") {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: "ACCOUNT_BLOCKED" });
        return;
      }
      console.error("Google auth error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "GOOGLE_AUTH_FAILED" });
    }
  },

  // POST /api/auth/2fa/setup
  async setup2Fa(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const result = await authService.setup2Fa(req.user.userId);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "TWO_FA_SETUP_FAILED";

      if (message === "USER_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }

      console.error("2FA setup error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "TWO_FA_SETUP_FAILED" });
    }
  },

  // POST /api/auth/2fa/enable
  async enable2Fa(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { code } = req.body;
      if (!code) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "CODE_REQUIRED" });
        return;
      }

      const result = await authService.enable2Fa(req.user.userId, code.trim());
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "TWO_FA_ENABLE_FAILED";

      if (message === "TOTP_NOT_SETUP") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "TOTP_NOT_SETUP" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }

      console.error("2FA enable error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "TWO_FA_ENABLE_FAILED" });
    }
  },

  // POST /api/auth/2fa/verify (now protected by validateJWT)
  async verify2Fa(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { code } = req.body;
      if (!code) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "CODE_REQUIRED" });
        return;
      }

      const result = await authService.verify2Fa(req.user.userId, code.trim());
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "TWO_FA_VERIFY_FAILED";

      if (message === "TOTP_NOT_SETUP") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "TOTP_NOT_SETUP" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }

      console.error("2FA verify error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "TWO_FA_VERIFY_FAILED" });
    }
  },

  // POST /api/auth/2fa/disable
  async disable2Fa(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { code } = req.body;
      if (!code) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "CODE_REQUIRED" });
        return;
      }

      const result = await authService.disable2Fa(req.user.userId, code.trim());
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "TWO_FA_DISABLE_FAILED";

      if (message === "TOTP_NOT_SETUP") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "TOTP_NOT_SETUP" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }

      console.error("2FA disable error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "TWO_FA_DISABLE_FAILED" });
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "EMAIL_REQUIRED" });
        return;
      }

      const result = await authService.forgotPassword(email.trim().toLowerCase());
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "FORGOT_PASSWORD_FAILED";

      if (message === "INVALID_EMAIL") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_EMAIL" });
        return;
      }

      console.error("Forgot password error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "FORGOT_PASSWORD_FAILED" });
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword, totpCode } = req.body;
      if (!email || !code || !newPassword) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "EMAIL_CODE_AND_PASSWORD_REQUIRED" });
        return;
      }
      if (newPassword.length < 8) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      const result = await authService.resetPassword(
        email.trim().toLowerCase(),
        code.trim(),
        newPassword,
        typeof totpCode === "string" ? totpCode.trim() : undefined
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "RESET_PASSWORD_FAILED";

      if (message === "INVALID_OTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_OTP" });
        return;
      }
      if (message === "USER_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }
      if (message === "TOTP_REQUIRED") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "TOTP_REQUIRED" });
        return;
      }
      if (message === "TOTP_NOT_SETUP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "TOTP_NOT_SETUP" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }
      if (message === "PASSWORD_TOO_SHORT") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      console.error("Reset password error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "RESET_PASSWORD_FAILED" });
    }
  },

  // POST /api/auth/set-password
  async setPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { newPassword } = req.body;
      if (!newPassword) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_REQUIRED" });
        return;
      }
      if (newPassword.length < 8) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      const result = await authService.setPassword(req.user.userId, newPassword);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "SET_PASSWORD_FAILED";

      if (message === "USER_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }
      if (message === "PASSWORD_TOO_SHORT") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      console.error("Set password error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "SET_PASSWORD_FAILED" });
    }
  },

  // POST /api/auth/change-password
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { currentPassword, newPassword, totpCode } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "BOTH_PASSWORDS_REQUIRED" });
        return;
      }
      if (newPassword.length < 8) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      const result = await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword,
        typeof totpCode === "string" ? totpCode.trim() : undefined
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "CHANGE_PASSWORD_FAILED";

      if (message === "NO_PASSWORD_SET") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "NO_PASSWORD_SET" });
        return;
      }
      if (message === "INVALID_CURRENT_PASSWORD") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "INVALID_CURRENT_PASSWORD" });
        return;
      }
      if (message === "TOTP_REQUIRED") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "TOTP_REQUIRED" });
        return;
      }
      if (message === "TOTP_NOT_SETUP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "TOTP_NOT_SETUP" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }
      if (message === "PASSWORD_TOO_SHORT") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_TOO_SHORT" });
        return;
      }

      console.error("Change password error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "CHANGE_PASSWORD_FAILED" });
    }
  },

  // DELETE /api/auth/account
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { password, totpCode } = req.body;

      const result = await authService.deleteAccount(
        req.user.userId,
        password,
        totpCode
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "DELETE_ACCOUNT_FAILED";

      if (message === "PASSWORD_REQUIRED") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_REQUIRED" });
        return;
      }
      if (message === "INVALID_PASSWORD") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "INVALID_PASSWORD" });
        return;
      }
      if (message === "TOTP_REQUIRED") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "TOTP_REQUIRED" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }
      if (message === "USER_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }

      console.error("Delete account error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "DELETE_ACCOUNT_FAILED" });
    }
  },

  // POST /api/auth/request-delete-otp
  async requestDeleteOtp(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { password, totpCode } = req.body;

      const result = await authService.requestDeleteOtp(
        req.user.userId,
        password,
        totpCode
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "REQUEST_DELETE_OTP_FAILED";

      if (message === "PASSWORD_REQUIRED") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PASSWORD_REQUIRED" });
        return;
      }
      if (message === "INVALID_PASSWORD") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "INVALID_PASSWORD" });
        return;
      }
      if (message === "TOTP_REQUIRED") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "TOTP_REQUIRED" });
        return;
      }
      if (message === "INVALID_TOTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_TOTP" });
        return;
      }
      if (message === "USER_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }

      console.error("Request delete OTP error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "REQUEST_DELETE_OTP_FAILED" });
    }
  },

  // POST /api/auth/verify-delete-otp
  async verifyDeleteOtp(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { code } = req.body;
      if (!code) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "CODE_REQUIRED" });
        return;
      }

      const result = await authService.verifyDeleteOtp(
        req.user.userId,
        code.trim()
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "VERIFY_DELETE_OTP_FAILED";

      if (message === "INVALID_OTP") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_OTP" });
        return;
      }
      if (message === "USER_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }

      console.error("Verify delete OTP error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "VERIFY_DELETE_OTP_FAILED" });
    }
  },

  // GET /api/auth/me
  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const user = await import("../config/prisma").then((m) =>
        m.prisma.usuarios.findUnique({
          where: { id: req.user!.userId },
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
            role: true,
            twoFactorEnabled: true,
            points: true,
            provider: true,
            passwordHash: true,
            fecha_creacion: true,
              genero: true,
              altura: true,
              medida_pecho: true,
              medida_cintura: true,
              medida_cadera: true,
              medida_muslo: true,
              preferencia_ropa: true,
              preferencia_colores: true,
              preferencia_deporte: true,
              onboarding_completado: true,
          },
        })
      );

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }

      const { passwordHash, ...safeUser } = user;
      res.status(HTTP_STATUS.OK).json({
        user: {
          ...safeUser,
          role: safeUser.role || ROLES.CUSTOMER,
          altura: safeUser.altura === null ? null : Number(safeUser.altura),
          medida_pecho: safeUser.medida_pecho === null ? null : Number(safeUser.medida_pecho),
          medida_cintura: safeUser.medida_cintura === null ? null : Number(safeUser.medida_cintura),
          medida_cadera: safeUser.medida_cadera === null ? null : Number(safeUser.medida_cadera),
          medida_muslo: safeUser.medida_muslo === null ? null : Number(safeUser.medida_muslo),
          hasPassword: !!passwordHash,
        },
      });
    } catch (err) {
      console.error("Get me error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "GET_USER_FAILED" });
    }
  },

  updateMe: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "UNAUTHORIZED" });
        return;
      }

      if (!isRecord(req.body)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_PROFILE_DATA" });
        return;
      }

      const body = req.body;
      const dataToUpdate: Prisma.usuariosUpdateInput = {};
      let hasUpdate = false;

      if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.trim().length > 150) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_NAME" });
          return;
        }
        dataToUpdate.name = body.name.trim() || null;
        hasUpdate = true;
      }

      if (body.picture !== undefined) {
        if (body.picture !== null && (typeof body.picture !== "string" || body.picture.length > 3_000_000)) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_PICTURE" });
          return;
        }
        dataToUpdate.picture = body.picture;
        hasUpdate = true;
      }

      if (body.genero !== undefined) {
        const allowedGenders = ["Hombre", "Mujer", "Masculino", "Femenino", "male", "female"];
        if (typeof body.genero !== "string" || !allowedGenders.includes(body.genero)) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_GENDER" });
          return;
        }
        dataToUpdate.genero = body.genero;
        hasUpdate = true;
      }

      const measurementFields = [
        ["altura", 100, 250],
        ["medida_pecho", 30, 250],
        ["medida_cintura", 30, 250],
        ["medida_cadera", 30, 250],
        ["medida_muslo", 20, 150],
      ] as const;
      for (const [field, min, max] of measurementFields) {
        const value = body[field];
        if (value === undefined) continue;
        if (value !== null && !isValidMeasurement(value, min, max)) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ error: `INVALID_${field.toUpperCase()}` });
          return;
        }
        dataToUpdate[field] = value;
        hasUpdate = true;
      }

      const preferenceFields = ["preferencia_ropa", "preferencia_colores", "preferencia_deporte"] as const;
      for (const field of preferenceFields) {
        const value = body[field];
        if (value === undefined) continue;
        if (value !== null && (typeof value !== "string" || value.trim().length > 100)) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ error: `INVALID_${field.toUpperCase()}` });
          return;
        }
        dataToUpdate[field] = typeof value === "string" ? value.trim() || null : value;
        hasUpdate = true;
      }

      if (body.onboarding_completado !== undefined) {
        if (typeof body.onboarding_completado !== "boolean") {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_ONBOARDING_STATUS" });
          return;
        }
        if (body.onboarding_completado) {
          const requiredFields = [
            "genero",
            "altura",
            "medida_pecho",
            "medida_cintura",
            "medida_cadera",
            "medida_muslo",
          ];
          if (requiredFields.some((field) => body[field] === undefined || body[field] === null)) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "PROFILE_MEASUREMENTS_REQUIRED" });
            return;
          }
        }
        dataToUpdate.onboarding_completado = body.onboarding_completado;
        hasUpdate = true;
      }

      if (!hasUpdate) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "EMPTY_PROFILE_UPDATE" });
        return;
      }

      const db = await import("../config/prisma").then((m) => m.prisma);
      const updatedUser = await db.usuarios.update({
        where: { id: req.user.userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          role: true,
          twoFactorEnabled: true,
          points: true,
          provider: true,
          genero: true,
          altura: true,
          medida_pecho: true,
          medida_cintura: true,
          medida_cadera: true,
          medida_muslo: true,
          preferencia_ropa: true,
          preferencia_colores: true,
          preferencia_deporte: true,
          onboarding_completado: true,
        },
      });

      res.status(HTTP_STATUS.OK).json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role || ROLES.CUSTOMER,
          picture: updatedUser.picture,
          twoFactorEnabled: updatedUser.twoFactorEnabled,
          points: updatedUser.points,
          provider: updatedUser.provider || "LOCAL",
          genero: updatedUser.genero,
          altura: updatedUser.altura === null ? null : Number(updatedUser.altura),
          medida_pecho: updatedUser.medida_pecho === null ? null : Number(updatedUser.medida_pecho),
          medida_cintura: updatedUser.medida_cintura === null ? null : Number(updatedUser.medida_cintura),
          medida_cadera: updatedUser.medida_cadera === null ? null : Number(updatedUser.medida_cadera),
          medida_muslo: updatedUser.medida_muslo === null ? null : Number(updatedUser.medida_muslo),
          preferencia_ropa: updatedUser.preferencia_ropa,
          preferencia_colores: updatedUser.preferencia_colores,
          preferencia_deporte: updatedUser.preferencia_deporte,
          onboarding_completado: updatedUser.onboarding_completado,
        },
      });
    } catch (err) {
      console.error("Update me error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "UPDATE_USER_FAILED" });
    }
  },
};
