import { randomUUID } from "crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import express from "express";
import { createServer } from "http";

const url = process.env.QA_DATABASE_URL;
let prisma: PrismaClient;
let adminService: typeof import("../src/services/admin").adminService;
let discountService: typeof import("../src/services/discounts").discountService;
let orderService: typeof import("../src/services/orders").orderService;
let settingsService: typeof import("../src/services/settings").settingsService;
let returnService: typeof import("../src/services/returns").returnService;
let mercadoPagoService: typeof import("../src/services/mercadoPago").mercadoPagoService;
let customer: string, admin: string, inventory: string, productId: string, sizeId: string;
const users: string[] = [], products: string[] = [];
const eventKeys: string[] = [];
const stressSessionPrefixes: string[] = [];
const expenseIds: string[] = [];

describe.skipIf(!url)("isolated PostgreSQL integration", () => {
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55432" || parsed.pathname !== "/fitlook_qa") throw new Error("QA_DATABASE_MUST_BE_ISOLATED");
    process.env.DATABASE_URL = url; process.env.DIRECT_URL = url;
    ({ prisma } = await import("../src/config/prisma"));
    ({ adminService } = await import("../src/services/admin"));
    ({ discountService } = await import("../src/services/discounts"));
    ({ orderService } = await import("../src/services/orders"));
    ({ settingsService } = await import("../src/services/settings"));
    ({ returnService } = await import("../src/services/returns"));
    ({ mercadoPagoService } = await import("../src/services/mercadoPago"));
    await prisma.$connect();
  });
  beforeEach(async () => {
    [customer, admin, inventory, productId, sizeId] = Array.from({ length: 5 }, () => randomUUID());
    for (const [id, role] of [[customer, "customer"], [admin, "admin"], [inventory, "inventory"]]) {
      await prisma.usuarios.create({ data: { id, role, email: `qa-${id}@example.test`, twoFactorEnabled: true } }); users.push(id);
    }
    await prisma.productos.create({ data: { id: productId, nombre: "QA Polo", precio: 100, producto_tallas: { create: { id: sizeId, talla: "M", stock: 10 } } } }); products.push(productId);
  });
  afterAll(async () => {
    if (!prisma) return;
    await prisma.return_requests.deleteMany({ where: { user_id: { in: users } } });
    await prisma.financial_expenses.deleteMany({ where: { id: { in: expenseIds } } });
    await prisma.ordenes.deleteMany({ where: { usuario_id: { in: users } } });
    await prisma.productos.deleteMany({ where: { id: { in: products } } });
    await prisma.usuarios.deleteMany({ where: { id: { in: users } } });
    await prisma.mercadopago_webhook_events.deleteMany({ where: { event_key: { in: eventKeys } } });
    for (const prefix of stressSessionPrefixes) await prisma.virtual_tryon_events.deleteMany({ where: { sesion_id: { startsWith: prefix } } });
    await prisma.$disconnect();
  });
  it("publishes approved discounts into the real catalog and locks the selected price in an order", async () => {
    const [request] = await discountService.createRequest(inventory, { productoTallaIds: [sizeId], porcentaje: 20, motivo: "QA", duracionHoras: 24 });
    expect((await adminService.listProducts()).find((p) => p.id === productId)!.tallas[0].salePrice).toBe(100);
    const approved = await discountService.reviewRequest(request.id, admin, "APPROVED");
    expect(approved.endsAt!.getTime() - approved.startsAt!.getTime()).toBe(86_400_000);
    expect((await adminService.listProducts()).find((p) => p.id === productId)!.tallas[0].salePrice).toBe(80);
    const order = await orderService.createOrder(customer, [{ productoTallaId: sizeId, cantidad: 2 }], undefined, undefined, 160);
    expect(order.total).toBe(160);
    await discountService.revertRequest(request.id, admin);
    expect((await orderService.listUserOrders(customer))[0].entries[0].precioUnitario).toBe(80);
    expect((await adminService.listProducts()).find((p) => p.id === productId)!.tallas[0].salePrice).toBe(100);
  });
  it("expires without a job and rejects stale totals without reserving stock", async () => {
    await prisma.producto_tallas.update({ where: { id: sizeId }, data: { descuento_porcentaje: 20, descuento_inicio: new Date("2020-01-01"), descuento_fin: new Date("2020-01-02") } });
    expect((await adminService.listProducts()).find((p) => p.id === productId)!.tallas[0].salePrice).toBe(100);
    await expect(orderService.createOrder(customer, [{ productoTallaId: sizeId, cantidad: 1 }], undefined, undefined, 80)).rejects.toThrow("PRICE_CHANGED");
    expect((await prisma.producto_tallas.findUniqueOrThrow({ where: { id: sizeId } })).stock).toBe(10);
    expect(await prisma.ordenes.count({ where: { usuario_id: customer } })).toBe(0);
  });
  it("handles duplicate approvals and prevents an old request from reverting a new offer", async () => {
    const [old] = await discountService.createRequest(inventory, { productoTallaIds: [sizeId], porcentaje: 20, motivo: "QA", duracionHoras: 24 });
    const decisions = await Promise.allSettled([discountService.reviewRequest(old.id, admin, "APPROVED"), discountService.reviewRequest(old.id, admin, "APPROVED")]);
    expect(decisions.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    await prisma.producto_tallas.update({ where: { id: sizeId }, data: { descuento_fin: new Date("2020-01-02"), descuento_inicio: new Date("2020-01-01") } });
    const [fresh] = await discountService.createRequest(inventory, { productoTallaIds: [sizeId], porcentaje: 20, motivo: "Nueva oferta" });
    await discountService.reviewRequest(fresh.id, admin, "APPROVED");
    await expect(discountService.revertRequest(old.id, admin)).rejects.toThrow("DISCOUNT_NOT_ACTIVE");
    expect((await prisma.producto_tallas.findUniqueOrThrow({ where: { id: sizeId } })).descuento_solicitud_id).toBe(fresh.id);
  });
  it("persists settings and keeps concurrent section updates", async () => {
    await Promise.all([settingsService.update({ storeName: "QA Store" }, admin), settingsService.update({ tolerance: "Flexible" }, admin)]);
    const row = await prisma.store_settings.findUniqueOrThrow({ where: { id: "store" } });
    expect(row.values).toMatchObject({ storeName: "QA Store", tolerance: "Flexible" });
    await settingsService.update({ storeName: "FITLOOK Perú", tolerance: "Moderado" }, admin);
  });

  it("uses paid prices for returns, prevents over-returning, restores stock once and confirms refunds once", async () => {
    const order = await orderService.createOrder(customer, [{ productoTallaId: sizeId, cantidad: 2 }]);
    await prisma.ordenes.update({ where: { id: order.id }, data: { estado: "delivered", mp_payment_id: "qa-payment" } });
    const request = await returnService.create(customer, { orderId: order.id, reason: "Cambio de talla", items: [{ sizeId, quantity: 2 }] });
    expect(request.amount).toBe(200);
    await expect(returnService.create(customer, { orderId: order.id, reason: "Otra solicitud", items: [{ sizeId, quantity: 1 }] })).rejects.toThrow("RETURN_QUANTITY_EXCEEDED");
    await returnService.review(request.id, admin, "APPROVED");
    await expect(returnService.refund(request.id)).rejects.toThrow("RETURN_NOT_RECEIVED");
    const receive = await Promise.allSettled([returnService.receive(request.id, admin), returnService.receive(request.id, admin)]);
    expect(receive.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await prisma.producto_tallas.findUniqueOrThrow({ where: { id: sizeId } })).stock).toBe(10);
    const refund = vi.spyOn(mercadoPagoService, "refundPayment").mockResolvedValue({ id: "qa-refund", approved: true });
    try {
      await returnService.refund(request.id); await returnService.refund(request.id);
      expect(refund).toHaveBeenCalledTimes(1);
      expect((await prisma.ordenes.findUniqueOrThrow({ where: { id: order.id } })).refunded_amount.toNumber()).toBe(200);
      expect((await returnService.list(customer))[0].status).toBe("REFUNDED");
    } finally { refund.mockRestore(); }
  });

  it("restores a cancelled unpaid reservation exactly once", async () => {
    const order = await orderService.createOrder(customer, [{ productoTallaId: sizeId, cantidad: 2 }]);
    const decisions = await Promise.allSettled([adminService.updateOrderStatus(order.id, "cancelled"), adminService.updateOrderStatus(order.id, "cancelled")]);
    expect(decisions.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await prisma.producto_tallas.findUniqueOrThrow({ where: { id: sizeId } })).stock).toBe(10);
  });

  it("enforces actual API roles, MFA and support-ticket ownership with the isolated database", async () => {
    const { authService } = await import("../src/services/auth");
    const token = vi.spyOn(authService, "verifyToken").mockImplementation(async (value) => ({ valid: true, claims: { sub: value, extra: { role: "admin", mfa_verified: true } } }));
    const app = express(); app.use(express.json());
    app.use("/api/products", (await import("../src/routes/products")).default);
    app.use("/api/admin", (await import("../src/routes/admin")).default);
    app.use("/api/inventory", (await import("../src/routes/inventory")).default);
    app.use("/api/support", (await import("../src/routes/support")).default);
    app.use("/api/returns", (await import("../src/routes/returns")).default);
    app.use("/api/virtual-tryon", (await import("../src/routes/virtualTryOn")).default);
    const server = createServer(app); await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as { port: number };
    const { notifications } = await import("../src/services/notifications");
    const notificationSpies = [
      vi.spyOn(notifications, "notifyDiscountRequestCreated").mockResolvedValue(undefined),
      vi.spyOn(notifications, "notifyDiscountDecision").mockResolvedValue(undefined),
    ];
    const request = (path: string, userId?: string, init: RequestInit = {}) => fetch(`http://127.0.0.1:${address.port}/api${path}`, { ...init, headers: { "Content-Type": "application/json", ...(userId ? { Authorization: `Bearer ${userId}` } : {}) } });
    try {
      expect((await request("/products")).status).toBe(200);
      expect((await request("/admin/settings")).status).toBe(401);
      expect((await request("/admin/settings", customer)).status).toBe(403); // JWT role does not override the database role.
      expect((await request("/admin/settings", admin)).status).toBe(200);
      expect((await request("/admin/finance/expenses", inventory, { method: "POST", body: JSON.stringify({ category: "Ops", description: "Flete", amount: 5 }) })).status).toBe(403);
      expect((await request("/admin/finance/expenses", admin, { method: "POST", body: JSON.stringify({ category: "x", description: "Flete", amount: 5 }) })).status).toBe(400);
      const savedExpense = await request("/admin/finance/expenses", admin, { method: "POST", body: JSON.stringify({ category: "Operaciones", description: "Flete API", amount: 12.5 }) });
      expect(savedExpense.status).toBe(201);
      expenseIds.push((await savedExpense.json()).expense.id);
      expect((await (await request("/admin/finance/expenses?period=month", admin)).json()).expenses.some((expense: { description: string }) => expense.description === "Flete API")).toBe(true);
      expect((await request("/admin/products", customer)).status).toBe(403);
      const productList = await request("/admin/products", admin);
      expect(productList.status).toBe(200);
      expect((await productList.json()).products.some((product: { id: string }) => product.id === productId)).toBe(true);
      expect((await request("/inventory/discount-requests", admin, { method: "POST", body: JSON.stringify({ productoTallaIds: [sizeId], porcentaje: 20, motivo: "API QA", duracionHoras: 24 }) })).status).toBe(403);
      const createdDiscount = await request("/inventory/discount-requests", inventory, { method: "POST", body: JSON.stringify({ productoTallaIds: [sizeId], porcentaje: 20, motivo: "API QA", duracionHoras: 24 }) });
      expect(createdDiscount.status).toBe(201);
      const pendingDiscount = (await createdDiscount.json()).requests[0];
      expect((await request(`/admin/discount-requests/${pendingDiscount.id}/review`, inventory, { method: "PUT", body: JSON.stringify({ decision: "APPROVED" }) })).status).toBe(403);
      expect((await request(`/admin/discount-requests/${pendingDiscount.id}/review`, admin, { method: "PUT", body: JSON.stringify({ decision: "APPROVED" }) })).status).toBe(200);
      expect((await (await request("/admin/products", admin)).json()).products.find((product: { id: string }) => product.id === productId).tallas[0].salePrice).toBe(80);
      expect((await request("/support", customer, { method: "POST", body: JSON.stringify({ subject: "QA consulta", message: "Necesito información del pedido" }) })).status).toBe(201);
      expect((await (await request("/support", inventory)).json()).tickets).toHaveLength(0);
      expect((await (await request("/support", customer)).json()).tickets).toHaveLength(1);
      expect((await (await request("/admin/support", admin)).json()).tickets.some((ticket: { subject: string }) => ticket.subject === "QA consulta")).toBe(true);
      expect((await request("/returns", customer, { method: "POST", body: JSON.stringify({ orderId: randomUUID(), reason: "No es mi compra", items: [{ sizeId, quantity: 1 }] }) })).status).toBe(404);
      await prisma.usuarios.update({ where: { id: admin }, data: { blocked: true } });
      expect((await request("/admin/settings", admin)).status).toBe(401);
    } finally {
      token.mockRestore();
      notificationSpies.forEach((spy) => spy.mockRestore());
      await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
  });

  it("handles concurrent payment events without restoring reserved stock twice", async () => {
    const { applyPaymentToOrder } = await import("../src/services/mercadoPago");
    const { notifications } = await import("../src/services/notifications");
    const notify = vi.spyOn(notifications, "notifyPaymentStatus").mockResolvedValue(undefined);
    try {
      const order = await orderService.createOrder(customer, [{ productoTallaId: sizeId, cantidad: 2 }]);
      const keys = [randomUUID(), randomUUID()].map((key) => `qa-${key}`); eventKeys.push(...keys);
      const payment = { id: `qa-${order.id}`, status: "rejected", external_reference: order.id };
      await Promise.all(keys.map((eventKey) => applyPaymentToOrder(payment, { eventKey, topic: "payment" })));
      expect((await prisma.producto_tallas.findUniqueOrThrow({ where: { id: sizeId } })).stock).toBe(10);
      expect((await prisma.ordenes.findUniqueOrThrow({ where: { id: order.id } })).estado).toBe("cancelled");
    } finally { notify.mockRestore(); }
  });

  it("stress-reserves finite stock across 30 simultaneous checkout attempts without overselling", async () => {
    const attempts = Array.from({ length: 30 }, () => orderService.createOrder(customer, [{ productoTallaId: sizeId, cantidad: 1 }]));
    const results = await Promise.allSettled(attempts);
    const accepted = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    expect(accepted, `unexpected transaction failures: ${rejected.map((result) => String(result.reason)).join("; ")}`).toHaveLength(10);
    expect(rejected).toHaveLength(20);
    expect(rejected.every((result) => result.reason instanceof Error && result.reason.message === "INSUFFICIENT_STOCK")).toBe(true);
    expect((await prisma.producto_tallas.findUniqueOrThrow({ where: { id: sizeId } })).stock).toBe(0);
    expect(await prisma.ordenes.count({ where: { usuario_id: customer } })).toBe(10);
  }, 30_000);

  it("rate-limits try-on session starts under concurrent burst traffic", async () => {
    await settingsService.update({ limit: 5 }, admin);
    const sessionPrefix = `stress-${randomUUID().slice(0, 8)}-`;
    stressSessionPrefixes.push(sessionPrefix);
    const app = express(); app.use(express.json()); app.use("/api/virtual-tryon", (await import("../src/routes/virtualTryOn")).default);
    const server = createServer(app); await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as { port: number };
    try {
      const responses = await Promise.all(Array.from({ length: 20 }, (_, index) => fetch(`http://127.0.0.1:${address.port}/api/virtual-tryon/events`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: `${sessionPrefix}${index}`, type: "session_started" }),
      })));
      expect(responses.filter((response) => response.status === 201 || response.status === 200)).toHaveLength(5);
      expect(responses.filter((response) => response.status === 429)).toHaveLength(15);
      expect(await prisma.virtual_tryon_events.count({ where: { tipo: "session_started", sesion_id: { startsWith: sessionPrefix } } })).toBe(5);
    } finally { await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())); }
  }, 30_000);

  it("persists operating expenses and includes them in net finance reports", async () => {
    const { expenseService } = await import("../src/services/expenses");
    const before = await adminService.getFinanceSummary("month");
    const expense = await expenseService.create(admin, { category: "Operaciones", description: "Envío de almacén", amount: 25.5, spentAt: new Date().toISOString().slice(0, 10) });
    expenseIds.push(expense.id);
    const summary = await adminService.getFinanceSummary("month");
    expect(summary.expenseTotal).toBe(before.expenseTotal + 25.5);
    expect(summary.expenses.length).toBe(before.expenses.length + 1);
    expect(summary.transactions.some((item) => item.description === "Envío de almacén" && item.type === "Gasto" && item.amount === -25.5)).toBe(true);
    expect(summary.revenue).toBe(before.revenue - 25.5);
  });
});
