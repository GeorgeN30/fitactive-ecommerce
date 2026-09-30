import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ORDER_STATUS } from "../constants";
import { calculateDiscountedPrice, roundToCents } from "../utils/pricing";
import { notifications } from "./notifications";

export interface OrderEntryInput {
  productoTallaId: string;
  cantidad: number;
}

export interface OrderCheckoutDetails {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingDistrict?: string;
  shippingCity?: string;
  shippingReference?: string;
}

export interface OrderEntryResult {
  productoTallaId: string;
  nombre: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  imagenUrl: string | null;
}

export interface OrderResult {
  id: string;
  numero: string;
  total: number;
  estado: string;
  fechaOrden: Date | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingCity: string | null;
  shippingReference: string | null;
  entries: OrderEntryResult[];
}

const ORDER_NUMBER_SUFFIX_LENGTH = 6;
const ORDER_RESERVATION_MINUTES = 30;

function buildOrderNumber(orderId: string): string {
  const year = new Date().getFullYear();
  const suffix = orderId
    .replace(/-/g, "")
    .slice(0, ORDER_NUMBER_SUFFIX_LENGTH)
    .toUpperCase();
  return `ORD-${year}-${suffix}`;
}

function validateEntries(entries: OrderEntryInput[]): void {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.productoTallaId !== "string" ||
      entry.productoTallaId.length === 0
    ) {
      throw new Error("INVALID_ENTRY");
    }
    if (!Number.isInteger(entry.cantidad) || entry.cantidad <= 0) {
      throw new Error("INVALID_QUANTITY");
    }
  }
}

function normalizeCheckoutValue(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function consolidateEntries(entries: OrderEntryInput[]): OrderEntryInput[] {
  const quantities = new Map<string, number>();
  for (const entry of entries) {
    quantities.set(
      entry.productoTallaId,
      (quantities.get(entry.productoTallaId) ?? 0) + entry.cantidad,
    );
  }
  return Array.from(quantities.entries()).map(([productoTallaId, cantidad]) => ({
    productoTallaId,
    cantidad,
  }));
}

async function runSerializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const isSerializationConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (!isSerializationConflict || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("TRANSACTION_RETRY_EXHAUSTED");
}

function mapDetail(detail: {
  producto_talla_id: string;
  cantidad: number;
  precio_unitario: { toNumber: () => number };
  producto_tallas: { talla: string; productos: { nombre: string; imagen_url?: string | null } };
}): OrderEntryResult {
  const precioUnitario = detail.precio_unitario.toNumber();
  return {
    productoTallaId: detail.producto_talla_id,
    nombre: detail.producto_tallas.productos.nombre,
    talla: detail.producto_tallas.talla,
    cantidad: detail.cantidad,
    precioUnitario,
    subtotal: roundToCents(precioUnitario * detail.cantidad),
    imagenUrl: detail.producto_tallas.productos.imagen_url ?? null,
  };
}

export const orderService = {
  async createOrder(
    userId: string,
    rawEntries: OrderEntryInput[],
    tryOnSessionId?: string,
    checkoutDetails?: OrderCheckoutDetails,
  ): Promise<OrderResult> {
    validateEntries(rawEntries);
    const entries = consolidateEntries(rawEntries);

    const orderId = randomUUID();

    const result = await runSerializableTransaction(async (tx) => {
      const computed: Omit<OrderEntryResult, "nombre" | "talla" | "imagenUrl">[] = [];
      let total = 0;

      for (const entry of entries) {
        const productoTalla = await tx.producto_tallas.findUnique({
          where: { id: entry.productoTallaId },
          include: { productos: true },
        });

        if (!productoTalla) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        if (
          productoTalla.stock === null ||
          productoTalla.stock < entry.cantidad
        ) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const precioBase = productoTalla.productos.precio.toNumber();
        const precioUnitario = calculateDiscountedPrice(
          precioBase,
          productoTalla.descuento_porcentaje ?? 0,
        );
        total = roundToCents(total + precioUnitario * entry.cantidad);

        computed.push({
          productoTallaId: entry.productoTallaId,
          cantidad: entry.cantidad,
          precioUnitario,
          subtotal: roundToCents(precioUnitario * entry.cantidad),
        });
      }

      for (const entry of entries) {
        const updated = await tx.producto_tallas.updateMany({
          where: {
            id: entry.productoTallaId,
            stock: { gte: entry.cantidad },
          },
          data: { stock: { decrement: entry.cantidad } },
        });

        if (updated.count !== 1) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const created = await tx.ordenes.create({
        data: {
          id: orderId,
          usuario_id: userId,
          numero: buildOrderNumber(orderId),
          total,
          estado: ORDER_STATUS.PENDING,
          reservation_expires_at: new Date(Date.now() + ORDER_RESERVATION_MINUTES * 60 * 1000),
          customer_name: normalizeCheckoutValue(checkoutDetails?.customerName, 150),
          customer_email: normalizeCheckoutValue(checkoutDetails?.customerEmail, 255),
          customer_phone: normalizeCheckoutValue(checkoutDetails?.customerPhone, 40),
          shipping_address: normalizeCheckoutValue(checkoutDetails?.shippingAddress, 255),
          shipping_district: normalizeCheckoutValue(checkoutDetails?.shippingDistrict, 120),
          shipping_city: normalizeCheckoutValue(checkoutDetails?.shippingCity, 120),
          shipping_reference: normalizeCheckoutValue(checkoutDetails?.shippingReference, 255),
          orden_detalles: {
            create: computed.map((detail) => ({
              producto_talla_id: detail.productoTallaId,
              cantidad: detail.cantidad,
              precio_unitario: detail.precioUnitario,
            })),
          },
        },
      });

      const details = await tx.orden_detalles.findMany({
        where: { orden_id: created.id },
        include: { producto_tallas: { include: { productos: true } } },
      });

      if (tryOnSessionId) {
        const productIds = details.map((detail) => detail.producto_tallas.producto_id);
        const triedProducts = await tx.virtual_tryon_events.findMany({
          where: {
            sesion_id: tryOnSessionId,
            tipo: "try_on",
            producto_id: { in: productIds },
          },
          select: { producto_id: true, compatibilidad: true, genero: true },
        });
        const triedByProduct = new Map(
          triedProducts
            .filter((event) => event.producto_id)
            .map((event) => [event.producto_id as string, event]),
        );
        const purchaseEvents = details
          .filter((detail) => triedByProduct.has(detail.producto_tallas.producto_id))
          .map((detail) => {
            const tried = triedByProduct.get(detail.producto_tallas.producto_id);
            return {
              usuario_id: userId,
              producto_id: detail.producto_tallas.producto_id,
              orden_id: created.id,
              sesion_id: tryOnSessionId,
              tipo: "purchase",
              talla: detail.producto_tallas.talla,
              genero: tried?.genero || null,
              compatibilidad: tried?.compatibilidad || null,
            };
          });
        if (purchaseEvents.length > 0) {
          await tx.virtual_tryon_events.createMany({ data: purchaseEvents });
        }
      }

      return { created, details };
    });

    return {
      id: result.created.id,
      numero: result.created.numero || result.created.id,
      total: result.created.total.toNumber(),
      estado: result.created.estado || ORDER_STATUS.PENDING,
      fechaOrden: result.created.fecha_orden,
      customerName: result.created.customer_name,
      customerEmail: result.created.customer_email,
      customerPhone: result.created.customer_phone,
      shippingAddress: result.created.shipping_address,
      shippingDistrict: result.created.shipping_district,
      shippingCity: result.created.shipping_city,
      shippingReference: result.created.shipping_reference,
      entries: result.details.map(mapDetail),
    };
  },

  async listUserOrders(userId: string): Promise<OrderResult[]> {
    const orders = await prisma.ordenes.findMany({
      where: { usuario_id: userId },
      orderBy: { fecha_orden: "desc" },
      include: {
        orden_detalles: {
          include: { producto_tallas: { include: { productos: true } } },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      numero: order.numero || order.id,
      total: order.total.toNumber(),
      estado: order.estado || ORDER_STATUS.PENDING,
      fechaOrden: order.fecha_orden,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      shippingDistrict: order.shipping_district,
      shippingCity: order.shipping_city,
      shippingReference: order.shipping_reference,
      entries: order.orden_detalles.map(mapDetail),
    }));
  },

  async releaseExpiredPendingOrders(): Promise<number> {
    const now = new Date();
    const expired = await prisma.ordenes.findMany({
      where: {
        estado: ORDER_STATUS.PENDING,
        reservation_expires_at: { lte: now },
      },
      select: {
        id: true,
        usuario_id: true,
        numero: true,
        orden_detalles: { select: { producto_talla_id: true, cantidad: true } },
      },
    });

    let released = 0;
    for (const candidate of expired) {
      const didRelease = await prisma.$transaction(async (tx) => {
        const updated = await tx.ordenes.updateMany({
          where: {
            id: candidate.id,
            estado: ORDER_STATUS.PENDING,
            reservation_expires_at: { lte: now },
          },
          data: {
            estado: ORDER_STATUS.CANCELLED,
            mp_status: "expired",
            mp_status_detail: "reservation_expired",
            reservation_expires_at: null,
          },
        });
        if (updated.count !== 1) return false;
        for (const detail of candidate.orden_detalles) {
          await tx.producto_tallas.update({
            where: { id: detail.producto_talla_id },
            data: { stock: { increment: detail.cantidad } },
          });
        }
        return true;
      });

      if (didRelease) {
        released += 1;
        void notifications.notifyPaymentStatus({
          orderId: candidate.id,
          orderNumber: candidate.numero || candidate.id,
          customerId: candidate.usuario_id,
          orderStatus: ORDER_STATUS.CANCELLED,
          paymentStatus: "expired",
        });
      }
    }
    return released;
  },
};
