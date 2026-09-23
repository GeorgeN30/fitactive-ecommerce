import { Response } from "express";
import { HTTP_STATUS } from "../constants";
import { AuthRequest } from "../middlewares/auth";
import { virtualTryOnService } from "../services/virtualTryOn";

export const virtualTryOnController = {
  // POST /api/virtual-tryon/events
  async recordEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const event = await virtualTryOnService.recordEvent(req.body, req.user?.userId);
      res.status(HTTP_STATUS.CREATED).json({ event });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "VIRTUAL_TRYON_EVENT_FAILED";
      if (message.startsWith("INVALID_VIRTUAL_TRYON")) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: message });
        return;
      }
      console.error("Virtual try-on event error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "VIRTUAL_TRYON_EVENT_FAILED" });
    }
  },
};
