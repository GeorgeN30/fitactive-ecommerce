import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { DISCOUNT_REQUEST_STATUS } from "../constants";
import { calculateDiscountedPrice } from "../utils/pricing";

export interface DiscountRequestInput {
  productoTallaIds: string[];
  porcentaje: number;
  motivo: string;
}

export interface DiscountRequestResult {
  id: string;
  status: string;
  percent: number;
  reason: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewComment: string | null;
  product: {
    id: string;
    name: string;
    sizeId: string;
    size: string;
    basePrice: number;
    currentDiscountPercent: number;
    salePrice: number;
  };
  requester: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

type RequestRow = {
  id: string;
  porcentaje: number;
  motivo: string;
  estado: string;
  comentario_admin: string | null;
  solicitado_en: Date;
  revisado_en: Date | null;
  producto_tallas: {
    id: string;
    talla: string;
    stock: number | null;
    descuento_porcentaje: number;
    productos: {
      id: string;
      nombre: string;
      precio: { toNumber: () => number };
    };
  };
  solicitante: { id: string; name: string | null; email: string };
  revisor: { id: string; name: string | null; email: string } | null;
};

function validateInput(data: DiscountRequestInput): string[] {
  if (!data || !Array.isArray(data.productoTallaIds)) {
    throw new Error("SIZE_REQUIRED");
  }

  const ids = Array.from(
    new Set(
      data.productoTallaIds.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  );
  if (ids.length === 0) {
    throw new Error("SIZE_REQUIRED");
  }

  if (!Number.isInteger(data.porcentaje) || data.porcentaje < 1 || data.porcentaje > 90) {
    throw new Error("INVALID_DISCOUNT_PERCENTAGE");
  }

  if (
    typeof data.motivo !== "string" ||
    !data.motivo.trim() ||
    data.motivo.trim().length > 255
  ) {
    throw new Error("DISCOUNT_REASON_REQUIRED");
  }

  return ids;
}

function mapRequest(row: RequestRow): DiscountRequestResult {
  const basePrice = row.producto_tallas.productos.precio.toNumber();
  const currentDiscount = row.producto_tallas.descuento_porcentaje ?? 0;
  return {
    id: row.id,
    status: row.estado,
    percent: row.porcentaje,
    reason: row.motivo,
    createdAt: row.solicitado_en,
    reviewedAt: row.revisado_en,
    reviewComment: row.comentario_admin,
    product: {
      id: row.producto_tallas.productos.id,
      name: row.producto_tallas.productos.nombre,
      sizeId: row.producto_tallas.id,
      size: row.producto_tallas.talla,
      basePrice,
      currentDiscountPercent: currentDiscount,
      salePrice: calculateDiscountedPrice(basePrice, currentDiscount),
    },
    requester: row.solicitante,
    reviewer: row.revisor,
  };
}

const requestInclude = {
  producto_tallas: { include: { productos: true } },
  solicitante: { select: { id: true, name: true, email: true } },
  revisor: { select: { id: true, name: true, email: true } },
} as const;

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
      if (!isSerializationConflict || attempt === maxAttempts) throw error;
    }
  }

  throw new Error("TRANSACTION_RETRY_EXHAUSTED");
}

export const discountService = {
  async createRequest(
    requesterId: string,
    data: DiscountRequestInput,
  ): Promise<DiscountRequestResult[]> {
    const ids = validateInput(data);
    try {
      const created = await runSerializableTransaction(async (tx) => {
        const variants = await tx.producto_tallas.findMany({
          where: { id: { in: ids } },
          include: { productos: true },
        });

        if (variants.length !== ids.length) {
          throw new Error("SIZE_NOT_FOUND");
        }
        if (variants.some((variant) => (variant.descuento_porcentaje ?? 0) > 0)) {
          throw new Error("DISCOUNT_ALREADY_ACTIVE");
        }

        const pending = await tx.discount_requests.findMany({
          where: {
            producto_talla_id: { in: ids },
            estado: DISCOUNT_REQUEST_STATUS.PENDING,
          },
          select: { producto_talla_id: true },
        });
        if (pending.length > 0) {
          throw new Error("DISCOUNT_REQUEST_ALREADY_PENDING");
        }

        for (const productoTallaId of ids) {
          await tx.discount_requests.create({
            data: {
              producto_talla_id: productoTallaId,
              solicitado_por: requesterId,
              porcentaje: data.porcentaje,
              motivo: data.motivo.trim(),
              estado: DISCOUNT_REQUEST_STATUS.PENDING,
            },
          });
        }

        return tx.discount_requests.findMany({
          where: {
            producto_talla_id: { in: ids },
            solicitado_por: requesterId,
            estado: DISCOUNT_REQUEST_STATUS.PENDING,
          },
          include: requestInclude,
          orderBy: { solicitado_en: "desc" },
        });
      });

      return created.map((row) => mapRequest(row as unknown as RequestRow));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("DISCOUNT_REQUEST_ALREADY_PENDING");
      }
      throw error;
    }
  },

  async listForRequester(requesterId: string): Promise<DiscountRequestResult[]> {
    const requests = await prisma.discount_requests.findMany({
      where: { solicitado_por: requesterId },
      include: requestInclude,
      orderBy: { solicitado_en: "desc" },
    });
    return requests.map((row) => mapRequest(row as unknown as RequestRow));
  },

  async listForAdmin(status?: string): Promise<DiscountRequestResult[]> {
    const normalizedStatus = status?.trim().toUpperCase();
    if (
      normalizedStatus &&
      !Object.values(DISCOUNT_REQUEST_STATUS).includes(normalizedStatus as never)
    ) {
      throw new Error("INVALID_DISCOUNT_STATUS");
    }

    const requests = await prisma.discount_requests.findMany({
      where: normalizedStatus ? { estado: normalizedStatus } : undefined,
      include: requestInclude,
      orderBy: { solicitado_en: "desc" },
    });
    return requests.map((row) => mapRequest(row as unknown as RequestRow));
  },

  async reviewRequest(
    requestId: string,
    reviewerId: string,
    decision: string,
    comment?: string,
  ): Promise<DiscountRequestResult> {
    const normalizedDecision = decision?.trim().toUpperCase();
    if (
      normalizedDecision !== DISCOUNT_REQUEST_STATUS.APPROVED &&
      normalizedDecision !== DISCOUNT_REQUEST_STATUS.REJECTED
    ) {
      throw new Error("INVALID_DISCOUNT_DECISION");
    }

    const normalizedComment = comment?.trim() || null;
    if (normalizedComment && normalizedComment.length > 255) {
      throw new Error("DISCOUNT_COMMENT_TOO_LONG");
    }

    const result = await runSerializableTransaction(async (tx) => {
      const request = await tx.discount_requests.findUnique({
        where: { id: requestId },
        include: { producto_tallas: { include: { productos: true } } },
      });
      if (!request) {
        throw new Error("DISCOUNT_REQUEST_NOT_FOUND");
      }
      if (request.estado !== DISCOUNT_REQUEST_STATUS.PENDING) {
        throw new Error("DISCOUNT_REQUEST_ALREADY_RESOLVED");
      }

      const updated = await tx.discount_requests.updateMany({
        where: {
          id: requestId,
          estado: DISCOUNT_REQUEST_STATUS.PENDING,
        },
        data: {
          estado: normalizedDecision,
          revisado_por: reviewerId,
          comentario_admin: normalizedComment,
          revisado_en: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new Error("DISCOUNT_REQUEST_ALREADY_RESOLVED");
      }

      if (normalizedDecision === DISCOUNT_REQUEST_STATUS.APPROVED) {
        const variant = await tx.producto_tallas.updateMany({
          where: {
            id: request.producto_talla_id,
            descuento_porcentaje: 0,
          },
          data: { descuento_porcentaje: request.porcentaje },
        });
        if (variant.count !== 1) {
          throw new Error("DISCOUNT_ALREADY_ACTIVE");
        }
      }

      return tx.discount_requests.findUniqueOrThrow({
        where: { id: requestId },
        include: requestInclude,
      });
    });

    return mapRequest(result as unknown as RequestRow);
  },

  async revertRequest(
    requestId: string,
    reviewerId: string,
  ): Promise<DiscountRequestResult> {
    const result = await runSerializableTransaction(async (tx) => {
      const request = await tx.discount_requests.findUnique({
        where: { id: requestId },
        include: { producto_tallas: { include: { productos: true } } },
      });
      if (!request) {
        throw new Error("DISCOUNT_REQUEST_NOT_FOUND");
      }
      if (request.estado !== DISCOUNT_REQUEST_STATUS.APPROVED) {
        throw new Error("DISCOUNT_NOT_ACTIVE");
      }

      const variant = await tx.producto_tallas.updateMany({
        where: {
          id: request.producto_talla_id,
          descuento_porcentaje: request.porcentaje,
        },
        data: { descuento_porcentaje: 0 },
      });
      if (variant.count !== 1) {
        throw new Error("DISCOUNT_NOT_ACTIVE");
      }

      const requestUpdate = await tx.discount_requests.updateMany({
        where: {
          id: requestId,
          estado: DISCOUNT_REQUEST_STATUS.APPROVED,
        },
        data: {
          estado: DISCOUNT_REQUEST_STATUS.REVERTED,
          revisado_por: reviewerId,
          revisado_en: new Date(),
        },
      });
      if (requestUpdate.count !== 1) {
        throw new Error("DISCOUNT_NOT_ACTIVE");
      }

      return tx.discount_requests.findUniqueOrThrow({
        where: { id: requestId },
        include: requestInclude,
      });
    });

    return mapRequest(result as unknown as RequestRow);
  },
};
