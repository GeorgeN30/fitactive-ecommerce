import { describe, expect, it } from "vitest";
import { config } from "../src/config/env";

const RUN_LOCAL_STACK_TESTS = process.env.RUN_LOCAL_STACK_TESTS === "1";
const BACKEND_URL = "http://127.0.0.1:4000/api";
const FRONTEND_URL = "http://127.0.0.1";

async function login(email: string, password: string) {
  const response = await fetch(`${BACKEND_URL}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(response.status).toBe(200);
  return response.json() as Promise<{ token: string; user: { role: string } }>;
}

describe.skipIf(!RUN_LOCAL_STACK_TESTS)("local Docker stack", () => {
  it("serves health and DB catalog through the frontend proxy", async () => {
    const [health, catalog] = await Promise.all([
      fetch(`${BACKEND_URL}/health`),
      fetch(`${FRONTEND_URL}/api/products`),
    ]);

    expect(health.status).toBe(200);
    expect((await health.json()).status).toBe("ok");
    expect(catalog.status).toBe(200);
    const data = await catalog.json() as { products: { tallas: unknown[] }[] };
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products.every((product) => Array.isArray(product.tallas))).toBe(true);
  });

  it("enforces real staff roles on discount endpoints", async () => {
    const anonymous = await fetch(`${BACKEND_URL}/admin/discount-requests`);
    expect(anonymous.status).toBe(401);

    const [admin, inventory] = await Promise.all([
      login(config.adminEmail, config.adminPassword),
      login(config.inventoryEmail, config.inventoryPassword),
    ]);
    expect(admin.user.role).toBe("admin");
    expect(inventory.user.role).toBe("inventory");

    const [adminList, inventoryList, forbiddenReview, forbiddenRequest] = await Promise.all([
      fetch(`${BACKEND_URL}/admin/discount-requests`, {
        headers: { Authorization: `Bearer ${admin.token}` },
      }),
      fetch(`${BACKEND_URL}/inventory/discount-requests`, {
        headers: { Authorization: `Bearer ${inventory.token}` },
      }),
      fetch(`${BACKEND_URL}/admin/discount-requests/00000000-0000-0000-0000-000000000000/review`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${inventory.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVED" }),
      }),
      fetch(`${BACKEND_URL}/inventory/discount-requests`, {
        method: "POST",
        headers: { Authorization: `Bearer ${admin.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productoTallaIds: [], porcentaje: 20, motivo: "Prueba de acceso" }),
      }),
    ]);

    expect(adminList.status).toBe(200);
    expect(inventoryList.status).toBe(200);
    expect(forbiddenReview.status).toBe(403);
    expect(forbiddenRequest.status).toBe(403);
  }, 30_000);
});
