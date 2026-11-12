import api from "./api";
export interface ReturnRequest {
  id: string; orderId: string; orderNumber: string; customer: { name: string | null; email: string };
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUNDED";
  reason: string; comment: string | null; amount: number; createdAt: string;
  refundStatus: string; receivedAt: string | null; refundedAt: string | null;
  items: { sizeId: string; name: string; size: string; quantity: number }[];
}
export const returnLabels = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada", RECEIVED: "Recibida", REFUNDED: "Reembolsada" };
export async function fetchReturns(admin = false): Promise<ReturnRequest[]> { return (await api.get(admin ? "/admin/returns" : "/returns")).data.requests; }
export async function createReturn(orderId: string, reason: string, items: { sizeId: string; quantity: number }[]): Promise<ReturnRequest> { return (await api.post("/returns", { orderId, reason, items })).data.request; }
export async function updateReturn(id: string, action: "review" | "receive" | "refund", body: { decision?: "APPROVED" | "REJECTED"; comment?: string } = {}): Promise<ReturnRequest> { return (await api.put(`/admin/returns/${id}/${action}`, body)).data.request; }
export function returnError(err: unknown) {
  const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
  const messages: Record<string, string> = {
    ORDER_NOT_DELIVERED: "Solo puedes devolver pedidos entregados.", RETURN_QUANTITY_EXCEEDED: "Ya hay una devolución registrada para esas unidades. Actualiza el historial.",
    RETURN_ALREADY_RESOLVED: "Otro administrador ya resolvió la solicitud.", RETURN_NOT_APPROVED: "La devolución debe estar aprobada y aún no recibida.",
    RETURN_NOT_RECEIVED: "Confirma primero la recepción física de los productos.", REFUND_IN_PROGRESS: "El reembolso está siendo procesado. Actualiza en un momento.",
    PAYMENT_NOT_REFUNDABLE: "El pedido no tiene un pago de Mercado Pago disponible para reembolsar.", MERCADO_PAGO_NOT_CONFIGURED: "Configura Mercado Pago en el servidor antes de procesar reembolsos.",
    REFUND_NOT_CONFIRMED: "Mercado Pago aún no confirmó el reembolso. No se marcará como reembolsado.",
  };
  return messages[code || ""] || "No se pudo guardar la operación. Actualiza el estado antes de reintentar.";
}
