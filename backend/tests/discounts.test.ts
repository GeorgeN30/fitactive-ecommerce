import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    producto_tallas: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    discount_requests: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../src/config/prisma";
import { discountService } from "../src/services/discounts";

const mockPrisma = vi.mocked(prisma);

function decimal(value: number) {
  return { toNumber: () => value } as never;
}

function variant(id: string, discount = 0) {
  return {
    id,
    talla: id === "size-1" ? "M" : "L",
    stock: 12,
    descuento_porcentaje: discount,
    productos: {
      id: "product-1",
      nombre: "Polo Run",
      precio: decimal(49.9),
    },
  } as never;
}

function requestRow(
  id: string,
  estado: "PENDING" | "APPROVED" | "REJECTED" | "REVERTED" = "PENDING",
  discount = 0,
) {
  return {
    id,
    porcentaje: 20,
    motivo: "Baja rotación",
    estado,
    comentario_admin: estado === "REJECTED" ? "Revisar temporada" : null,
    solicitado_en: new Date("2026-09-14T10:00:00Z"),
    revisado_en: estado === "PENDING" ? null : new Date("2026-09-14T11:00:00Z"),
    producto_talla_id: "size-1",
    producto_tallas: variant("size-1", discount),
    solicitante: { id: "inventory-1", name: "Inventario", email: "inventory@test.com" },
    revisor:
      estado === "PENDING"
        ? null
        : { id: "admin-1", name: "Admin", email: "admin@test.com" },
  } as never;
}

function buildTx() {
  return {
    discount_requests: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
    },
    producto_tallas: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

describe("discountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid duration and expired custom windows before writing", async () => {
    for (const validity of [{ duracionHoras: 1 }, { fechaFin: "2020-01-01T00:00:00Z" }, { fechaFin: "invalid" }, { duracionHoras: 24, fechaFin: "2099-01-01T00:00:00Z" }]) {
      await expect(discountService.createRequest("inventory-1", {
        productoTallaIds: ["size-1"], porcentaje: 20, motivo: "Temporada", ...validity,
      })).rejects.toThrow(/INVALID_DISCOUNT/);
    }
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("starts quick durations at approval instead of request time", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue({ ...(requestRow("request-1") as unknown as Record<string, unknown>), duracion_horas: 24 });
    tx.discount_requests.updateMany.mockResolvedValue({ count: 1 });
    tx.producto_tallas.updateMany.mockResolvedValue({ count: 1 });
    tx.discount_requests.findUniqueOrThrow.mockResolvedValue(requestRow("request-1", "APPROVED", 20));
    mockPrisma.$transaction.mockImplementation((callback: (transaction: ReturnType<typeof buildTx>) => unknown) => callback(tx));
    await discountService.reviewRequest("request-1", "admin-1", "APPROVED");
    const applied = tx.producto_tallas.updateMany.mock.calls[0][0].data;
    expect(applied.descuento_fin.getTime() - applied.descuento_inicio.getTime()).toBe(86_400_000);
  });

  it("validates the request and deduplicates selected sizes", async () => {
    await expect(
      discountService.createRequest("inventory-1", {
        productoTallaIds: ["size-1"],
        porcentaje: 0,
        motivo: "Baja rotación",
      }),
    ).rejects.toThrow("INVALID_DISCOUNT_PERCENTAGE");

    await expect(
      discountService.createRequest("inventory-1", {
        productoTallaIds: ["size-1"],
        porcentaje: 20,
        motivo: "",
      }),
    ).rejects.toThrow("DISCOUNT_REASON_REQUIRED");

    const tx = buildTx();
    tx.producto_tallas.findMany.mockResolvedValue([
      variant("size-1"),
      variant("size-2"),
    ]);
    tx.discount_requests.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        requestRow("request-1"),
        requestRow("request-2"),
      ]);
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    await discountService.createRequest("inventory-1", {
      productoTallaIds: ["size-1", "size-1", "size-2"],
      porcentaje: 20,
      motivo: "Baja rotación",
    });

    expect(tx.discount_requests.create).toHaveBeenCalledTimes(2);
    expect(tx.discount_requests.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        producto_talla_id: "size-1",
        porcentaje: 20,
        estado: "PENDING",
      }),
    });
    expect(tx.discount_requests.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ producto_talla_id: "size-2" }),
    });
  });

  it("does not allow a second pending request for the same size", async () => {
    const tx = buildTx();
    tx.producto_tallas.findMany.mockResolvedValue([variant("size-1")]);
    tx.discount_requests.findMany.mockResolvedValue([
      { producto_talla_id: "size-1" } as never,
    ]);
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    await expect(
      discountService.createRequest("inventory-1", {
        productoTallaIds: ["size-1"],
        porcentaje: 30,
        motivo: "Liquidación",
      }),
    ).rejects.toThrow("DISCOUNT_REQUEST_ALREADY_PENDING");
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("applies the discount atomically when an admin approves", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue(requestRow("request-1"));
    tx.discount_requests.updateMany.mockResolvedValue({ count: 1 });
    tx.producto_tallas.updateMany.mockResolvedValue({ count: 1 });
    tx.discount_requests.findUniqueOrThrow.mockResolvedValue(
      requestRow("request-1", "APPROVED", 20),
    );
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    const result = await discountService.reviewRequest(
      "request-1",
      "admin-1",
      "approved",
    );

    expect(tx.discount_requests.updateMany).toHaveBeenCalledWith({
      where: { id: "request-1", estado: "PENDING" },
      data: expect.objectContaining({ estado: "APPROVED", revisado_por: "admin-1" }),
    });
    expect(tx.producto_tallas.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: "size-1", OR: expect.any(Array) }),
      data: expect.objectContaining({ descuento_porcentaje: 20, descuento_solicitud_id: "request-1" }),
    });
    expect(result.status).toBe("APPROVED");
    expect(result.product.salePrice).toBe(39.92);
  });

  it("rejects without changing the product price", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue(requestRow("request-1"));
    tx.discount_requests.updateMany.mockResolvedValue({ count: 1 });
    tx.discount_requests.findUniqueOrThrow.mockResolvedValue(
      requestRow("request-1", "REJECTED"),
    );
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    await discountService.reviewRequest(
      "request-1",
      "admin-1",
      "rejected",
      "Revisar temporada",
    );

    expect(tx.producto_tallas.updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite a decision made concurrently by another admin", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue(requestRow("request-1"));
    tx.discount_requests.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    await expect(
      discountService.reviewRequest("request-1", "admin-2", "approved"),
    ).rejects.toThrow("DISCOUNT_REQUEST_ALREADY_RESOLVED");
    expect(tx.producto_tallas.updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite a discount activated concurrently", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue(requestRow("request-1"));
    tx.discount_requests.updateMany.mockResolvedValue({ count: 1 });
    tx.producto_tallas.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    await expect(
      discountService.reviewRequest("request-1", "admin-1", "approved"),
    ).rejects.toThrow("DISCOUNT_ALREADY_ACTIVE");
    expect(tx.discount_requests.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("reverts an active discount atomically", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue(
      requestRow("request-1", "APPROVED", 20),
    );
    tx.producto_tallas.updateMany.mockResolvedValue({ count: 1 });
    tx.discount_requests.updateMany.mockResolvedValue({ count: 1 });
    tx.discount_requests.findUniqueOrThrow.mockResolvedValue(
      requestRow("request-1", "REVERTED", 0),
    );
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    const result = await discountService.revertRequest("request-1", "admin-1");

    expect(tx.producto_tallas.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: "size-1", descuento_porcentaje: 20, OR: expect.any(Array) }),
      data: expect.objectContaining({ descuento_porcentaje: 0, descuento_solicitud_id: null }),
    });
    expect(tx.discount_requests.updateMany).toHaveBeenCalledWith({
      where: { id: "request-1", estado: "APPROVED" },
      data: expect.objectContaining({ estado: "REVERTED", revisado_por: "admin-1" }),
    });
    expect(result.status).toBe("REVERTED");
    expect(result.product.currentDiscountPercent).toBe(0);
    expect(result.product.salePrice).toBe(49.9);
  });

  it("does not revert a discount that changed concurrently", async () => {
    const tx = buildTx();
    tx.discount_requests.findUnique.mockResolvedValue(
      requestRow("request-1", "APPROVED", 20),
    );
    tx.producto_tallas.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation(
      (callback: (transaction: ReturnType<typeof buildTx>) => unknown) =>
        callback(tx),
    );

    await expect(
      discountService.revertRequest("request-1", "admin-1"),
    ).rejects.toThrow("DISCOUNT_NOT_ACTIVE");
    expect(tx.discount_requests.updateMany).not.toHaveBeenCalled();
  });
});
