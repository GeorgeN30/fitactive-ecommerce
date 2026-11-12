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

describe("optional initial onboarding", () => {
  it("saves modal preferences and gender without measurements and returns the status on GET", async () => {
    const payload = {
      genero: "Mujer",
      preferencia_ropa: "Deportiva",
      preferencia_colores: "Azul",
      preferencia_deporte: "Running",
      onboarding_completado: true,
    };
    const savedUser = { ...user(null), ...payload };
    mockPrisma.usuarios.update.mockResolvedValue(savedUser as never);
    mockPrisma.usuarios.findUnique.mockResolvedValue(savedUser as never);
    const res = response();

    await authController.updateMe(request({ ...payload, id: "user-2", userId: "user-2" }), res);

    expect(mockPrisma.usuarios.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "user-1" },
      data: payload,
      select: expect.objectContaining({ onboarding_completado: true }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: expect.objectContaining(savedUser) });

    const getRes = response();
    await authController.getMe(request(), getRes);

    expect(mockPrisma.usuarios.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: "user-1" },
      select: expect.objectContaining({ onboarding_completado: true }),
    });
    expect(getRes.status).toHaveBeenCalledWith(200);
    expect(getRes.json).toHaveBeenCalledWith({ user: expect.objectContaining(savedUser) });
  });

  it("skips with only the status without overwriting existing preferences or measurements", async () => {
    const savedUser = {
      ...user("broad"),
      genero: "Hombre",
      preferencia_ropa: "Casual",
      preferencia_colores: "Negro",
      preferencia_deporte: "Futbol",
      altura: 180,
      medida_pecho: 100,
      medida_cintura: 85,
      medida_cadera: 95,
      medida_muslo: 55,
      onboarding_completado: true,
    };
    mockPrisma.usuarios.update.mockResolvedValue(savedUser as never);
    mockPrisma.usuarios.findUnique.mockResolvedValue(savedUser as never);
    const res = response();

    await authController.updateMe(request({ onboarding_completado: true }), res);

    expect(mockPrisma.usuarios.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "user-1" },
      data: { onboarding_completado: true },
      select: expect.objectContaining({ onboarding_completado: true }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: expect.objectContaining(savedUser) });

    const getRes = response();
    await authController.getMe(request(), getRes);

    expect(getRes.status).toHaveBeenCalledWith(200);
    expect(getRes.json).toHaveBeenCalledWith({ user: expect.objectContaining(savedUser) });
  });

  it.each([null, "true", "false", 0, 1, {}, []])(
    "rejects non-boolean onboarding status %j",
    async (onboarding_completado) => {
      const res = response();

      await authController.updateMe(request({ onboarding_completado }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "INVALID_ONBOARDING_STATUS" });
      expect(mockPrisma.usuarios.update).not.toHaveBeenCalled();
    },
  );

  it("still accepts a false onboarding status", async () => {
    mockPrisma.usuarios.update.mockResolvedValue({
      ...user(null), onboarding_completado: false,
    } as never);
    const res = response();

    await authController.updateMe(request({ onboarding_completado: false }), res);

    expect(mockPrisma.usuarios.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: "user-1" },
      data: { onboarding_completado: false },
      select: expect.objectContaining({ onboarding_completado: true }),
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it.each([
    ["altura", "180"],
    ["altura", 99],
    ["medida_pecho", 251],
    ["medida_cintura", -1],
    ["medida_cadera", Number.NaN],
    ["medida_muslo", Number.POSITIVE_INFINITY],
    ["preferencia_ropa", []],
    ["preferencia_colores", 123],
    ["preferencia_deporte", "x".repeat(101)],
    ["genero", "invalid"],
    ["bodyType", "athletic"],
  ] as const)("still rejects invalid %s when onboarding is handled", async (field, value) => {
    const res = response();

    await authController.updateMe(request({ onboarding_completado: true, [field]: value }), res);

    const error = field === "genero" ? "INVALID_GENDER"
      : field === "bodyType" ? "INVALID_BODY_TYPE" : `INVALID_${field.toUpperCase()}`;
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error });
    expect(mockPrisma.usuarios.update).not.toHaveBeenCalled();
  });

  it("rejects skipping without an authenticated identity", async () => {
    const req = request({ onboarding_completado: true, userId: "user-2" });
    delete req.user;
    const res = response();

    await authController.updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "UNAUTHORIZED" });
    expect(mockPrisma.usuarios.update).not.toHaveBeenCalled();
  });
});

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
