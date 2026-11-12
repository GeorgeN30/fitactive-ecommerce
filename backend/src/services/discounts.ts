import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { DISCOUNT_REQUEST_STATUS } from "../constants";
import { resolveVariantPrice } from "../utils/pricing";

export interface DiscountRequestInput {
  productoTallaIds: string[];
  porcentaje: number;
  motivo: string;
  duracionHoras?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface DiscountRequestResult {
  id: string;
  status: string;
  percent: number;
  reason: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewComment: string | null;
  durationHours: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  offerStatus: "PENDING" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "REJECTED" | "REVERTED";
  canRevert: boolean;
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
  duracion_horas?: number | null;
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
  producto_tallas: {
    id: string;
    talla: string;
    stock: number | null;
    descuento_porcentaje: number;
    descuento_inicio?: Date | null;
    descuento_fin?: Date | null;
    descuento_solicitud_id?: string | null;
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

  if (data.duracionHoras !== undefined && ![24, 72, 168].includes(data.duracionHoras)) {
    throw new Error("INVALID_DISCOUNT_DURATION");
  }
  if (data.duracionHoras !== undefined && (data.fechaInicio || data.fechaFin)) {
    throw new Error("INVALID_DISCOUNT_WINDOW");
  }
  if (data.fechaInicio !== undefined || data.fechaFin !== undefined) {
    const start = data.fechaInicio ? new Date(data.fechaInicio) : new Date();
    const end = typeof data.fechaFin === "string" ? new Date(data.fechaFin) : new Date(NaN);
    if (typeof data.fechaInicio !== "undefined" && typeof data.fechaInicio !== "string" ||
        !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
        end <= start || end <= new Date()) throw new Error("INVALID_DISCOUNT_WINDOW");
  }

  return ids;
}

function mapRequest(row: RequestRow): DiscountRequestResult {
  const basePrice = row.producto_tallas.productos.precio.toNumber();
  const now = new Date();
  const pricing = resolveVariantPrice(basePrice, row.producto_tallas, now);
  const currentDiscount = pricing.discountPercent;
  return {
    id: row.id,
    status: row.estado,
    percent: row.porcentaje,
    reason: row.motivo,
    createdAt: row.solicitado_en,
    reviewedAt: row.revisado_en,
    reviewComment: row.comentario_admin,
    durationHours: row.duracion_horas ?? null,
    startsAt: row.fecha_inicio ?? null,
    endsAt: row.fecha_fin ?? null,
    canRevert: row.estado === "APPROVED" && row.producto_tallas.descuento_porcentaje > 0 &&
      (row.producto_tallas.descuento_solicitud_id === row.id ||
        !row.producto_tallas.descuento_solicitud_id && !row.producto_tallas.descuento_fin),
    offerStatus: row.estado !== "APPROVED" ? row.estado as DiscountRequestResult["offerStatus"]
      : row.fecha_fin && row.fecha_fin <= now ? "EXPIRED"
      : row.fecha_inicio && row.fecha_inicio > now ? "SCHEDULED" : "ACTIVE",
    product: {
      id: row.producto_tallas.productos.id,
      name: row.producto_tallas.productos.nombre,
      sizeId: row.producto_tallas.id,
      size: row.producto_tallas.talla,
      basePrice,
      currentDiscountPercent: currentDiscount,
      salePrice: pricing.salePrice,
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
  const maxAttempts = 8;

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
      await new Promise((resolve) => setTimeout(resolve, Math.min(4 * 2 ** (attempt - 1), 80)));
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
        if (variants.some((variant) => (variant.descuento_porcentaje ?? 0) > 0 &&
            (!variant.descuento_fin || variant.descuento_fin > new Date()))) {
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
              duracion_horas: data.duracionHoras ?? (data.fechaFin ? null : 72),
              fecha_inicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
              fecha_fin: data.fechaFin ? new Date(data.fechaFin) : null,
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
    const normalizedDecision = typeof decision === "string" ? decision.trim().toUpperCase() : "";
    if (
      normalizedDecision !== DISCOUNT_REQUEST_STATUS.APPROVED &&
      normalizedDecision !== DISCOUNT_REQUEST_STATUS.REJECTED
    ) {
      throw new Error("INVALID_DISCOUNT_DECISION");
    }

    if (comment !== undefined && typeof comment !== "string") throw new Error("DISCOUNT_COMMENT_TOO_LONG");
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
      const now = new Date();
      const startsAt = request.fecha_inicio && request.fecha_inicio > now ? request.fecha_inicio : now;
      const endsAt = request.duracion_horas
        ? new Date(startsAt.getTime() + request.duracion_horas * 3_600_000)
        : request.fecha_fin;
      if (normalizedDecision === DISCOUNT_REQUEST_STATUS.APPROVED && endsAt && endsAt <= now) {
        throw new Error("INVALID_DISCOUNT_WINDOW");
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
          ...(normalizedDecision === DISCOUNT_REQUEST_STATUS.APPROVED
            ? { fecha_inicio: startsAt, fecha_fin: endsAt } : {}),
        },
      });
      if (updated.count !== 1) {
        throw new Error("DISCOUNT_REQUEST_ALREADY_RESOLVED");
      }

      if (normalizedDecision === DISCOUNT_REQUEST_STATUS.APPROVED) {
        const variant = await tx.producto_tallas.updateMany({
          where: {
            id: request.producto_talla_id,
            OR: [{ descuento_porcentaje: 0 }, { descuento_fin: { lte: now } }],
          },
          data: { descuento_porcentaje: request.porcentaje, descuento_inicio: startsAt,
            descuento_fin: endsAt, descuento_solicitud_id: request.id },
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
          OR: [{ descuento_solicitud_id: requestId },
            { descuento_solicitud_id: null, descuento_fin: null }],
        },
        data: { descuento_porcentaje: 0, descuento_inicio: null, descuento_fin: null, descuento_solicitud_id: null },
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
