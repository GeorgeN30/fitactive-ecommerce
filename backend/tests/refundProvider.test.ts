import { beforeEach, describe, expect, it, vi } from "vitest";
const { create, get } = vi.hoisted(() => ({ create: vi.fn(), get: vi.fn() }));
vi.mock("../src/config/env", () => ({ config: { mercadoPago: { accessToken: "TEST-mocked", currencyId: "PEN" } } }));
vi.mock("../src/config/prisma", () => ({ prisma: {} }));
vi.mock("../src/services/notifications", () => ({ notifications: {} }));
vi.mock("mercadopago", () => ({ MercadoPagoConfig: class {}, PaymentRefund: class { create = create; get = get; }, Payment: class {}, Preference: class {}, MerchantOrder: class {} }));
import { mercadoPagoService, resolvePaymentOrderStatus } from "../src/services/mercadoPago";
describe("refund provider contract", () => {
  beforeEach(() => vi.clearAllMocks());
  it("uses a stable idempotency key and does not claim pending refunds are complete", async () => {
    create.mockResolvedValue({ id: 123, amount: 80, status: "in_process" });
    expect(await mercadoPagoService.refundPayment("payment1", 80, "request1")).toEqual({ id: "123", approved: false });
    expect(create).toHaveBeenCalledWith({ payment_id: "payment1", body: { amount: 80 }, requestOptions: { idempotencyKey: "fitlook-return-request1" } });
    get.mockResolvedValue({ id: 123, amount: 80, status: "approved" });
    expect(await mercadoPagoService.refundPayment("payment1", 80, "request1", "123")).toEqual({ id: "123", approved: true });
    expect(create).toHaveBeenCalledTimes(1);
  });
  it("rejects mismatched or rejected refunds", async () => {
    for (const response of [{ id: 123, amount: 10, status: "approved" }, { id: 123, amount: 80, status: "rejected" }]) {
      create.mockResolvedValue(response); await expect(mercadoPagoService.refundPayment("payment1", 80, "request1")).rejects.toThrow("REFUND_NOT_CONFIRMED");
    }
  });
  it("does not reset shipped, delivered or returned orders on repeated approved payment updates", () => {
    for (const status of ["preparing", "shipped", "delivered", "return"]) expect(resolvePaymentOrderStatus(status, "approved")).toBe(status);
    expect(resolvePaymentOrderStatus("pending", "approved")).toBe("confirmed");
  });
});
