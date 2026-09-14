import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/config/env", () => ({
  config: {
    port: 4000,
    clientUrl: "http://localhost:5173",
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/fitactive",
    baas: { url: "https://mock.com", apiKey: "mock-key" },
    jwtAppId: "test-app",
    adminEmail: "admin@test.com",
    adminPassword: "Admin123",
    receptionistEmail: "receptionist@test.com",
    receptionistPassword: "Admin123",
  },
}));

vi.mock("../src/services/baas", () => ({
  baas: {
    signJwt: vi.fn(),
    generateOtp: vi.fn(),
    verifyOtp: vi.fn(),
    verifyTotp: vi.fn(),
    generateTotp: vi.fn(),
    verifyGoogleToken: vi.fn(),
  },
}));

vi.mock("../src/config/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    ordenes: {
      findMany: vi.fn(),
    },
  },
}));

import { orderService } from "../src/services/orders";
import { prisma } from "../src/config/prisma";

const mockPrisma = vi.mocked(prisma);

function decimal(value: number) {
  return { toNumber: () => value } as never;
}

function buildTx() {
  return {
    producto_tallas: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    ordenes: {
      create: vi.fn(),
    },
    orden_detalles: {
      findMany: vi.fn(),
    },
  };
}

function productoTalla(
  id: string,
  talla: string,
  stock: number,
  precio: number,
  nombre: string,
) {
  return {
    id,
    talla,
    stock,
    productos: { nombre, precio: decimal(precio) },
  } as never;
}

function detail(
  productoTallaId: string,
  talla: string,
  cantidad: number,
  precio: number,
  nombre: string,
) {
  return {
    producto_talla_id: productoTallaId,
    cantidad,
    precio_unitario: decimal(precio),
    producto_tallas: { talla, productos: { nombre } },
  } as never;
}

describe("orderService.createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an empty order", async () => {
    await expect(
      orderService.createOrder("user-1", [] as never),
    ).rejects.toThrow("EMPTY_ORDER");
    await expect(
      orderService.createOrder("user-1", undefined as never),
    ).rejects.toThrow("EMPTY_ORDER");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid entries and quantities", async () => {
    await expect(
      orderService.createOrder("user-1", [
        { productoTallaId: "", cantidad: 1 },
      ]),
    ).rejects.toThrow("INVALID_ENTRY");

    for (const cantidad of [0, -1, 1.5]) {
      await expect(
        orderService.createOrder("user-1", [
          { productoTallaId: "talla-1", cantidad },
        ]),
      ).rejects.toThrow("INVALID_QUANTITY");
    }

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates an order, computes total from DB prices, and decrements stock", async () => {
    const tx = buildTx();
    tx.producto_tallas.findUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === "talla-1") {
        return Promise.resolve(productoTalla("talla-1", "M", 10, 49.9, "Polo Run"));
      }
      return Promise.resolve(productoTalla("talla-2", "L", 5, 60.07, "Short Run"));
    });
    tx.orden_detalles.findMany.mockResolvedValue([
      detail("talla-1", "M", 2, 49.9, "Polo Run"),
      detail("talla-2", "L", 1, 60.07, "Short Run"),
    ]);
    tx.ordenes.create.mockResolvedValue({
      id: "order-1",
      numero: "ORD-2026-ABC123",
      total: decimal(159.87),
      estado: "pending",
      fecha_orden: new Date("2026-09-12T00:00:00Z"),
    });
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );

    const result = await orderService.createOrder("user-1", [
      { productoTallaId: "talla-1", cantidad: 2 },
      { productoTallaId: "talla-2", cantidad: 1 },
    ]);

    expect(result.numero).toBe("ORD-2026-ABC123");
    expect(result.total).toBe(159.87);
    expect(result.estado).toBe("pending");
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      productoTallaId: "talla-1",
      nombre: "Polo Run",
      talla: "M",
      cantidad: 2,
      precioUnitario: 49.9,
      subtotal: 99.8,
    });

    expect(tx.ordenes.create).toHaveBeenCalledTimes(1);
    expect(tx.producto_tallas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "talla-1" },
        data: { stock: { decrement: 2 } },
      }),
    );
    expect(tx.producto_tallas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "talla-2" },
        data: { stock: { decrement: 1 } },
      }),
    );
  });

  it("rolls back and throws INSUFFICIENT_STOCK without mutating stock", async () => {
    const tx = buildTx();
    tx.producto_tallas.findUnique.mockResolvedValue(
      productoTalla("talla-1", "S", 1, 30, "Casaca"),
    );
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );

    await expect(
      orderService.createOrder("user-1", [
        { productoTallaId: "talla-1", cantidad: 5 },
      ]),
    ).rejects.toThrow("INSUFFICIENT_STOCK");

    expect(tx.ordenes.create).not.toHaveBeenCalled();
    expect(tx.producto_tallas.update).not.toHaveBeenCalled();
  });

  it("throws PRODUCT_NOT_FOUND when the size row does not exist", async () => {
    const tx = buildTx();
    tx.producto_tallas.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );

    await expect(
      orderService.createOrder("user-1", [
        { productoTallaId: "missing-1", cantidad: 1 },
      ]),
    ).rejects.toThrow("PRODUCT_NOT_FOUND");
  });
});

describe("orderService.listUserOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user orders mapped with product info", async () => {
    mockPrisma.ordenes.findMany.mockResolvedValue([
      {
        id: "order-1",
        numero: "ORD-2026-ABC123",
        total: decimal(99.8),
        estado: "pending",
        fecha_orden: new Date("2026-09-12T00:00:00Z"),
        orden_detalles: [detail("talla-1", "M", 2, 49.9, "Polo Run")],
      } as never,
    ]);

    const orders = await orderService.listUserOrders("user-1");

    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      numero: "ORD-2026-ABC123",
      total: 99.8,
      estado: "pending",
    });
    expect(orders[0].entries[0]).toMatchObject({
      nombre: "Polo Run",
      talla: "M",
      cantidad: 2,
      precioUnitario: 49.9,
      subtotal: 99.8,
    });
  });
});