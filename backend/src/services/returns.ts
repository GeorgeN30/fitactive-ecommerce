import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ORDER_STATUS } from "../constants";
import { roundToCents } from "../utils/pricing";
import { mercadoPagoService } from "./mercadoPago";

const include = { order: { select: { numero: true } }, user: { select: { name: true, email: true } }, items: { include: { detail: { include: { producto_tallas: { include: { productos: true } } } } } } } as const;
type ReturnRow = Prisma.return_requestsGetPayload<{ include: typeof include }>;
function map(row: ReturnRow) {
  return { id: row.id, orderId: row.order_id, orderNumber: row.order.numero || row.order_id, customer: row.user,
    reason: row.reason, status: row.status, comment: row.comment, amount: row.amount.toNumber(), createdAt: row.created_at,
    receivedAt: row.received_at, refundedAt: row.refunded_at, refundStatus: row.refund_status,
    items: row.items.map((item) => ({ sizeId: item.detail.producto_talla_id, name: item.detail.producto_tallas.productos.nombre, size: item.detail.producto_tallas.talla, quantity: item.quantity })) };
}
async function notify(tx: Prisma.TransactionClient, userId: string, orderId: string, status: string) {
  await tx.notifications.create({ data: { userId, type: "return", title: "Actualización de devolución", message: `La devolución del pedido ${orderId} cambió a ${status}. Consulta el detalle de tu compra.`, referenceId: orderId } });
}
async function transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (err) { if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2034" || attempt >= 2) throw err; }
  }
}
export const returnService = {
  async list(userId?: string) {
    return (await prisma.return_requests.findMany({ where: userId ? { user_id: userId } : undefined, include, orderBy: { created_at: "desc" } })).map(map);
  },
  async create(userId: string, data: { orderId: string; reason: string; items: { sizeId: string; quantity: number }[] }) {
    if (!data || typeof data.reason !== "string" || data.reason.trim().length < 5 || data.reason.length > 1000 || !Array.isArray(data.items) || !data.items.length || data.items.some((item) => !item || typeof item.sizeId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1) || new Set(data.items.map((item) => item.sizeId)).size !== data.items.length) throw new Error("INVALID_RETURN_DATA");
    const result = await transaction(async (tx) => {
      const order = await tx.ordenes.findFirst({ where: { id: data.orderId, usuario_id: userId }, include: { orden_detalles: true } });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.estado !== ORDER_STATUS.DELIVERED) throw new Error("ORDER_NOT_DELIVERED");
      const used = await tx.return_items.findMany({ where: { request: { order_id: order.id, status: { not: "REJECTED" } } } });
      const items = data.items.map((item) => {
        const detail = order.orden_detalles.find((entry) => entry.producto_talla_id === item.sizeId);
        if (!detail) throw new Error("INVALID_RETURN_DATA");
        const alreadyUsed = used.filter((entry) => entry.detail_id === detail.id).reduce((sum, entry) => sum + entry.quantity, 0);
        if (item.quantity + alreadyUsed > detail.cantidad) throw new Error("RETURN_QUANTITY_EXCEEDED");
        return { detail_id: detail.id, quantity: item.quantity, subtotal: detail.precio_unitario.toNumber() * item.quantity };
      });
      const request = await tx.return_requests.create({ data: { order_id: order.id, user_id: userId, reason: data.reason.trim(), amount: roundToCents(items.reduce((sum, item) => sum + item.subtotal, 0)), items: { create: items.map(({ detail_id, quantity }) => ({ detail_id, quantity })) } }, include });
      const admins = await tx.usuarios.findMany({ where: { role: "admin", blocked: false }, select: { id: true } });
      for (const admin of admins) await notify(tx, admin.id, order.id, "solicitada");
      return request;
    });
    return map(result);
  },
  async review(id: string, userId: string, decision: string, comment?: string) {
    if (!["APPROVED", "REJECTED"].includes(decision) || comment !== undefined && (typeof comment !== "string" || comment.length > 1000)) throw new Error("INVALID_RETURN_DECISION");
    const result = await transaction(async (tx) => {
      const updated = await tx.return_requests.updateMany({ where: { id, status: "PENDING" }, data: { status: decision, reviewed_by: userId, reviewed_at: new Date(), comment: comment?.trim() || null } });
      if (updated.count !== 1) throw new Error("RETURN_ALREADY_RESOLVED");
      const row = await tx.return_requests.findUniqueOrThrow({ where: { id }, include });
      await notify(tx, row.user_id, row.order_id, decision === "APPROVED" ? "aprobada" : "rechazada");
      return row;
    });
    return map(result);
  },
  async receive(id: string, userId: string) {
    const result = await transaction(async (tx) => {
      const row = await tx.return_requests.findUnique({ where: { id }, include });
      if (!row) throw new Error("RETURN_NOT_FOUND");
      const updated = await tx.return_requests.updateMany({ where: { id, status: "APPROVED" }, data: { status: "RECEIVED", received_at: new Date(), reviewed_by: userId } });
      if (updated.count !== 1) throw new Error("RETURN_NOT_APPROVED");
      for (const item of row.items) {
        await tx.producto_tallas.update({ where: { id: item.detail.producto_talla_id }, data: { stock: { increment: item.quantity } } });
        await tx.inventory_movements.create({ data: { producto_talla_id: item.detail.producto_talla_id, tipo: "ENTRADA", cantidad: item.quantity, motivo: `Devolución recibida ${id}`, usuario_id: userId } });
      }
      await notify(tx, row.user_id, row.order_id, "recibida; reembolso pendiente");
      return tx.return_requests.findUniqueOrThrow({ where: { id }, include });
    });
    return map(result);
  },
  async refund(id: string) {
    const row = await prisma.return_requests.findUnique({ where: { id }, include: { order: true } });
    if (!row) throw new Error("RETURN_NOT_FOUND");
    if (row.status === "REFUNDED") return map(await prisma.return_requests.findUniqueOrThrow({ where: { id }, include }));
    if (row.status !== "RECEIVED") throw new Error("RETURN_NOT_RECEIVED");
    if (!row.order.mp_payment_id) throw new Error("PAYMENT_NOT_REFUNDABLE");
    const claim = await prisma.return_requests.updateMany({ where: { id, status: "RECEIVED", OR: [{ refund_status: { not: "PROCESSING" } }, { refund_attempted_at: { lt: new Date(Date.now() - 120_000) } }] }, data: { refund_status: "PROCESSING", refund_attempted_at: new Date() } });
    if (claim.count !== 1) throw new Error("REFUND_IN_PROGRESS");
    try {
      const result = await mercadoPagoService.refundPayment(row.order.mp_payment_id, row.amount.toNumber(), id, row.refund_id);
      return await transaction(async (tx) => {
        const updated = await tx.return_requests.updateMany({ where: { id, status: "RECEIVED" }, data: { refund_id: result.id, refund_status: result.approved ? "APPROVED" : "PENDING", status: result.approved ? "REFUNDED" : "RECEIVED", refunded_at: result.approved ? new Date() : null } });
        if (result.approved && updated.count === 1) {
          const order = await tx.ordenes.update({ where: { id: row.order_id }, data: { refunded_amount: { increment: row.amount } } });
          if (order.refunded_amount.gte(order.total)) await tx.ordenes.update({ where: { id: row.order_id }, data: { estado: ORDER_STATUS.RETURNED } });
          await notify(tx, row.user_id, row.order_id, "reembolsada");
        }
        return map(await tx.return_requests.findUniqueOrThrow({ where: { id }, include }));
      });
    } catch (error) {
      await prisma.return_requests.updateMany({ where: { id, status: "RECEIVED", refund_status: "PROCESSING" }, data: { refund_status: "FAILED" } });
      throw error;
    }
  },
};
