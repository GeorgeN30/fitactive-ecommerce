import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import type { AuthRequest } from "../src/middlewares/auth";

vi.mock("../src/services/auth", () => ({ authService: {} }));
vi.mock("../src/config/prisma", () => ({
  prisma: {
    usuarios: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { authController } from "../src/controllers/auth";
import { prisma } from "../src/config/prisma";

const mockPrisma = vi.mocked(prisma);

function request(body: Record<string, unknown> = {}): AuthRequest {
  return {
    user: { userId: "user-1", role: "customer" },
    body,
    params: { id: "user-2" },
    query: { userId: "user-2" },
  } as unknown as AuthRequest;
}

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

function user(bodyType: "slim" | "average" | "broad" | null) {
  return {
    id: "user-1",
    email: "test@example.com",
    role: "customer",
    bodyType,
    altura: null,
    medida_pecho: null,
    medida_cintura: null,
    medida_cadera: null,
    medida_muslo: null,
  };
}

beforeEach(() => vi.resetAllMocks());

describe("GET /api/auth/me bodyType", () => {
  it.each([null, "slim", "average", "broad"] as const)(
    "returns %s without replacing a missing preference with average",
    async (bodyType) => {
      mockPrisma.usuarios.findUnique.mockResolvedValue({
        ...user(bodyType),
        passwordHash: "private-hash",
      } as never);
      const res = response();

      await authController.getMe(request({ userId: "user-2" }), res);

      expect(mockPrisma.usuarios.findUnique).toHaveBeenCalledExactlyOnceWith({
        where: { id: "user-1" },
        select: expect.objectContaining({ bodyType: true }),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: "user-1", bodyType }),
      });
      expect(vi.mocked(res.json).mock.calls[0][0].user).not.toHaveProperty("passwordHash");
      expect(mockPrisma.usuarios.update).not.toHaveBeenCalled();
    },
  );
});

describe("PUT /api/auth/me bodyType", () => {
  it.each(["slim", "average", "broad"] as const)(
    "saves and returns %s only for the authenticated user",
    async (bodyType) => {
      mockPrisma.usuarios.update.mockResolvedValue(user(bodyType) as never);
      const res = response();

      await authController.updateMe(request({ bodyType, id: "user-2", userId: "user-2" }), res);

      expect(mockPrisma.usuarios.update).toHaveBeenCalledExactlyOnceWith({
        where: { id: "user-1" },
        data: { bodyType },
        select: expect.objectContaining({ bodyType: true }),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: "user-1", bodyType }),
      });
    },
  );

  it.each([null, "", "SLIM", " average ", "athletic", 0, true, {}, [], ["slim"]])(
    "rejects invalid bodyType %j without writing any profile fields",
    async (bodyType) => {
      const res = response();

      await authController.updateMe(request({ name: "Changed", bodyType }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "INVALID_BODY_TYPE" });
      expect(mockPrisma.usuarios.update).not.toHaveBeenCalled();
    },
  );

  it("leaves bodyType unchanged when omitted from a profile update", async () => {
    mockPrisma.usuarios.update.mockResolvedValue(user(null) as never);
    const res = response();

    await authController.updateMe(request({ name: "Updated" }), res);

    expect(mockPrisma.usuarios.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "user-1" },
      data: { name: "Updated" },
      select: expect.objectContaining({ bodyType: true }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ bodyType: null }),
    });
  });
});
