import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { HTTP_STATUS } from "../constants";
import {
  isValidMercadoPagoWebhookSignature,
  mercadoPagoService,
} from "../services/mercadoPago";

function paymentErrorStatus(message: string): number {
  if (message === "ORDER_NOT_FOUND") return HTTP_STATUS.NOT_FOUND;
  if (message === "ORDER_NOT_PAYABLE" || message === "PAYMENT_ORDER_MISMATCH") {
    return HTTP_STATUS.CONFLICT;
  }
  if (message === "MERCADO_PAGO_NOT_CONFIGURED") return 503;
  if (message === "APP_URL_MUST_BE_HTTPS") return 503;
  if (message.startsWith("MERCADO_PAGO_")) return 502;
  return HTTP_STATUS.INTERNAL_ERROR;
}

export const paymentController = {
  async createMercadoPagoPreference(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : "";
    if (!orderId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "ORDER_ID_REQUIRED" });
      return;
    }

    try {
      const preference = await mercadoPagoService.createPreferenceForOrder(
        req.user.userId,
        orderId,
      );
      res.status(HTTP_STATUS.OK).json({ preference });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "PAYMENT_PREFERENCE_FAILED";
      console.error("Create Mercado Pago preference error:", error);
      res.status(paymentErrorStatus(message)).json({
        error: message.startsWith("MERCADO_PAGO_") ? "PAYMENT_PROVIDER_ERROR" : message,
      });
    }
  },

  async getMercadoPagoOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    const paymentId = typeof req.query.payment_id === "string"
      ? req.query.payment_id.trim()
      : undefined;

    try {
      const status = await mercadoPagoService.getOrderPaymentStatus(
        req.user.userId,
        req.params.orderId,
        paymentId,
      );
      res.status(HTTP_STATUS.OK).json({ status });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "PAYMENT_STATUS_FAILED";
      console.error("Get Mercado Pago status error:", error);
      res.status(paymentErrorStatus(message)).json({
        error: message.startsWith("MERCADO_PAGO_") ? "PAYMENT_PROVIDER_ERROR" : message,
      });
    }
  },

  handleMercadoPagoWebhook(req: { headers: Record<string, string | string[] | undefined>; body: unknown }, res: Response): void {
    const signature = typeof req.headers["x-signature"] === "string"
      ? req.headers["x-signature"]
      : undefined;
    const requestId = typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"]
      : undefined;
    const body = (req.body || {}) as {
      type?: string;
      data?: { id?: string | number };
    };

    if (!isValidMercadoPagoWebhookSignature(signature, requestId, body)) {
      res.status(401).end();
      return;
    }

    res.status(200).end();
    void mercadoPagoService.processWebhook(body).catch((error: unknown) => {
      console.error("Process Mercado Pago webhook error:", error);
    });
  },
};
