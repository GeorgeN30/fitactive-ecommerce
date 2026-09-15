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
    productos: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    producto_tallas: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    ordenes: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orden_detalles: {
      groupBy: vi.fn(),
    },
    usuarios: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    inventory_movements: {
      findMany: vi.fn(),
    },
  },
}));

import { adminService } from "../src/services/admin";
import { prisma } from "../src/config/prisma";

const mockPrisma = vi.mocked(prisma);

function decimal(value: number) {
  return { toNumber: () => value } as never;
}

function buildTx() {
  return {
    producto_tallas: {
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn(),
    },
    productos: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    inventory_movements: {
      create: vi.fn(),
    },
  };
}

function productRow(id: string, stock: number) {
  return {
    id,
    nombre: "Polo Run",
    descripcion: null,
    categoria: "Clothing",
    marca: null,
    precio: decimal(49.9),
    imagen_url: null,
    genero: null,
    fecha_creacion: new Date(),
    producto_tallas: [{ id: "talla-1", talla: "M", stock }],
  } as never;
}

describe("adminService.updateStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs an ENTRADA movement when stock increases", async () => {
    const tx = buildTx();
    mockPrisma.producto_tallas.findFirst.mockResolvedValue({
      id: "talla-1",
      talla: "M",
      stock: 5,
      productos: { nombre: "Polo Run" },
    } as never);
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );
    mockPrisma.productos.findMany.mockResolvedValue([productRow("p-1", 20)]);

    const result = await adminService.updateStock("p-1", "M", 20, "user-admin", "Nueva compra");

    expect(result.tallas[0].stock).toBe(20);
    expect(tx.producto_tallas.updateMany).toHaveBeenCalledWith({
      where: { id: "talla-1", stock: 5 },
      data: { stock: 20 },
    });
    expect(tx.inventory_movements.create).toHaveBeenCalledWith({
      data: {
        producto_talla_id: "talla-1",
        tipo: "ENTRADA",
        cantidad: 15,
        motivo: "Nueva compra",
        usuario_id: "user-admin",
      },
    });
  });

  it("logs a SALIDA movement when stock decreases", async () => {
    const tx = buildTx();
    mockPrisma.producto_tallas.findFirst.mockResolvedValue({
      id: "talla-1",
      talla: "M",
      stock: 20,
      productos: { nombre: "Polo Run" },
    } as never);
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );
    mockPrisma.productos.findMany.mockResolvedValue([productRow("p-1", 12)]);

    await adminService.updateStock("p-1", "M", 12, "user-inventory", "Ajuste");

    expect(tx.inventory_movements.create).toHaveBeenCalledWith({
      data: {
        producto_talla_id: "talla-1",
        tipo: "SALIDA",
        cantidad: 8,
        motivo: "Ajuste",
        usuario_id: "user-inventory",
      },
    });
  });

  it("does not log a movement when the stock does not change", async () => {
    const tx = buildTx();
    mockPrisma.producto_tallas.findFirst.mockResolvedValue({
      id: "talla-1",
      talla: "M",
      stock: 10,
      productos: { nombre: "Polo Run" },
    } as never);
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );
    mockPrisma.productos.findMany.mockResolvedValue([productRow("p-1", 10)]);

    await adminService.updateStock("p-1", "M", 10, "user-admin");

    expect(tx.inventory_movements.create).not.toHaveBeenCalled();
  });

  it("rejects invalid quantities", async () => {
    await expect(
      adminService.updateStock("p-1", "M", -1, "user-admin"),
    ).rejects.toThrow("INVALID_QUANTITY");
    await expect(
      adminService.updateStock("p-1", "M", 2.5, "user-admin"),
    ).rejects.toThrow("INVALID_QUANTITY");
  });

  it("throws SIZE_NOT_FOUND when the size row does not exist", async () => {
    mockPrisma.producto_tallas.findFirst.mockResolvedValue(null);
    await expect(
      adminService.updateStock("p-1", "XL", 10, "user-admin"),
    ).rejects.toThrow("SIZE_NOT_FOUND");
  });

  it("does not overwrite stock when a product edit uses a stale stock snapshot", async () => {
    const tx = buildTx();
    mockPrisma.productos.findUnique.mockResolvedValue(productRow("p-1", 5));
    tx.producto_tallas.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: ReturnType<typeof buildTx>) => unknown) => cb(tx),
    );

    await expect(
      adminService.updateProduct("p-1", {
        tallas: [{ talla: "M", stock: 20 }],
      }),
    ).rejects.toThrow("STOCK_CONFLICT");
    expect(tx.producto_tallas.updateMany).toHaveBeenCalledWith({
      where: { id: "talla-1", stock: 5 },
      data: { stock: 20 },
    });
  });
});
