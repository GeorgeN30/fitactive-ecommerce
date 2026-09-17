import { Response } from "express";
import { HTTP_STATUS } from "../constants";
import { AuthRequest } from "../middlewares/auth";
import { notifications } from "../services/notifications";

export const notificationController = {
  async listMine(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const items = await notifications.listForUser(req.user.userId);
      res.status(HTTP_STATUS.OK).json({ notifications: items });
    } catch (error) {
      console.error("List notifications error:", error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "NOTIFICATION_LIST_FAILED" });
    }
  },

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      await notifications.markAsRead(req.user.userId, req.params.id);
      res.status(HTTP_STATUS.OK).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "NOTIFICATION_READ_FAILED";
      if (message === "NOTIFICATION_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: message });
        return;
      }
      console.error("Mark notification as read error:", error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "NOTIFICATION_READ_FAILED" });
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      await notifications.markAllAsRead(req.user.userId);
      res.status(HTTP_STATUS.OK).json({ success: true });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "NOTIFICATION_READ_ALL_FAILED" });
    }
  },
};
