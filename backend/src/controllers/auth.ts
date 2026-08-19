import { Request, Response } from "express";
import { authService } from "../services/auth";
import { HTTP_STATUS } from "../constants";
import { AuthRequest } from "../middlewares/auth";

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

      const hasPassword = await authService.hasPassword(email.trim().toLowerCase());
      res.status(HTTP_STATUS.OK).json({ hasPassword });
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
      const { email, code, newPassword } = req.body;
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
        newPassword
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

      const { currentPassword, newPassword } = req.body;
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
        newPassword
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
        m.prisma.user.findUnique({
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
            createdAt: true,
          },
        })
      );

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: "USER_NOT_FOUND" });
        return;
      }

      const { passwordHash, ...safeUser } = user;
      res.status(HTTP_STATUS.OK).json({
        user: { ...safeUser, hasPassword: !!passwordHash },
      });
    } catch (err) {
      console.error("Get me error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "GET_USER_FAILED" });
    }
  },
};
