import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { settingsService } from "../services/settings";

export const settingsController = {
  async get(_req: Request, res: Response) {
    try { res.set("Cache-Control", "no-store").json({ settings: await settingsService.get(), payment: settingsService.paymentInfo() }); }
    catch { res.status(503).json({ error: "SETTINGS_UNAVAILABLE" }); }
  },
  async update(req: AuthRequest, res: Response) {
    try {
      const settings = await settingsService.update(req.body, req.user!.userId);
      res.json({ settings });
    } catch (err) {
      const code = err instanceof Error ? err.message : "SETTINGS_SAVE_FAILED";
      res.status(code.startsWith("INVALID_") ? 400 : code === "STAFF_MFA_NOT_READY" ? 409 : 500).json({ error: code.startsWith("INVALID_") || code === "STAFF_MFA_NOT_READY" ? code : "SETTINGS_SAVE_FAILED" });
    }
  },
};
