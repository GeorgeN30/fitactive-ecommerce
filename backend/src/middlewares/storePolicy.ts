import { Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { AuthRequest } from "./auth";
import { settingsService } from "../services/settings";

export async function requireStaffMfa(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if ((await settingsService.get()).twoFactor && !req.user?.twoFactorEnabled) { res.status(403).json({ error: "MFA_SETUP_REQUIRED" }); return; }
    next();
  } catch { res.status(503).json({ error: "SETTINGS_UNAVAILABLE" }); }
}
export const tryOnSessionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: async () => (await settingsService.get()).limit,
  skip: (req) => req.body?.type !== "session_started",
  standardHeaders: true, legacyHeaders: false,
  message: { error: "TRYON_DAILY_LIMIT_REACHED" },
});
