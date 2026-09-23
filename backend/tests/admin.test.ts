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

  it("creates a product with the requested stock and image gallery", async () => {
    mockPrisma.productos.create.mockResolvedValue(productRow("p-1", 7));

    const result = await adminService.createProduct({
      nombre: "Polo con galería",
      precio: 89.9,
      tallas: [{ talla: "M", stock: 7 }],
      imageUrls: [
        "https://cdn.example.com/polo-front.jpg",
        "https://cdn.example.com/polo-back.jpg",
      ],
    });

    expect(result.tallas[0].stock).toBe(7);
    expect(mockPrisma.productos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          producto_tallas: { create: [{ talla: "M", stock: 7 }] },
          producto_imagenes: {
            create: [
              { url: "https://cdn.example.com/polo-front.jpg", orden: 0 },
              { url: "https://cdn.example.com/polo-back.jpg", orden: 1 },
            ],
          },
        }),
      }),
    );
  });

  it("rejects more than five product images before writing to the database", async () => {
    await expect(
      adminService.createProduct({
        nombre: "Producto inválido",
        precio: 20,
        imageUrls: Array.from({ length: 6 }, (_, index) => `https://cdn.example.com/${index}.jpg`),
      }),
    ).rejects.toThrow("TOO_MANY_IMAGES");
    expect(mockPrisma.productos.create).not.toHaveBeenCalled();
  });
});

describe("adminService customer management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns customer measurements and blocked status", async () => {
    mockPrisma.usuarios.findMany.mockResolvedValue([
      {
        id: "customer-1",
        email: "customer@example.com",
        name: "Cliente Demo",
        picture: null,
        blocked: true,
        points: 10,
        fecha_creacion: new Date("2026-01-01T00:00:00.000Z"),
        medida_pecho: decimal(96),
        medida_cintura: decimal(82),
        medida_cadera: decimal(100),
        ordenes: [{ total: decimal(59.9) }],
      },
    ] as never);

    const [customer] = await adminService.listCustomers();

    expect(customer).toMatchObject({
      id: "customer-1",
      blocked: true,
      medidaPecho: 96,
      medidaCintura: 82,
      medidaCadera: 100,
      orders: 1,
      spent: 59.9,
    });
  });

  it("blocks a customer without changing its measurements or orders", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue({
      id: "customer-1",
      email: "customer@example.com",
      name: "Cliente Demo",
      picture: null,
      role: "customer",
      blocked: false,
      points: 10,
      fecha_creacion: new Date("2026-01-01T00:00:00.000Z"),
      medida_pecho: decimal(96),
      medida_cintura: decimal(82),
      medida_cadera: decimal(100),
      ordenes: [{ total: decimal(59.9) }],
    } as never);
    mockPrisma.usuarios.update.mockResolvedValue({
      id: "customer-1",
      email: "customer@example.com",
      name: "Cliente Demo",
      picture: null,
      role: "customer",
      blocked: true,
      points: 10,
      fecha_creacion: new Date("2026-01-01T00:00:00.000Z"),
      medida_pecho: decimal(96),
      medida_cintura: decimal(82),
      medida_cadera: decimal(100),
    } as never);

    const customer = await adminService.updateCustomerBlocked("customer-1", true);

    expect(mockPrisma.usuarios.update).toHaveBeenCalledWith({
      where: { id: "customer-1" },
      data: { blocked: true },
    });
    expect(customer.blocked).toBe(true);
    expect(customer.medidaPecho).toBe(96);
    expect(customer.orders).toBe(1);
    expect(customer.spent).toBe(59.9);
  });

  it("rejects attempts to change a non-customer account status", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "admin",
    } as never);

    await expect(
      adminService.updateCustomerBlocked("admin-1", true),
    ).rejects.toThrow("CUSTOMER_NOT_FOUND");
    expect(mockPrisma.usuarios.update).not.toHaveBeenCalled();
  });

  it("preserves order metrics when changing a user's role", async () => {
    mockPrisma.usuarios.findUnique.mockResolvedValue({
      id: "customer-1",
      email: "customer@example.com",
      name: "Cliente Demo",
      picture: null,
      role: "customer",
      blocked: false,
      points: 10,
      fecha_creacion: new Date("2026-01-01T00:00:00.000Z"),
      medida_pecho: decimal(96),
      medida_cintura: decimal(82),
      medida_cadera: decimal(100),
      ordenes: [{ total: decimal(59.9) }, { total: decimal(20.1) }],
    } as never);
    mockPrisma.usuarios.update.mockResolvedValue({
      id: "customer-1",
      email: "customer@example.com",
      name: "Cliente Demo",
      picture: null,
      role: "inventory",
      blocked: false,
      points: 10,
      fecha_creacion: new Date("2026-01-01T00:00:00.000Z"),
      medida_pecho: decimal(96),
      medida_cintura: decimal(82),
      medida_cadera: decimal(100),
    } as never);

    const user = await adminService.updateCustomerRole("customer-1", "inventory");

    expect(mockPrisma.usuarios.update).toHaveBeenCalledWith({
      where: { id: "customer-1" },
      data: { role: "inventory" },
    });
    expect(user.role).toBe("inventory");
    expect(user.orders).toBe(2);
    expect(user.spent).toBe(80);
  });
});

describe("adminService finance summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes sales, returns and categories from real orders", async () => {
    const now = new Date();
    mockPrisma.ordenes.findMany.mockResolvedValue([
      {
        id: "order-return",
        numero: "ORD-002",
        total: decimal(40),
        estado: "return",
        fecha_orden: now,
        orden_detalles: [],
      },
      {
        id: "order-sale",
        numero: "ORD-001",
        total: decimal(120),
        estado: "delivered",
        fecha_orden: new Date(now.getTime() - 60 * 60 * 1000),
        orden_detalles: [
          {
            cantidad: 2,
            precio_unitario: decimal(60),
            producto_tallas: {
              productos: { categoria: "Running" },
            },
          },
        ],
      },
    ] as never);

    const result = await adminService.getFinanceSummary("week");

    expect(result.revenue).toBe(120);
    expect(result.ordersCount).toBe(1);
    expect(result.returnsCount).toBe(1);
    expect(result.categories).toEqual([
      { name: "Running", amount: 120, units: 2, percentage: 100 },
    ]);
    expect(result.transactions[0]).toMatchObject({
      reference: "ORD-002",
      type: "Devolución",
      amount: -40,
    });
  });
});
