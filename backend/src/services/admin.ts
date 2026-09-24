import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  ALLOWED_ORDER_STATUSES,
  LOW_STOCK_THRESHOLD,
  MOVEMENT_TYPE,
  ORDER_STATUS,
  ROLES,
} from "../constants";
import { calculateDiscountedPrice, roundToCents } from "../utils/pricing";
import { deleteProductImages, prepareProductImages } from "./productImages";

export interface ProductTallaInput {
  talla: string;
  stock?: number;
  rangoCmMin?: number | null;
  rangoCmMax?: number | null;
}

export interface ProductInput {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  precio: number;
  imagenUrl?: string;
  imageUrls?: string[];
  genero?: string;
  tallas?: ProductTallaInput[];
}

export interface ProductResult {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  precio: number;
  imagenUrl: string | null;
  imageUrls: string[];
  genero: string | null;
  fechaCreacion: Date | null;
  tallas: {
    id: string;
    talla: string;
    stock: number;
    discountPercent: number;
    salePrice: number;
    rangoCmMin: number | null;
    rangoCmMax: number | null;
  }[];
  totalStock: number;
}

export interface OrderResult {
  id: string;
  numero: string;
  estado: string;
  total: number;
  fechaOrden: Date | null;
  customer: { id: string; email: string; name: string | null };
  items: {
    productoId: string;
    nombre: string;
    talla: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

export interface CustomerResult {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: string;
  blocked: boolean;
  points: number;
  fechaCreacion: Date | null;
  medidaPecho: number | null;
  medidaCintura: number | null;
  medidaCadera: number | null;
  orders: number;
  spent: number;
}

export interface MovementResult {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  fecha: Date | null;
  producto: string;
  talla: string;
  responsable: string;
}

export interface MovementInput {
  productoTallaId?: string;
  productoId?: string;
  talla?: string;
  tipo: string;
  cantidad: number;
  motivo: string;
}

export type FinancePeriod = "week" | "month" | "quarter" | "year";

export interface FinanceSummaryResult {
  period: FinancePeriod;
  periodLabel: string;
  revenue: number;
  ordersCount: number;
  returnsCount: number;
  monthlyRevenue: { label: string; value: number }[];
  categories: { name: string; amount: number; units: number; percentage: number }[];
  transactions: {
    reference: string;
    description: string;
    date: string;
    amount: number;
    type: "Ingreso" | "Devolución";
  }[];
  expenses: null;
  paymentMethods: never[];
}

const FINANCE_PERIOD_LABELS: Record<FinancePeriod, string> = {
  week: "Últimos 7 días",
  month: "Últimos 12 meses",
  quarter: "Últimos 4 trimestres",
  year: "Últimos 4 años",
};

function startOfPeriodBucket(date: Date, period: FinancePeriod): Date {
  if (period === "week") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  if (period === "year") {
    return new Date(date.getFullYear(), 0, 1);
  }
  if (period === "quarter") {
    return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function financeBucketKey(date: Date, period: FinancePeriod): string {
  const bucket = startOfPeriodBucket(date, period);
  return `${bucket.getFullYear()}-${String(bucket.getMonth() + 1).padStart(2, "0")}-${String(bucket.getDate()).padStart(2, "0")}`;
}

function financeBuckets(now: Date, period: FinancePeriod): { key: string; label: string }[] {
  const buckets: { key: string; label: string }[] = [];
  const count = period === "week" ? 7 : period === "year" ? 4 : period === "quarter" ? 4 : 12;

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    let date: Date;
    if (period === "week") {
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    } else if (period === "year") {
      date = new Date(now.getFullYear() - offset, 0, 1);
    } else if (period === "quarter") {
      date = new Date(now.getFullYear(), now.getMonth() - offset * 3, 1);
    } else {
      date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    }

    const label = period === "week"
      ? date.toLocaleDateString("es-PE", { weekday: "short" })
      : period === "year"
        ? String(date.getFullYear())
        : period === "quarter"
          ? `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
          : date.toLocaleDateString("es-PE", { month: "short" });
    buckets.push({ key: financeBucketKey(date, period), label });
  }
  return buckets;
}

const isPrismaP2003 = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";

function mapProduct(prod: {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  precio: { toNumber: () => number };
  imagen_url: string | null;
  producto_imagenes?: { url: string; orden: number }[];
  genero: string | null;
  fecha_creacion: Date | null;
  producto_tallas: {
    id: string;
    talla: string;
    stock: number | null;
    descuento_porcentaje?: number | null;
    rango_cm_min?: { toNumber: () => number } | null;
    rango_cm_max?: { toNumber: () => number } | null;
  }[];
}): ProductResult {
  const basePrice = prod.precio.toNumber();
  const tallas = prod.producto_tallas.map((t) => ({
    id: t.id,
    talla: t.talla,
    stock: t.stock ?? 0,
    discountPercent: t.descuento_porcentaje ?? 0,
    salePrice: calculateDiscountedPrice(basePrice, t.descuento_porcentaje ?? 0),
    rangoCmMin: t.rango_cm_min?.toNumber() ?? null,
    rangoCmMax: t.rango_cm_max?.toNumber() ?? null,
  }));
  const imageUrls = (prod.producto_imagenes || [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((image) => image.url);
  return {
    id: prod.id,
    nombre: prod.nombre,
    descripcion: prod.descripcion,
    categoria: prod.categoria,
    marca: prod.marca,
    precio: prod.precio.toNumber(),
    imagenUrl: prod.imagen_url,
    imageUrls: imageUrls.length > 0
      ? imageUrls
      : prod.imagen_url
        ? [prod.imagen_url]
        : [],
    genero: prod.genero,
    fechaCreacion: prod.fecha_creacion,
    tallas,
    totalStock: tallas.reduce((sum, t) => sum + t.stock, 0),
  };
}

function validateProductTallas(tallas: ProductTallaInput[]): void {
  const seenSizes = new Set<string>();
  for (const talla of tallas) {
    if (!talla || typeof talla.talla !== "string" || !talla.talla.trim()) {
      throw new Error("SIZE_REQUIRED");
    }
    const normalizedSize = talla.talla.trim();
    if (seenSizes.has(normalizedSize)) {
      throw new Error("DUPLICATE_SIZE");
    }
    seenSizes.add(normalizedSize);
    if (
      talla.stock !== undefined &&
      (!Number.isInteger(talla.stock) || talla.stock < 0)
    ) {
      throw new Error("INVALID_QUANTITY");
    }
    if (talla.rangoCmMin !== undefined && talla.rangoCmMin !== null && (!Number.isFinite(talla.rangoCmMin) || talla.rangoCmMin < 0)) {
      throw new Error("INVALID_MEASUREMENT_RANGE");
    }
    if (talla.rangoCmMax !== undefined && talla.rangoCmMax !== null && (!Number.isFinite(talla.rangoCmMax) || talla.rangoCmMax < 0)) {
      throw new Error("INVALID_MEASUREMENT_RANGE");
    }
    if (talla.rangoCmMin != null && talla.rangoCmMax != null && talla.rangoCmMin > talla.rangoCmMax) {
      throw new Error("INVALID_MEASUREMENT_RANGE");
    }
  }
}

function validateProductInput(data: ProductInput | Partial<ProductInput>): void {
  if (!data || typeof data !== "object") {
    throw new Error("NAME_REQUIRED");
  }
  if ("nombre" in data && data.nombre !== undefined) {
    if (typeof data.nombre !== "string" || !data.nombre.trim()) {
      throw new Error("NAME_REQUIRED");
    }
  }
  if (
    "precio" in data &&
    data.precio !== undefined &&
    (typeof data.precio !== "number" || !Number.isFinite(data.precio) || data.precio < 0)
  ) {
    throw new Error("INVALID_PRICE");
  }
  if (data.tallas !== undefined) {
    if (!Array.isArray(data.tallas)) {
      throw new Error("SIZE_REQUIRED");
    }
    if (data.tallas.length === 0) {
      throw new Error("SIZE_REQUIRED");
    }
    validateProductTallas(data.tallas);
  }
  if (data.imageUrls !== undefined) {
    if (!Array.isArray(data.imageUrls)) {
      throw new Error("INVALID_IMAGE");
    }
    if (data.imageUrls.length > 5) {
      throw new Error("TOO_MANY_IMAGES");
    }
  }
}

function requestedImageUrls(data: ProductInput | Partial<ProductInput>): string[] | undefined {
  if (data.imageUrls !== undefined) return data.imageUrls;
  if (data.imagenUrl !== undefined) return data.imagenUrl ? [data.imagenUrl] : [];
  return undefined;
}

export const adminService = {
  async listProducts(): Promise<ProductResult[]> {
    const products = await prisma.productos.findMany({
      include: {
        producto_tallas: { orderBy: { talla: "asc" } },
        producto_imagenes: { orderBy: { orden: "asc" } },
      },
      orderBy: { fecha_creacion: "desc" },
    });
    return products.map(mapProduct);
  },

  async createProduct(data: ProductInput): Promise<ProductResult> {
    validateProductInput(data);
    if (typeof data.nombre !== "string" || typeof data.precio !== "number") {
      throw new Error("NAME_REQUIRED");
    }

    const productId = randomUUID();
    const imageUrls = requestedImageUrls(data) || [];
    const storedImageUrls = await prepareProductImages(productId, imageUrls);

    try {
      const created = await prisma.productos.create({
        data: {
          id: productId,
          nombre: data.nombre.trim(),
          descripcion: data.descripcion || null,
          categoria: data.categoria || null,
          marca: data.marca || null,
          precio: data.precio,
          imagen_url: storedImageUrls[0] || null,
          genero: data.genero || null,
          producto_tallas: {
            create: (data.tallas || []).map((t) => ({
              talla: t.talla.trim(),
              stock: t.stock ?? 0,
              rango_cm_min: t.rangoCmMin ?? null,
              rango_cm_max: t.rangoCmMax ?? null,
            })),
          },
          producto_imagenes: {
            create: storedImageUrls.map((url, orden) => ({ url, orden })),
          },
        },
        include: {
          producto_tallas: { orderBy: { talla: "asc" } },
          producto_imagenes: { orderBy: { orden: "asc" } },
        },
      });

      return mapProduct(created);
    } catch (error) {
      await deleteProductImages(storedImageUrls);
      throw error;
    }
  },

  async updateProduct(id: string, data: Partial<ProductInput>): Promise<ProductResult> {
    validateProductInput(data);
    const existing = await prisma.productos.findUnique({
      where: { id },
      include: { producto_tallas: true, producto_imagenes: true },
    });
    if (!existing) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const requestedImages = requestedImageUrls(data);
    const storedImageUrls = requestedImages !== undefined
      ? await prepareProductImages(id, requestedImages)
      : undefined;

    try {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.productos.update({
          where: { id },
          data: {
            nombre: data.nombre !== undefined ? data.nombre.trim() : existing.nombre,
            descripcion: data.descripcion !== undefined ? data.descripcion : existing.descripcion,
            categoria: data.categoria !== undefined ? data.categoria : existing.categoria,
            marca: data.marca !== undefined ? data.marca : existing.marca,
            precio: data.precio !== undefined ? data.precio : existing.precio,
            imagen_url: storedImageUrls !== undefined
              ? storedImageUrls[0] || null
              : existing.imagen_url,
            genero: data.genero !== undefined ? data.genero : existing.genero,
          },
        });

        if (storedImageUrls !== undefined) {
          await tx.producto_imagenes.deleteMany({ where: { producto_id: id } });
          if (storedImageUrls.length > 0) {
            await tx.producto_imagenes.createMany({
              data: storedImageUrls.map((url, orden) => ({ producto_id: id, url, orden })),
            });
          }
        }

        if (data.tallas !== undefined) {
          const requestedSizeNames = new Set(
            data.tallas.map((tallaInput) => tallaInput.talla.trim()),
          );
          for (const tallaInput of data.tallas) {
            const normalizedSize = tallaInput.talla.trim();
            const match = existing.producto_tallas.find(
              (t) => t.talla === normalizedSize,
            );
            if (match) {
              const updatedStock = await tx.producto_tallas.updateMany({
                where: { id: match.id, stock: match.stock },
                data: {
                  stock: tallaInput.stock ?? match.stock,
                  rango_cm_min: tallaInput.rangoCmMin !== undefined ? tallaInput.rangoCmMin : match.rango_cm_min,
                  rango_cm_max: tallaInput.rangoCmMax !== undefined ? tallaInput.rangoCmMax : match.rango_cm_max,
                },
              });
              if (updatedStock.count !== 1) {
                throw new Error("STOCK_CONFLICT");
              }
            } else {
              await tx.producto_tallas.create({
                data: {
                  producto_id: id,
                  talla: normalizedSize,
                  stock: tallaInput.stock ?? 0,
                  rango_cm_min: tallaInput.rangoCmMin ?? null,
                  rango_cm_max: tallaInput.rangoCmMax ?? null,
                },
              });
            }
          }

          const removedSizes = existing.producto_tallas.filter(
            (talla) => !requestedSizeNames.has(talla.talla),
          );
          if (removedSizes.length > 0) {
            const removedIds = removedSizes.map((talla) => talla.id);
            const [ordersUsingSize, discountsUsingSize] = await Promise.all([
              tx.orden_detalles.findMany({
                where: { producto_talla_id: { in: removedIds } },
                select: { producto_talla_id: true },
              }),
              tx.discount_requests.findMany({
                where: { producto_talla_id: { in: removedIds } },
                select: { producto_talla_id: true },
              }),
            ]);
            const protectedIds = new Set([
              ...ordersUsingSize.map((item) => item.producto_talla_id),
              ...discountsUsingSize.map((item) => item.producto_talla_id),
            ]);
            const deletableIds = removedIds.filter((id) => !protectedIds.has(id));
            if (deletableIds.length > 0) {
              await tx.producto_tallas.deleteMany({ where: { id: { in: deletableIds } } });
            }
            const protectedRemovedIds = removedIds.filter((id) => protectedIds.has(id));
            if (protectedRemovedIds.length > 0) {
              // An order or discount keeps the variant for referential integrity;
              // setting it to zero hides it from the customer without deleting history.
              await tx.producto_tallas.updateMany({
                where: { id: { in: protectedRemovedIds } },
                data: { stock: 0 },
              });
            }
          }
        }

        return tx.productos.findUniqueOrThrow({
          where: { id },
          include: {
            producto_tallas: { orderBy: { talla: "asc" } },
            producto_imagenes: { orderBy: { orden: "asc" } },
          },
        });
      });

      if (storedImageUrls !== undefined) {
        await deleteProductImages(
          existing.producto_imagenes
            .filter((image) => !storedImageUrls.includes(image.url))
            .map((image) => image.url),
        );
      }
      return mapProduct(updated);
    } catch (error) {
      if (storedImageUrls !== undefined) await deleteProductImages(storedImageUrls);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const existing = await prisma.productos.findUnique({
      where: { id },
      select: { producto_imagenes: { select: { url: true } } },
    });
    if (!existing) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    try {
      await prisma.productos.delete({ where: { id } });
      await deleteProductImages(existing.producto_imagenes.map((image) => image.url)).catch(
        (error: unknown) => console.error("Product image cleanup failed:", error),
      );
      return { success: true };
    } catch (err: unknown) {
      if (isPrismaP2003(err)) {
        throw new Error("PRODUCT_HAS_ORDERS");
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new Error("PRODUCT_NOT_FOUND");
      }
      throw err;
    }
  },

  async listOrders(): Promise<OrderResult[]> {
    const orders = await prisma.ordenes.findMany({
      orderBy: { fecha_orden: "desc" },
      include: {
        usuarios: { select: { id: true, email: true, name: true } },
        orden_detalles: {
          include: {
            producto_tallas: { include: { productos: true } },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      numero: order.numero || order.id,
      estado: order.estado || "pending",
      total: order.total.toNumber(),
      fechaOrden: order.fecha_orden,
      customer: {
        id: order.usuarios.id,
        email: order.usuarios.email,
        name: order.usuarios.name,
      },
      items: order.orden_detalles.map((detail) => {
        const precioUnitario = detail.precio_unitario.toNumber();
        return {
          productoId: detail.producto_tallas.productos.id,
          nombre: detail.producto_tallas.productos.nombre,
          talla: detail.producto_tallas.talla,
          cantidad: detail.cantidad,
          precioUnitario,
          subtotal: roundToCents(precioUnitario * detail.cantidad),
        };
      }),
    }));
  },

  async updateOrderStatus(id: string, estado: string): Promise<OrderResult> {
    if (!estado || typeof estado !== "string") {
      throw new Error("STATUS_REQUIRED");
    }

    const allowed = new Set(ALLOWED_ORDER_STATUSES);
    if (!allowed.has(estado)) {
      throw new Error("INVALID_STATUS");
    }

    const existing = await prisma.ordenes.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const currentStatus = (existing.estado || ORDER_STATUS.PENDING).toLowerCase();
    const allowedTransitions: Record<string, string[]> = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PREPARING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED],
      [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.RETURNED],
      [ORDER_STATUS.CANCELLED]: [],
      [ORDER_STATUS.RETURNED]: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(estado)) {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    await prisma.ordenes.update({
      where: { id },
      data: { estado },
    });

    const orders = await this.listOrders();
    const updated = orders.find((order) => order.id === id);
    if (!updated) {
      throw new Error("ORDER_NOT_FOUND");
    }
    return updated;
  },

  async updateInventoryOrderStatus(id: string, estado: string): Promise<OrderResult> {
    const allowedTransitions: Record<string, string[]> = {
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING],
      [ORDER_STATUS.PREPARING]: [ORDER_STATUS.SHIPPED],
    };

    if (!estado || !Object.values(allowedTransitions).flat().includes(estado)) {
      throw new Error("INVENTORY_STATUS_FORBIDDEN");
    }

    const existing = await prisma.ordenes.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const currentStatus = (existing.estado || ORDER_STATUS.PENDING).toLowerCase();
    if (!allowedTransitions[currentStatus]?.includes(estado)) {
      throw new Error("INVALID_INVENTORY_STATUS_TRANSITION");
    }

    await prisma.ordenes.update({
      where: { id },
      data: { estado },
    });

    const orders = await this.listOrders();
    const updated = orders.find((order) => order.id === id);
    if (!updated) {
      throw new Error("ORDER_NOT_FOUND");
    }
    return updated;
  },

  async listCustomers(): Promise<CustomerResult[]> {
    const customers = await prisma.usuarios.findMany({
      where: { role: ROLES.CUSTOMER },
      orderBy: { fecha_creacion: "desc" },
      include: { ordenes: { select: { total: true } } },
    });

    return customers.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      picture: c.picture,
      role: c.role || ROLES.CUSTOMER,
      blocked: c.blocked,
      points: c.points,
      fechaCreacion: c.fecha_creacion,
      medidaPecho: c.medida_pecho ? c.medida_pecho.toNumber() : null,
      medidaCintura: c.medida_cintura ? c.medida_cintura.toNumber() : null,
      medidaCadera: c.medida_cadera ? c.medida_cadera.toNumber() : null,
      orders: c.ordenes.length,
      spent: roundToCents(
        c.ordenes.reduce((sum, order) => sum + order.total.toNumber(), 0),
      ),
    }));
  },

  async listUsers(): Promise<CustomerResult[]> {
    const users = await prisma.usuarios.findMany({
      orderBy: { fecha_creacion: "desc" },
      include: { ordenes: { select: { total: true } } },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role || ROLES.CUSTOMER,
      blocked: user.blocked,
      points: user.points,
      fechaCreacion: user.fecha_creacion,
      medidaPecho: user.medida_pecho ? user.medida_pecho.toNumber() : null,
      medidaCintura: user.medida_cintura ? user.medida_cintura.toNumber() : null,
      medidaCadera: user.medida_cadera ? user.medida_cadera.toNumber() : null,
      orders: user.ordenes.length,
      spent: roundToCents(
        user.ordenes.reduce((sum, order) => sum + order.total.toNumber(), 0),
      ),
    }));
  },

  async updateCustomerRole(id: string, role: string): Promise<CustomerResult> {
    const allowed = new Set<string>(Object.values(ROLES));
    if (!role || !allowed.has(role)) {
      throw new Error("INVALID_ROLE");
    }

    const user = await prisma.usuarios.findUnique({
      where: { id },
      include: { ordenes: { select: { total: true } } },
    });
    if (!user) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }

    const updated = await prisma.usuarios.update({
      where: { id },
      data: { role },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      picture: updated.picture,
      role: updated.role || ROLES.CUSTOMER,
      blocked: updated.blocked,
      points: updated.points,
      fechaCreacion: updated.fecha_creacion,
      medidaPecho: updated.medida_pecho ? updated.medida_pecho.toNumber() : null,
      medidaCintura: updated.medida_cintura ? updated.medida_cintura.toNumber() : null,
      medidaCadera: updated.medida_cadera ? updated.medida_cadera.toNumber() : null,
      orders: user.ordenes.length,
      spent: roundToCents(
        user.ordenes.reduce((sum, order) => sum + order.total.toNumber(), 0),
      ),
    };
  },

  async updateCustomerBlocked(id: string, blocked: boolean): Promise<CustomerResult> {
    if (typeof blocked !== "boolean") {
      throw new Error("INVALID_CUSTOMER_STATUS");
    }

    const customer = await prisma.usuarios.findUnique({
      where: { id },
      include: { ordenes: { select: { total: true } } },
    });
    if (!customer || customer.role !== ROLES.CUSTOMER) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }

    const updated = await prisma.usuarios.update({
      where: { id },
      data: { blocked },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      picture: updated.picture,
      role: updated.role || ROLES.CUSTOMER,
      blocked: updated.blocked,
      points: updated.points,
      fechaCreacion: updated.fecha_creacion,
      medidaPecho: updated.medida_pecho ? updated.medida_pecho.toNumber() : null,
      medidaCintura: updated.medida_cintura ? updated.medida_cintura.toNumber() : null,
      medidaCadera: updated.medida_cadera ? updated.medida_cadera.toNumber() : null,
      orders: customer.ordenes.length,
      spent: roundToCents(
        customer.ordenes.reduce((sum, order) => sum + order.total.toNumber(), 0),
      ),
    };
  },

  async getInventory(): Promise<ProductResult[]> {
    return this.listProducts();
  },

  async updateStock(
    productId: string,
    talla: string,
    quantity: number,
    userId: string,
    motivo?: string,
  ): Promise<ProductResult> {
    if (typeof talla !== "string" || !talla) {
      throw new Error("SIZE_REQUIRED");
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("INVALID_QUANTITY");
    }

    const productoTalla = await prisma.producto_tallas.findFirst({
      where: { producto_id: productId, talla },
      include: { productos: true },
    });
    if (!productoTalla) {
      throw new Error("SIZE_NOT_FOUND");
    }

    const currentStock = productoTalla.stock ?? 0;
    const delta = quantity - currentStock;
    const tipo = delta >= 0 ? MOVEMENT_TYPE.INPUT : MOVEMENT_TYPE.OUTPUT;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.producto_tallas.updateMany({
        where: { id: productoTalla.id, stock: productoTalla.stock },
        data: { stock: quantity },
      });

      if (updated.count !== 1) {
        throw new Error("STOCK_CONFLICT");
      }

      if (delta !== 0) {
        await tx.inventory_movements.create({
          data: {
            producto_talla_id: productoTalla.id,
            tipo,
            cantidad: Math.abs(delta),
            motivo: motivo || null,
            usuario_id: userId,
          },
        });
      }
    });

    const products = await this.listProducts();
    const updated = products.find((p) => p.id === productId);
    if (!updated) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    return updated;
  },

  async listMovements(): Promise<MovementResult[]> {
    const movements = await prisma.inventory_movements.findMany({
      orderBy: { fecha: "desc" },
      include: {
        producto_tallas: { include: { productos: true } },
        usuarios: { select: { name: true, email: true } },
      },
    });

    return movements.map((movement) => ({
      id: movement.id,
      tipo: movement.tipo,
      cantidad: movement.cantidad,
      motivo: movement.motivo,
      fecha: movement.fecha,
      producto: movement.producto_tallas.productos.nombre,
      talla: movement.producto_tallas.talla,
      responsable:
        movement.usuarios.name || movement.usuarios.email,
    }));
  },

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const [totalOrders, revenueAgg, totalCustomers, totalProducts, pendingOrders, soldAgg, totalReturns, lowStockVariants] =
      await Promise.all([
        prisma.ordenes.count(),
        prisma.ordenes.aggregate({ _sum: { total: true } }),
        prisma.usuarios.count({ where: { role: ROLES.CUSTOMER } }),
        prisma.productos.count(),
        prisma.ordenes.count({ where: { estado: "pending" } }),
        prisma.orden_detalles.aggregate({ _sum: { cantidad: true } }),
        prisma.ordenes.count({ where: { estado: "return" } }),
        prisma.producto_tallas.findMany({
          where: { stock: { lte: LOW_STOCK_THRESHOLD } },
          select: { producto_id: true },
          distinct: ["producto_id"],
        }),
      ]);

    return {
      totalOrders,
      revenue: revenueAgg._sum.total ? revenueAgg._sum.total.toNumber() : 0,
      totalCustomers,
      totalProducts,
      lowStockCount: lowStockVariants.length,
      pendingOrders,
      totalUnitsSold: soldAgg._sum.cantidad || 0,
      totalReturns,
    };
  },

  async getSalesChart(): Promise<{ label: string; value: number }[]> {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const orders = await prisma.ordenes.findMany({
      where: { fecha_orden: { gte: since } },
      select: { total: true, fecha_orden: true },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      byMonth.set(d.toLocaleDateString("en-US", { month: "short" }), 0);
    }

    for (const order of orders) {
      if (!order.fecha_orden) continue;
      const key = order.fecha_orden.toLocaleDateString("en-US", { month: "short" });
      byMonth.set(key, roundToCents((byMonth.get(key) || 0) + order.total.toNumber()));
    }

    return Array.from(byMonth.entries()).map(([label, value]) => ({ label, value }));
  },

  async getFinanceSummary(period: FinancePeriod = "month"): Promise<FinanceSummaryResult> {
    const now = new Date();
    const buckets = financeBuckets(now, period);
    const revenueByBucket = new Map(buckets.map((bucket) => [bucket.key, 0]));
    const categories = new Map<string, { amount: number; units: number }>();
    const orders = await prisma.ordenes.findMany({
      orderBy: { fecha_orden: "desc" },
      include: {
        orden_detalles: {
          include: {
            producto_tallas: { include: { productos: true } },
          },
        },
      },
    });

    let revenue = 0;
    let ordersCount = 0;
    let returnsCount = 0;
    const transactions: FinanceSummaryResult["transactions"] = [];

    for (const order of orders) {
      if (!order.fecha_orden) continue;
      const orderDate = order.fecha_orden;
      const bucketKey = financeBucketKey(orderDate, period);
      if (!revenueByBucket.has(bucketKey)) continue;

      const status = (order.estado || "pending").toLowerCase();
      const isReturn = status === "return" || status === "returned";
      const isCancelled = status === "cancelled";
      const total = roundToCents(order.total.toNumber());

      if (isReturn) {
        returnsCount += 1;
      } else if (!isCancelled) {
        revenue = roundToCents(revenue + total);
        ordersCount += 1;
        revenueByBucket.set(bucketKey, roundToCents((revenueByBucket.get(bucketKey) || 0) + total));

        for (const detail of order.orden_detalles) {
          const name = detail.producto_tallas.productos.categoria || "Sin categoría";
          const current = categories.get(name) || { amount: 0, units: 0 };
          categories.set(name, {
            amount: roundToCents(current.amount + detail.precio_unitario.toNumber() * detail.cantidad),
            units: current.units + detail.cantidad,
          });
        }
      }

      if (!isCancelled) {
        transactions.push({
          reference: order.numero || order.id,
          description: isReturn ? "Devolución de pedido" : "Venta online",
          date: orderDate.toLocaleDateString("es-PE"),
          amount: isReturn ? -Math.abs(total) : total,
          type: isReturn ? "Devolución" : "Ingreso",
        });
      }
    }

    const totalCategoryAmount = Array.from(categories.values())
      .reduce((sum, category) => sum + category.amount, 0);
    const categoryData = Array.from(categories.entries())
      .map(([name, category]) => ({
        name,
        amount: category.amount,
        units: category.units,
        percentage: totalCategoryAmount > 0
          ? Math.round((category.amount / totalCategoryAmount) * 100)
          : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period,
      periodLabel: FINANCE_PERIOD_LABELS[period],
      revenue,
      ordersCount,
      returnsCount,
      monthlyRevenue: buckets.map((bucket) => ({
        label: bucket.label,
        value: revenueByBucket.get(bucket.key) || 0,
      })),
      categories: categoryData,
      transactions: transactions.slice(0, 8),
      expenses: null,
      paymentMethods: [],
    };
  },

  async getTopProducts(): Promise<{ id: string; name: string; units: number; revenue: number }[]> {
    const grouped = await prisma.orden_detalles.groupBy({
      by: ["producto_talla_id"],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 10,
    });

    if (grouped.length === 0) return [];

    const ids = grouped.map((g) => g.producto_talla_id);
    const tallas = await prisma.producto_tallas.findMany({
      where: { id: { in: ids } },
      include: { productos: true },
    });

    const tallaById = new Map(tallas.map((t) => [t.id, t]));

    return grouped
      .map((g) => {
        const talla = tallaById.get(g.producto_talla_id);
        if (!talla) return null;
        const units = g._sum.cantidad || 0;
        return {
          id: talla.productos.id,
          name: talla.productos.nombre,
          units,
          revenue: roundToCents(talla.productos.precio.toNumber() * units),
        };
      })
      .filter((item): item is { id: string; name: string; units: number; revenue: number } => item !== null);
  },

  async getCategories(): Promise<{ name: string; count: number }[]> {
    const grouped = await prisma.productos.groupBy({
      by: ["categoria"],
      _count: true,
    });

    return grouped
      .sort((a, b) => b._count - a._count)
      .map((g) => ({
        name: g.categoria || "Sin categoría",
        count: g._count,
      }));
  },

  async getLowStockProducts(): Promise<ProductResult[]> {
    const products = await prisma.productos.findMany({
      where: {
        producto_tallas: { some: { stock: { lte: LOW_STOCK_THRESHOLD } } },
      },
      include: { producto_tallas: { orderBy: { talla: "asc" } } },
    });

    return products.map(mapProduct);
  },

  async recordMovement(
    data: MovementInput,
    userId: string,
  ): Promise<{ product: ProductResult; movement: MovementResult }> {
    if (!data || typeof data !== "object") {
      throw new Error("INVALID_ENTRY");
    }
    const type = data.tipo?.trim().toUpperCase();
    if (type !== MOVEMENT_TYPE.INPUT && type !== MOVEMENT_TYPE.OUTPUT) {
      throw new Error("INVALID_MOVEMENT_TYPE");
    }
    if (!Number.isInteger(data.cantidad) || data.cantidad <= 0) {
      throw new Error("INVALID_QUANTITY");
    }
    if (!data.motivo || typeof data.motivo !== "string" || !data.motivo.trim()) {
      throw new Error("MOTIVE_REQUIRED");
    }

    const productoTalla = data.productoTallaId
      ? await prisma.producto_tallas.findFirst({
          where: { id: data.productoTallaId },
          include: { productos: true },
        })
      : await prisma.producto_tallas.findFirst({
          where: { producto_id: data.productoId, talla: data.talla },
          include: { productos: true },
        });

    if (!productoTalla) {
      throw new Error("SIZE_NOT_FOUND");
    }

    const currentStock = productoTalla.stock ?? 0;
    const nextStock =
      type === MOVEMENT_TYPE.INPUT
        ? currentStock + data.cantidad
        : currentStock - data.cantidad;
    if (nextStock < 0) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const movement = await prisma.$transaction(async (tx) => {
      const updated = await tx.producto_tallas.updateMany({
        where: { id: productoTalla.id, stock: productoTalla.stock },
        data: { stock: nextStock },
      });
      if (updated.count !== 1) {
        throw new Error("STOCK_CONFLICT");
      }
      return tx.inventory_movements.create({
        data: {
          producto_talla_id: productoTalla.id,
          tipo: type,
          cantidad: data.cantidad,
          motivo: data.motivo.trim(),
          usuario_id: userId,
        },
        include: {
          producto_tallas: { include: { productos: true } },
          usuarios: { select: { name: true, email: true } },
        },
      });
    });

    const products = await this.listProducts();
    const product = products.find((item) => item.id === productoTalla.producto_id);
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return {
      product,
      movement: {
        id: movement.id,
        tipo: movement.tipo,
        cantidad: movement.cantidad,
        motivo: movement.motivo,
        fecha: movement.fecha,
        producto: movement.producto_tallas.productos.nombre,
        talla: movement.producto_tallas.talla,
        responsable: movement.usuarios.name || movement.usuarios.email,
      },
    };
  },
};
