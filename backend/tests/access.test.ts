import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";

vi.mock("../src/services/auth", () => ({
  authService: { verifyToken: vi.fn() },
}));
vi.mock("../src/config/prisma", () => ({
  prisma: { usuarios: { findUnique: vi.fn() } },
}));

import { authService } from "../src/services/auth";
import { prisma } from "../src/config/prisma";
import { validateJWT, type AuthRequest } from "../src/middlewares/auth";
import { checkRole } from "../src/middlewares/role";
import { ROLES } from "../src/constants";

function response() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

function request(token?: string) {
  return {
    headers: { authorization: token ? `Bearer ${token}` : undefined },
  } as unknown as AuthRequest;
}

describe("staff authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a request without a bearer token", () => {
    const req = request();
    const res = response();
    const next = vi.fn() as NextFunction;

    validateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "NO_TOKEN" });
    expect(next).not.toHaveBeenCalled();
  });

  it("uses the current DB role rather than an admin claim in an old token", async () => {
    vi.mocked(authService.verifyToken).mockResolvedValue({
      valid: true,
      claims: { sub: "user-1", extra: { role: "admin" } },
    } as never);
    vi.mocked(prisma.usuarios.findUnique).mockResolvedValue({ role: ROLES.CUSTOMER } as never);
    const req = request("valid-token");
    const res = response();
    const next = vi.fn() as NextFunction;

    validateJWT(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());
    expect(req.user?.role).toBe(ROLES.CUSTOMER);

    const roleNext = vi.fn() as NextFunction;
    checkRole(ROLES.ADMIN)(req, res, roleNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "INSUFFICIENT_ROLE" });
    expect(roleNext).not.toHaveBeenCalled();
  });

  it("prevents an admin from creating inventory discount requests", () => {
    const req = request("valid-token");
    req.user = { userId: "admin-1", role: ROLES.ADMIN };
    const res = response();
    const next = vi.fn() as NextFunction;

    checkRole(ROLES.INVENTORY)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows the inventory role to create a discount request", () => {
    const req = request("valid-token");
    req.user = { userId: "inventory-1", role: ROLES.INVENTORY };
    const next = vi.fn() as NextFunction;

    checkRole(ROLES.INVENTORY)(req, response(), next);

    expect(next).toHaveBeenCalledOnce();
  });
});
