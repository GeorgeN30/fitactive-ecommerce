import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/env", () => ({
  config: {
    jwtAppId: "test-app",
  },
}));

vi.mock("../src/services/baas", () => ({
  baas: {
    notify: vi.fn(),
    sendEmail: vi.fn(),
  },
}));

vi.mock("../src/config/prisma", () => ({
  prisma: {
    usuarios: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    notifications: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "../src/config/prisma";
import { baas } from "../src/services/baas";
import { notifications } from "../src/services/notifications";

const mockPrisma = vi.mocked(prisma);
const mockBaas = vi.mocked(baas);

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists a user's notification history in newest-first order", async () => {
    const createdAt = new Date("2026-09-16T12:00:00.000Z");
    mockPrisma.notifications.findMany.mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        type: "discount",
        title: "Descuento aprobado",
        message: "Tu solicitud fue aprobada.",
        read: false,
        createdAt,
      },
    ] as never);

    const result = await notifications.listForUser("user-1");

    expect(mockPrisma.notifications.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: "11111111-1111-4111-8111-111111111111",
        type: "discount",
        read: false,
        createdAt,
      }),
    ]);
  });

  it("marks only notifications owned by the user as read", async () => {
    mockPrisma.notifications.updateMany.mockResolvedValue({ count: 1 } as never);

    await notifications.markAsRead("user-1", "11111111-1111-4111-8111-111111111111");

    expect(mockPrisma.notifications.updateMany).toHaveBeenCalledWith({
      where: { id: "11111111-1111-4111-8111-111111111111", userId: "user-1" },
      data: { read: true },
    });
  });

  it("rejects reading a notification that does not belong to the user", async () => {
    mockPrisma.notifications.updateMany.mockResolvedValue({ count: 0 } as never);

    await expect(
      notifications.markAsRead("user-1", "11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("NOTIFICATION_NOT_FOUND");
  });

  it("ignores transient notification identifiers without querying Prisma", async () => {
    await expect(
      notifications.markAsRead("user-1", "live-123"),
    ).rejects.toThrow("NOTIFICATION_NOT_FOUND");
    expect(mockPrisma.notifications.updateMany).not.toHaveBeenCalled();
  });

  it("persists and broadcasts new order notifications to admin, inventory and customer", async () => {
    mockPrisma.usuarios.findMany.mockResolvedValue([
      { id: "admin-1" },
      { id: "inventory-1" },
    ] as never);
    mockPrisma.usuarios.findUnique.mockResolvedValue({
      name: "Cliente Demo",
      email: "cliente@example.com",
    } as never);
    mockPrisma.notifications.createMany.mockResolvedValue({ count: 1 } as never);

    await notifications.notifyNewOrder({
      orderId: "order-1",
      orderNumber: "ORD-2026-0001",
      total: 89.9,
      customerId: "customer-1",
    });

    expect(mockPrisma.usuarios.findMany).toHaveBeenCalledWith({
      where: { role: { in: ["admin", "inventory", "receptionist"] } },
      select: { id: true },
    });
    expect(mockPrisma.notifications.createMany).toHaveBeenCalledTimes(2);
    expect(mockBaas.notify).toHaveBeenCalledTimes(3);
    expect(mockBaas.notify).toHaveBeenCalledWith(
      "test-app",
      "inventory-1",
      expect.objectContaining({ type: "NEW_ORDER" }),
    );
    expect(mockBaas.notify).toHaveBeenCalledWith(
      "test-app",
      "customer-1",
      expect.objectContaining({ type: "NEW_ORDER" }),
    );
  });
});
