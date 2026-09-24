import api from "./api";
import { getStoredSessionValue } from "../utils/session";

const WS_BASE =
  import.meta.env.VITE_BAAS_WS_URL || "wss://core.geozns.com/v1/ws";
const APP_ID = import.meta.env.VITE_JWT_APP_ID || "integrador2_web";
export const NOTIFICATIONS_UPDATED_EVENT = "fitlook:notifications-updated";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  referenceId?: string | null;
}

interface BackendNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  referenceId?: string | null;
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapBackendNotification(notification: BackendNotification): AdminNotification {
  const priority: AdminNotification["priority"] =
    notification.type === "stock" || notification.type === "discount"
      ? "high"
      : "medium";

  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    date: formatNotificationDate(notification.createdAt),
    read: notification.read,
    priority,
    referenceId: notification.referenceId,
  };
}

export function announceNotificationsUpdated(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export async function fetchNotifications(): Promise<AdminNotification[]> {
  const { data } = await api.get<{ notifications: BackendNotification[] }>(
    "/notifications",
  );
  return data.notifications.map(mapBackendNotification);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await api.put(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put("/notifications/read-all");
}

export type LiveEvent =
  | { type: "NEW_ORDER"; data?: Record<string, unknown> }
  | { type: "ORDER_STATUS"; data?: Record<string, unknown> }
  | { type: "PAYMENT_STATUS"; data?: Record<string, unknown> }
  | { type: "STOCK_ALERT"; data?: Record<string, unknown> }
  | { type: "DISCOUNT_REQUESTED"; data?: Record<string, unknown> }
  | { type: "DISCOUNT_APPROVED"; data?: Record<string, unknown> }
  | { type: "DISCOUNT_REJECTED"; data?: Record<string, unknown> }
  | { type: "DISCOUNT_REVERTED"; data?: Record<string, unknown> }
  | { type: string; data?: Record<string, unknown> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractEvent(raw: unknown): LiveEvent | null {
  if (!isRecord(raw)) return null;

  const candidates: Array<{ type: string; data: Record<string, unknown> }> = [];
  if (typeof raw.type === "string") {
    candidates.push({
      type: raw.type,
      data: isRecord(raw.data) ? raw.data : {},
    });
  }
  if (isRecord(raw.payload) && typeof raw.payload.type === "string") {
    candidates.push({
      type: raw.payload.type,
      data: isRecord(raw.payload.data) ? raw.payload.data : raw.payload,
    });
  }

  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  return {
    type: chosen.type,
    data: chosen.data || {},
  };
}

export function mapLiveEventToAdminNotification(
  event: LiveEvent,
): AdminNotification {
  const data = event.data || {};
  const orderNumber =
    (data.orderNumber as string) || (data.orderId as string) || "";

  switch (event.type) {
    case "NEW_ORDER":
      return {
        id: `live-${Date.now()}`,
        title: "Nuevo pedido",
        message: `Se registró un nuevo pedido${orderNumber ? ` ${orderNumber}` : ""}. Revisa el módulo de pedidos.`,
        type: "order",
        date: "Justo ahora",
        read: false,
        priority: "medium",
      };
    case "ORDER_STATUS":
      return {
        id: `live-${Date.now()}`,
        title: "Estado de pedido actualizado",
        message: `El pedido${orderNumber ? ` ${orderNumber}` : ""} cambió de estado a ${(data.status as string) || "desconocido"}.`,
        type: "order",
        date: "Justo ahora",
        read: false,
        priority: "low",
      };
    case "PAYMENT_STATUS":
      return {
        id: `live-${Date.now()}`,
        title: "Pago actualizado",
        message: `El pago del pedido${orderNumber ? ` ${orderNumber}` : ""} está ${(data.paymentStatus as string) || "pendiente"}.`,
        type: "order",
        date: "Justo ahora",
        read: false,
        priority: ["rejected", "cancelled", "cancelled_by_payer", "expired"].includes(
          String(data.paymentStatus || "").toLowerCase(),
        ) ? "high" : "medium",
      };
    case "STOCK_ALERT":
      return {
        id: `live-${Date.now()}`,
        title: "Alerta de stock bajo",
        message: `${(data.productName as string) || "Producto"} (talla ${(data.size as string) || "-"}) quedó con ${(data.stock as number) ?? 0} unidades.`,
        type: "stock",
        date: "Justo ahora",
        read: false,
        priority: "high",
      };
    case "DISCOUNT_REQUESTED":
      return {
        id: `live-${Date.now()}`,
        title: "Solicitud de descuento pendiente",
        message: `${(data.requesterName as string) || "El gestor"} solicita ${(data.percent as number) || 0}% para ${(data.productName as string) || "un producto"} (talla ${(data.size as string) || "-"}).`,
        type: "discount",
        date: "Justo ahora",
        read: false,
        priority: "high",
      };
    case "DISCOUNT_APPROVED":
      return {
        id: `live-${Date.now()}`,
        title: "Descuento aprobado",
        message: `Se aprobó el ${(data.percent as number) || 0}% de descuento para ${(data.productName as string) || "el producto"} (talla ${(data.size as string) || "-"}).`,
        type: "discount",
        date: "Justo ahora",
        read: false,
        priority: "medium",
      };
    case "DISCOUNT_REJECTED":
      return {
        id: `live-${Date.now()}`,
        title: "Descuento rechazado",
        message: `Se rechazó la solicitud de descuento para ${(data.productName as string) || "el producto"} (talla ${(data.size as string) || "-"}).${data.comment ? ` Motivo: ${data.comment as string}` : ""}`,
        type: "discount",
        date: "Justo ahora",
        read: false,
        priority: "high",
      };
    case "DISCOUNT_REVERTED":
      return {
        id: `live-${Date.now()}`,
        title: "Descuento revertido",
        message: `El administrador retiró el descuento de ${(data.productName as string) || "el producto"} (talla ${(data.size as string) || "-"}).`,
        type: "discount",
        date: "Justo ahora",
        read: false,
        priority: "high",
      };
    default:
      return {
        id: `live-${Date.now()}`,
        title: "Notificación del sistema",
        message: `Evento ${event.type} recibido en tiempo real (BaaS).`,
        type: "system",
        date: "Justo ahora",
        read: false,
        priority: "low",
      };
  }
}

export function mapLiveEventToCustomerNotification(
  event: LiveEvent,
): AdminNotification {
  const notification = mapLiveEventToAdminNotification(event);
  if (event.type !== "NEW_ORDER") return notification;
  const data = event.data || {};
  const orderNumber = (data.orderNumber as string) || (data.orderId as string) || "";
  return {
    ...notification,
    title: "Pedido registrado",
    message: `Tu pedido${orderNumber ? ` ${orderNumber}` : ""} fue registrado y está pendiente de pago.`,
  };
}

export function connectAdminSocket(
  onEvent: (event: LiveEvent) => void,
): () => void {
  let socket: WebSocket | null = null;
  let closed = false;
  let retryAttempts = 0;

  const connect = () => {
    if (closed) return;
    const token = getStoredSessionValue("token");
    if (!token) return;

    const url = `${WS_BASE}?token=${encodeURIComponent(token)}&app_id=${encodeURIComponent(APP_ID)}`;
    try {
      socket = new WebSocket(url);
    } catch {
      return;
    }

    socket.onopen = () => {
      retryAttempts = 0;
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data);
        const event = extractEvent(parsed);
        if (event) onEvent(event);
      } catch {
        // Ignore malformed frames.
      }
    };

    socket.onerror = () => {
      socket?.close();
    };

    socket.onclose = () => {
      if (closed) return;
      retryAttempts += 1;
      const delay = Math.min(30000, 1000 * 2 ** retryAttempts);
      setTimeout(connect, delay);
    };
  };

  connect();

  return () => {
    closed = true;
    socket?.close();
  };
}
