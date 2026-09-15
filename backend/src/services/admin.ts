import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  ALLOWED_ORDER_STATUSES,
  LOW_STOCK_THRESHOLD,
  MOVEMENT_TYPE,
  ROLES,
} from "../constants";
import { calculateDiscountedPrice, roundToCents } from "../utils/pricing";

export interface ProductTallaInput {
  talla: string;
  stock?: number;
}

export interface ProductInput {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  precio: number;
  imagenUrl?: string;
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
  return {
    id: prod.id,
    nombre: prod.nombre,
    descripcion: prod.descripcion,
    categoria: prod.categoria,
    marca: prod.marca,
    precio: prod.precio.toNumber(),
    imagenUrl: prod.imagen_url,
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
    validateProductTallas(data.tallas);
  }
}

export const adminService = {
  async listProducts(): Promise<ProductResult[]> {
    const products = await prisma.productos.findMany({
      include: { producto_tallas: { orderBy: { talla: "asc" } } },
      orderBy: { fecha_creacion: "desc" },
    });
    return products.map(mapProduct);
  },

  async createProduct(data: ProductInput): Promise<ProductResult> {
    validateProductInput(data);
    if (typeof data.nombre !== "string" || typeof data.precio !== "number") {
      throw new Error("NAME_REQUIRED");
    }

    const created = await prisma.productos.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion || null,
        categoria: data.categoria || null,
        marca: data.marca || null,
        precio: data.precio,
        imagen_url: data.imagenUrl || null,
        genero: data.genero || null,
        producto_tallas: {
          create: (data.tallas || []).map((t) => ({
            talla: t.talla.trim(),
            stock: t.stock ?? 0,
          })),
        },
      },
      include: { producto_tallas: { orderBy: { talla: "asc" } } },
    });

    return mapProduct(created);
  },

  async updateProduct(id: string, data: Partial<ProductInput>): Promise<ProductResult> {
    validateProductInput(data);
    const existing = await prisma.productos.findUnique({
      where: { id },
      include: { producto_tallas: true },
    });
    if (!existing) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.productos.update({
        where: { id },
        data: {
          nombre: data.nombre !== undefined ? data.nombre.trim() : existing.nombre,
          descripcion: data.descripcion !== undefined ? data.descripcion : existing.descripcion,
          categoria: data.categoria !== undefined ? data.categoria : existing.categoria,
          marca: data.marca !== undefined ? data.marca : existing.marca,
          precio: data.precio !== undefined ? data.precio : existing.precio,
          imagen_url: data.imagenUrl !== undefined ? data.imagenUrl : existing.imagen_url,
          genero: data.genero !== undefined ? data.genero : existing.genero,
        },
      });

      if (data.tallas !== undefined) {
        for (const tallaInput of data.tallas) {
          const normalizedSize = tallaInput.talla.trim();
          const match = existing.producto_tallas.find(
            (t) => t.talla === normalizedSize,
          );
          if (match) {
            const updatedStock = await tx.producto_tallas.updateMany({
              where: { id: match.id, stock: match.stock },
              data: { stock: tallaInput.stock ?? match.stock },
            });
            if (updatedStock.count !== 1) {
              throw new Error("STOCK_CONFLICT");
            }
          } else {
            await tx.producto_tallas.create({
              data: { producto_id: id, talla: normalizedSize, stock: tallaInput.stock ?? 0 },
            });
          }
        }
      }

      return tx.productos.findUniqueOrThrow({
        where: { id },
        include: { producto_tallas: { orderBy: { talla: "asc" } } },
      });
    });

    return mapProduct(updated);
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    try {
      await prisma.productos.delete({ where: { id } });
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

  async updateCustomerRole(id: string, role: string): Promise<CustomerResult> {
    const allowed = new Set<string>(Object.values(ROLES));
    if (!role || !allowed.has(role)) {
      throw new Error("INVALID_ROLE");
    }

    const user = await prisma.usuarios.findUnique({ where: { id } });
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
      points: updated.points,
      fechaCreacion: updated.fecha_creacion,
      medidaPecho: updated.medida_pecho ? updated.medida_pecho.toNumber() : null,
      medidaCintura: updated.medida_cintura ? updated.medida_cintura.toNumber() : null,
      medidaCadera: updated.medida_cadera ? updated.medida_cadera.toNumber() : null,
      orders: 0,
      spent: 0,
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
    const [totalOrders, revenueAgg, totalCustomers, totalProducts, lowStockCount, pendingOrders, soldAgg, totalReturns] =
      await Promise.all([
        prisma.ordenes.count(),
        prisma.ordenes.aggregate({ _sum: { total: true } }),
        prisma.usuarios.count({ where: { role: ROLES.CUSTOMER } }),
        prisma.productos.count(),
        prisma.producto_tallas.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
        prisma.ordenes.count({ where: { estado: "pending" } }),
        prisma.orden_detalles.aggregate({ _sum: { cantidad: true } }),
        prisma.ordenes.count({ where: { estado: "return" } }),
      ]);

    return {
      totalOrders,
      revenue: revenueAgg._sum.total ? revenueAgg._sum.total.toNumber() : 0,
      totalCustomers,
      totalProducts,
      lowStockCount,
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
