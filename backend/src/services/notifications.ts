import { baas } from "./baas";
import { prisma } from "../config/prisma";
import { ROLES, LOW_STOCK_THRESHOLD } from "../constants";
import { config } from "../config/env";

export const EVENT_TYPES = {
  NEW_ORDER: "NEW_ORDER",
  ORDER_STATUS: "ORDER_STATUS",
  STOCK_ALERT: "STOCK_ALERT",
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
    .map(([label, value]) => `<li><strong>${label}</strong>: ${value}</li>`)
    .join("");
  try {
    await baas.sendEmail(
      email,
      "FitLook",
      subject,
      `<p>Hola,</p><p>Te compartimos una actualización de tu pedido.</p><ul>${rows}</ul><p>Gracias por comprar en FitLook.</p>`,
    );
  } catch (error) {
    console.error("[notifications] error enviando correo:", error);
  }
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
};
