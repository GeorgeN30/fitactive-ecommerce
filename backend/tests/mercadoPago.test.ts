import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config/env", () => ({
  config: {
    mercadoPago: {
      accessToken: "",
      webhookSecret: "test-webhook-secret",
      currencyId: "PEN",
      appUrl: "http://localhost",
      webhookUrl: "",
    },
  },
}));

vi.mock("../src/config/prisma", () => ({
  prisma: {},
}));

vi.mock("../src/services/notifications", () => ({
  notifications: {
    notifyPaymentStatus: vi.fn(),
  },
}));

import {
  buildMercadoPagoRedirects,
  isValidMercadoPagoWebhookSignature,
} from "../src/services/mercadoPago";

describe("Mercado Pago Checkout Pro redirects", () => {
  it("omits auto_return for local Docker URLs", () => {
    expect(buildMercadoPagoRedirects("http://localhost", "order-1")).toEqual({});
  });

  it("configures return URLs only for public HTTPS URLs", () => {
    expect(buildMercadoPagoRedirects("https://fitlook.example.com/", "order-1")).toEqual({
      back_urls: {
        success: "https://fitlook.example.com/checkout/result?status=success&order_id=order-1",
        failure: "https://fitlook.example.com/checkout/result?status=failure&order_id=order-1",
        pending: "https://fitlook.example.com/checkout/result?status=pending&order_id=order-1",
      },
      auto_return: "approved",
    });
  });
});

describe("Mercado Pago webhook signature", () => {
  it("accepts a valid x-signature canonical string", () => {
    const body = { type: "payment", data: { id: "123456" } };
    const requestId = "request-123";
    const timestamp = "1710000000";
    const canonical = `id:${body.data.id};request-id:${requestId};ts:${timestamp};`;
    const signature = crypto
      .createHmac("sha256", "test-webhook-secret")
      .update(canonical)
      .digest("hex");

    expect(
      isValidMercadoPagoWebhookSignature(
        `ts=${timestamp},v1=${signature}`,
        requestId,
        body,
      ),
    ).toBe(true);
  });

  it("rejects a tampered signature or missing required headers", () => {
    const body = { type: "payment", data: { id: "123456" } };

    expect(
      isValidMercadoPagoWebhookSignature(
        "ts=1710000000,v1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "request-123",
        body,
      ),
    ).toBe(false);
    expect(isValidMercadoPagoWebhookSignature(undefined, "request-123", body)).toBe(false);
    expect(isValidMercadoPagoWebhookSignature("ts=1710000000", "request-123", body)).toBe(false);
  });
});
