import { baas } from "./baas";
import { prisma } from "../config/prisma";
import { ROLES, LOW_STOCK_THRESHOLD } from "../constants";
import { config } from "../config/env";
import type { DiscountRequestResult } from "./discounts";

export const EVENT_TYPES = {
  NEW_ORDER: "NEW_ORDER",
  ORDER_STATUS: "ORDER_STATUS",
  STOCK_ALERT: "STOCK_ALERT",
  DISCOUNT_REQUESTED: "DISCOUNT_REQUESTED",
  DISCOUNT_APPROVED: "DISCOUNT_APPROVED",
  DISCOUNT_REJECTED: "DISCOUNT_REJECTED",
  DISCOUNT_REVERTED: "DISCOUNT_REVERTED",
} as const;

export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  total: number;
  customerId: string;
}

export interface StatusNotificationData {
  orderId: string;
  orderNumber: string;
  status: string;
}

export interface StockNotificationData {
  productId: string;
  productName: string;
  size: string;
  stock: number;
}

async function adminUserIds(): Promise<string[]> {
  const admins = await prisma.usuarios.findMany({
    where: { role: ROLES.ADMIN },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
}

async function sendToUser(
  userId: string,
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await baas.notify(config.jwtAppId, userId, { type, data });
  } catch (error) {
    console.error("[notifications] error enviando evento:", error);
  }
}

async function sendOrderEmail(
  email: string | undefined,
  subject: string,
  data: Record<string, string>,
): Promise<void> {
  if (!email || typeof baas.sendEmail !== "function") return;
  const rows = Object.entries(data)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:12px 0;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;text-transform:capitalize">${escapeHtml(label)}</td><td style="padding:12px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#0f172a;border-radius:18px 18px 0 0;padding:26px 28px;text-align:center"><div style="color:#00ff66;font-size:22px;font-weight:900;letter-spacing:2px">FITLOOK</div><div style="color:#cbd5e1;font-size:12px;margin-top:6px;letter-spacing:.5px">GESTIÓN DEPORTIVA</div></div><div style="background:#ffffff;padding:32px 28px;border-radius:0 0 18px 18px;box-shadow:0 8px 30px rgba(15,23,42,.08)"><div style="display:inline-block;background:#dcfce7;color:#15803d;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px">Actualización</div><h1 style="margin:18px 0 10px;font-size:24px;line-height:1.25;color:#0f172a">${escapeHtml(subject)}</h1><p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">Hola, te compartimos una actualización importante de tu solicitud en FitLook.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${rows}</table><div style="margin-top:26px;padding:14px 16px;background:#f8fafc;border-left:4px solid #00ff66;color:#475569;font-size:12px;line-height:1.5">Este correo fue generado automáticamente. Si tienes dudas, revisa el historial de solicitudes dentro de la plataforma.</div></div><p style="margin:18px 0 0;text-align:center;color:#94a3b8;font-size:11px">FitLook · Gestión de inventario</p></div></body></html>`;
  try {
    await baas.sendEmail(email, "FitLook", subject, html);
  } catch (error) {
    console.error("[notifications] error enviando correo:", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const notifications = {
  async notifyNewOrder(order: OrderNotificationData): Promise<void> {
    try {
      const [admins, customer] = await Promise.all([
        adminUserIds(),
        prisma.usuarios.findUnique({
          where: { id: order.customerId },
          select: { name: true, email: true },
        }),
      ]);

      const customerName = customer?.name || customer?.email || "Cliente";

      for (const userId of admins) {
        await sendToUser(userId, EVENT_TYPES.NEW_ORDER, {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          total: order.total,
          customerName,
        });
      }
      await sendOrderEmail(customer?.email, `Pedido ${order.orderNumber} registrado`, {
        pedido: order.orderNumber,
        total: `S/ ${order.total.toFixed(2)}`,
        estado: "Pendiente",
      });
    } catch (error) {
      console.error("[notifications] error en NEW_ORDER:", error);
    }
  },

  async notifyOrderStatus(
    userId: string,
    order: StatusNotificationData
  ): Promise<void> {
    await sendToUser(userId, EVENT_TYPES.ORDER_STATUS, {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
    });
    const customer = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    await sendOrderEmail(customer?.email, `Actualización del pedido ${order.orderNumber}`, {
      pedido: order.orderNumber,
      estado: order.status,
    });
  },

  async notifyStockAlert(stock: StockNotificationData): Promise<void> {
    if (stock.stock > LOW_STOCK_THRESHOLD) {
      return;
    }
    try {
      const userIds = await adminUserIds();
      for (const userId of userIds) {
        await sendToUser(userId, EVENT_TYPES.STOCK_ALERT, {
          productId: stock.productId,
          productName: stock.productName,
          size: stock.size,
          stock: stock.stock,
        });
      }
    } catch (error) {
      console.error("[notifications] error en STOCK_ALERT:", error);
    }
  },

  async notifyDiscountRequestCreated(
    requests: DiscountRequestResult[],
  ): Promise<void> {
    if (requests.length === 0) return;
    try {
      const admins = await adminUserIds();
      for (const request of requests) {
        for (const userId of admins) {
          await sendToUser(userId, EVENT_TYPES.DISCOUNT_REQUESTED, {
            requestId: request.id,
            productId: request.product.id,
            productName: request.product.name,
            size: request.product.size,
            percent: request.percent,
            reason: request.reason,
            requesterName: request.requester.name || request.requester.email,
          });
        }
      }
    } catch (error) {
      console.error("[notifications] error en DISCOUNT_REQUESTED:", error);
    }
  },

  async notifyDiscountDecision(request: DiscountRequestResult): Promise<void> {
    const approved = request.status === "APPROVED";
    const type = approved
      ? EVENT_TYPES.DISCOUNT_APPROVED
      : EVENT_TYPES.DISCOUNT_REJECTED;
    await sendToUser(request.requester.id, type, {
      requestId: request.id,
      productId: request.product.id,
      productName: request.product.name,
      size: request.product.size,
      percent: request.percent,
      reason: request.reason,
      comment: request.reviewComment || "",
    });

    await sendOrderEmail(
      request.requester.email,
      approved ? "Solicitud de descuento aprobada" : "Solicitud de descuento rechazada",
      {
        producto: request.product.name,
        talla: request.product.size,
        porcentaje: `${request.percent}%`,
        estado: approved ? "Aprobada" : "Rechazada",
        comentario: request.reviewComment || "Sin comentario",
      },
    );
  },

  async notifyDiscountReverted(request: DiscountRequestResult): Promise<void> {
    await sendToUser(request.requester.id, EVENT_TYPES.DISCOUNT_REVERTED, {
      requestId: request.id,
      productId: request.product.id,
      productName: request.product.name,
      size: request.product.size,
      percent: request.percent,
      reason: request.reason,
    });

    await sendOrderEmail(
      request.requester.email,
      "Descuento revertido por el administrador",
      {
        producto: request.product.name,
        talla: request.product.size,
        porcentaje: `${request.percent}%`,
        estado: "Revertido",
        comentario: "El descuento fue retirado por un administrador.",
      },
    );
  },
};
