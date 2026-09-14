const WS_BASE = "wss://core.geozns.com/v1/ws";
const APP_ID = "integrador2_web";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
  priority: "high" | "medium" | "low";
}

export type LiveEvent =
  | { type: "NEW_ORDER"; data?: Record<string, unknown> }
  | { type: "ORDER_STATUS"; data?: Record<string, unknown> }
  | { type: "STOCK_ALERT"; data?: Record<string, unknown> }
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

export function connectAdminSocket(
  onEvent: (event: LiveEvent) => void,
): () => void {
  let socket: WebSocket | null = null;
  let closed = false;
  let retryAttempts = 0;

  const connect = () => {
    if (closed) return;
    const token = localStorage.getItem("token");
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
