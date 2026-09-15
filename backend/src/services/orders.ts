import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ORDER_STATUS } from "../constants";
import { calculateDiscountedPrice, roundToCents } from "../utils/pricing";

export interface OrderEntryInput {
  productoTallaId: string;
  cantidad: number;
}

export interface OrderEntryResult {
  productoTallaId: string;
  nombre: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrderResult {
  id: string;
  numero: string;
  total: number;
  estado: string;
  fechaOrden: Date | null;
  entries: OrderEntryResult[];
}

const ORDER_NUMBER_SUFFIX_LENGTH = 6;

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
  producto_tallas: { talla: string; productos: { nombre: string } };
}): OrderEntryResult {
  const precioUnitario = detail.precio_unitario.toNumber();
  return {
    productoTallaId: detail.producto_talla_id,
    nombre: detail.producto_tallas.productos.nombre,
    talla: detail.producto_tallas.talla,
    cantidad: detail.cantidad,
    precioUnitario,
    subtotal: roundToCents(precioUnitario * detail.cantidad),
  };
}

export const orderService = {
  async createOrder(
    userId: string,
    rawEntries: OrderEntryInput[]
  ): Promise<OrderResult> {
    validateEntries(rawEntries);
    const entries = consolidateEntries(rawEntries);

    const orderId = randomUUID();

    const result = await runSerializableTransaction(async (tx) => {
      const computed: Omit<OrderEntryResult, "nombre" | "talla">[] = [];
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

      return { created, details };
    });

    return {
      id: result.created.id,
      numero: result.created.numero || result.created.id,
      total: result.created.total.toNumber(),
      estado: result.created.estado || ORDER_STATUS.PENDING,
      fechaOrden: result.created.fecha_orden,
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
      entries: order.orden_detalles.map(mapDetail),
    }));
  },
};
