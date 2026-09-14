import { Response } from "express";
import { orderService } from "../services/orders";
import { notifications } from "../services/notifications";
import { HTTP_STATUS } from "../constants";
import { AuthRequest } from "../middlewares/auth";

export const orderController = {
  // POST /api/orders
  async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const { entries } = req.body;
      const order = await orderService.createOrder(req.user.userId, entries);

      void notifications.notifyNewOrder({
        orderId: order.id,
        orderNumber: order.numero,
        total: order.total,
        customerId: req.user.userId,
      });

      res.status(HTTP_STATUS.CREATED).json({ order });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ORDER_CREATE_FAILED";

      if (
        message === "EMPTY_ORDER" ||
        message === "INVALID_ENTRY" ||
        message === "INVALID_QUANTITY"
      ) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: message });
        return;
      }
      if (message === "PRODUCT_NOT_FOUND") {
        res.status(HTTP_STATUS.NOT_FOUND).json({ error: message });
        return;
      }
      if (message === "INSUFFICIENT_STOCK") {
        res.status(HTTP_STATUS.CONFLICT).json({ error: message });
        return;
      }

      console.error("Create order error:", err);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "ORDER_CREATE_FAILED" });
    }
  },

  // GET /api/orders
  async listMyOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const orders = await orderService.listUserOrders(req.user.userId);
      res.status(HTTP_STATUS.OK).json({ orders });
    } catch (err) {
      console.error("List orders error:", err);
      res
        .status(HTTP_STATUS.INTERNAL_ERROR)
        .json({ error: "ORDER_LIST_FAILED" });
    }
  },
};