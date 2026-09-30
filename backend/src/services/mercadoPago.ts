import crypto from "node:crypto";
import {
  MerchantOrder,
  MercadoPagoConfig,
  Payment,
  Preference,
} from "mercadopago";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { config } from "../config/env";
import { ORDER_STATUS } from "../constants";
import { notifications } from "./notifications";
import { roundToCents } from "../utils/pricing";

const mercadoPagoClient = config.mercadoPago.accessToken
  ? new MercadoPagoConfig({ accessToken: config.mercadoPago.accessToken })
  : null;

interface MercadoPagoPaymentResponse {
  id?: string | number;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  date_approved?: string | null;
}

export interface MercadoPagoWebhookBody {
  type?: string;
  data?: { id?: string | number };
}

export interface MercadoPagoPreferenceResult {
  orderId: string;
  orderNumber: string;
  preferenceId: string;
  initPoint: string;
}

export interface MercadoPagoOrderStatusResult {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string | null;
  paymentStatusDetail: string | null;
  paymentId: string | null;
  preferenceId: string | null;
}

function requireMercadoPagoClient(): MercadoPagoConfig {
  if (!mercadoPagoClient) {
    throw new Error("MERCADO_PAGO_NOT_CONFIGURED");
  }
  return mercadoPagoClient;
}

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function buildMercadoPagoRedirects(
  appUrl: string,
  orderId: string,
): { back_urls?: { success: string; failure: string; pending: string }; auto_return?: "approved" } {
  const normalizedUrl = trimTrailingSlash(appUrl);
  if (!isPublicHttpsUrl(normalizedUrl)) return {};

  const encodedOrderId = encodeURIComponent(orderId);
  return {
    back_urls: {
      success: `${normalizedUrl}/checkout/result?status=success&order_id=${encodedOrderId}`,
      failure: `${normalizedUrl}/checkout/result?status=failure&order_id=${encodedOrderId}`,
      pending: `${normalizedUrl}/checkout/result?status=pending&order_id=${encodedOrderId}`,
    },
    auto_return: "approved",
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeStatus(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function mapOrderStatus(paymentStatus: string): string {
  switch (paymentStatus) {
    case "approved":
      return ORDER_STATUS.CONFIRMED;
    case "rejected":
    case "cancelled":
    case "cancelled_by_payer":
    case "expired":
      return ORDER_STATUS.CANCELLED;
    case "refunded":
    case "charged_back":
      return ORDER_STATUS.RETURNED;
    default:
      return ORDER_STATUS.PENDING;
  }
}

function shouldReleaseReservedStock(paymentStatus: string, orderStatus: string): boolean {
  return (
    orderStatus === ORDER_STATUS.PENDING &&
    ["rejected", "cancelled", "cancelled_by_payer", "expired"].includes(paymentStatus)
  );
}

function parseApprovedAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function paymentResourceId(payment: MercadoPagoPaymentResponse): string {
  const id = payment.id === undefined || payment.id === null ? "" : String(payment.id);
  if (!id) throw new Error("MERCADO_PAGO_PAYMENT_ID_MISSING");
  return id;
}

function buildEventKey(topic: string, payment: MercadoPagoPaymentResponse): string {
  const id = paymentResourceId(payment);
  const status = normalizeStatus(payment.status) || "unknown";
  const detail = normalizeStatus(payment.status_detail) || "unknown";
  return `${topic}:${id}:${status}:${detail}`;
}

async function fetchPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
  const paymentClient = new Payment(requireMercadoPagoClient());
  const response = await paymentClient.get({
    id: paymentId,
    requestOptions: { idempotencyKey: `fitlook-payment-read-${paymentId}` },
  });
  return response as unknown as MercadoPagoPaymentResponse;
}

async function fetchMerchantOrder(merchantOrderId: string) {
  const merchantOrderClient = new MerchantOrder(requireMercadoPagoClient());
  return merchantOrderClient.get({
    merchantOrderId,
    requestOptions: { idempotencyKey: `fitlook-merchant-order-read-${merchantOrderId}` },
  });
}

async function findOrderForPayment(
  tx: Prisma.TransactionClient,
  payment: MercadoPagoPaymentResponse,
) {
  const paymentId = paymentResourceId(payment);
  const reference = typeof payment.external_reference === "string"
    ? payment.external_reference.trim()
    : "";
  const conditions: Prisma.ordenesWhereInput[] = [
    { mp_payment_id: paymentId },
  ];

  if (reference) {
    if (isUuid(reference)) conditions.push({ id: reference });
    conditions.push({ mp_preference_id: reference });
  }

  return tx.ordenes.findFirst({
    where: { OR: conditions },
    include: { orden_detalles: true },
  });
}

async function applyPaymentToOrder(
  payment: MercadoPagoPaymentResponse,
  options: { topic?: string; eventKey?: string } = {},
): Promise<MercadoPagoOrderStatusResult | null> {
  const paymentId = paymentResourceId(payment);
  const paymentStatus = normalizeStatus(payment.status) || "unknown";
  const paymentStatusDetail = normalizeStatus(payment.status_detail) || null;
  const nextOrderStatus = mapOrderStatus(paymentStatus);
  const eventKey = options.eventKey;

  const result = await prisma.$transaction(async (tx) => {
    if (eventKey) {
      try {
        await tx.mercadopago_webhook_events.create({
          data: {
            event_key: eventKey,
            topic: options.topic || "payment",
            resource_id: paymentId,
            payment_status: paymentStatus,
            payload: payment as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return { duplicate: true as const, order: null };
        }
        throw error;
      }
    }

    const order = await findOrderForPayment(tx, payment);
    if (!order) {
      return { duplicate: false as const, order: null };
    }

    if (shouldReleaseReservedStock(paymentStatus, order.estado || ORDER_STATUS.PENDING)) {
      for (const detail of order.orden_detalles) {
        await tx.producto_tallas.update({
          where: { id: detail.producto_talla_id },
          data: { stock: { increment: detail.cantidad } },
        });
      }
    }

    const updated = await tx.ordenes.update({
      where: { id: order.id },
      data: {
        estado: nextOrderStatus,
        mp_payment_id: paymentId,
        mp_status: paymentStatus,
        mp_status_detail: paymentStatusDetail,
        reservation_expires_at: null,
        mp_paid_at: paymentStatus === "approved"
          ? parseApprovedAt(payment.date_approved)
          : null,
      },
    });

    return { duplicate: false as const, order: updated };
  });

  if (result.duplicate || !result.order) return null;

  void notifications.notifyPaymentStatus({
    orderId: result.order.id,
    orderNumber: result.order.numero || result.order.id,
    customerId: result.order.usuario_id,
    orderStatus: result.order.estado || ORDER_STATUS.PENDING,
    paymentStatus,
  });

  return {
    orderId: result.order.id,
    orderNumber: result.order.numero || result.order.id,
    orderStatus: result.order.estado || ORDER_STATUS.PENDING,
    paymentStatus: result.order.mp_status,
    paymentStatusDetail: result.order.mp_status_detail,
    paymentId: result.order.mp_payment_id,
    preferenceId: result.order.mp_preference_id,
  };
}

export function isValidMercadoPagoWebhookSignature(
  signatureHeader: string | undefined,
  requestId: string | undefined,
  body: MercadoPagoWebhookBody,
): boolean {
  const secret = config.mercadoPago.webhookSecret;
  if (!secret || !signatureHeader || !requestId || !body.data?.id) return false;

  const values = new Map(
    signatureHeader.split(",").map((part) => {
      const separator = part.indexOf("=");
      return separator === -1
        ? [part.trim(), ""]
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  const timestamp = values.get("ts");
  const signature = values.get("v1");
  if (!timestamp || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;

  const canonical = `id:${String(body.data.id)};request-id:${requestId};ts:${timestamp};`;
  const expected = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

  return expected.length === signature.length && crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}

export const mercadoPagoService = {
  async createPreferenceForOrder(
    userId: string,
    orderId: string,
  ): Promise<MercadoPagoPreferenceResult> {
    const order = await prisma.ordenes.findFirst({
      where: { id: orderId, usuario_id: userId },
      include: {
        usuarios: { select: { email: true } },
        orden_detalles: {
          include: { producto_tallas: { include: { productos: true } } },
        },
      },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if ((order.estado || ORDER_STATUS.PENDING) !== ORDER_STATUS.PENDING) {
      throw new Error("ORDER_NOT_PAYABLE");
    }
    if (order.mp_init_point && order.mp_preference_id) {
      return {
        orderId: order.id,
        orderNumber: order.numero || order.id,
        preferenceId: order.mp_preference_id,
        initPoint: order.mp_init_point,
      };
    }

    const appUrl = trimTrailingSlash(config.mercadoPago.appUrl);
    const publicAppUrl = isPublicHttpsUrl(appUrl);
    if (config.nodeEnv === "production" && !publicAppUrl) {
      throw new Error("APP_URL_MUST_BE_HTTPS");
    }
    const configuredPayerEmail = config.mercadoPago.testBuyerEmail.trim();
    const payerEmail = config.nodeEnv === "production"
      ? order.usuarios.email
      : configuredPayerEmail;
    const configuredWebhookUrl = config.mercadoPago.webhookUrl.trim();
    const notificationUrl = isPublicHttpsUrl(configuredWebhookUrl)
      ? configuredWebhookUrl
      : publicAppUrl
        ? `${appUrl}/api/payments/mercadopago/webhook`
        : "";
    const redirectConfig = buildMercadoPagoRedirects(appUrl, order.id);
    const preference = new Preference(requireMercadoPagoClient());
    const response = await preference.create({
      body: {
        items: order.orden_detalles.map((detail) => ({
          id: detail.producto_tallas.producto_id,
          title: `${detail.producto_tallas.productos.nombre} - Talla ${detail.producto_tallas.talla}`,
          quantity: detail.cantidad,
          unit_price: roundToCents(detail.precio_unitario.toNumber()),
          currency_id: config.mercadoPago.currencyId,
        })),
        ...(payerEmail ? { payer: { email: payerEmail } } : {}),
        ...redirectConfig,
        // Checkout Pro returns the buyer to FitLook after an approved payment.
        // Production requires APP_URL to be public HTTPS. Local Docker omits
        // back_urls because Mercado Pago cannot redirect to localhost safely.
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
        external_reference: order.id,
        statement_descriptor: "FITLOOK",
      },
      requestOptions: { idempotencyKey: `fitlook-preference-${order.id}` },
    });

    const preferenceId = response.id ? String(response.id) : "";
    const initPoint = response.init_point || "";
    if (!preferenceId || !initPoint) {
      throw new Error("MERCADO_PAGO_PREFERENCE_INVALID");
    }

    await prisma.ordenes.update({
      where: { id: order.id },
      data: {
        mp_preference_id: preferenceId,
        mp_init_point: initPoint,
        mp_status: "created",
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.numero || order.id,
      preferenceId,
      initPoint,
    };
  },

  async getOrderPaymentStatus(
    userId: string,
    orderId: string,
    paymentId?: string,
  ): Promise<MercadoPagoOrderStatusResult> {
    if (paymentId) {
      const payment = await fetchPayment(paymentId);
      const reference = payment.external_reference?.trim();
      if (reference && reference !== orderId) {
        throw new Error("PAYMENT_ORDER_MISMATCH");
      }
      await applyPaymentToOrder(payment);
    }

    const order = await prisma.ordenes.findFirst({
      where: { id: orderId, usuario_id: userId },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");

    return {
      orderId: order.id,
      orderNumber: order.numero || order.id,
      orderStatus: order.estado || ORDER_STATUS.PENDING,
      paymentStatus: order.mp_status,
      paymentStatusDetail: order.mp_status_detail,
      paymentId: order.mp_payment_id,
      preferenceId: order.mp_preference_id,
    };
  },

  async processWebhook(body: MercadoPagoWebhookBody): Promise<void> {
    if (!body.type || !body.data?.id) return;

    if (body.type === "payment") {
      const payment = await fetchPayment(String(body.data.id));
      await applyPaymentToOrder(payment, {
        topic: body.type,
        eventKey: buildEventKey(body.type, payment),
      });
      return;
    }

    if (body.type === "merchant_order") {
      const merchantOrder = await fetchMerchantOrder(String(body.data.id));
      const latestPayment = [...(merchantOrder.payments || [])]
        .filter((payment) => payment.id !== undefined && payment.id !== null)
        .sort((left, right) => {
          const leftDate = left.last_modified || left.date_created || "";
          const rightDate = right.last_modified || right.date_created || "";
          return rightDate.localeCompare(leftDate);
        })[0];

      if (!latestPayment?.id) return;

      const payment: MercadoPagoPaymentResponse = {
        id: latestPayment.id,
        status: latestPayment.status,
        status_detail: latestPayment.status_details,
        date_approved: latestPayment.date_approved,
        external_reference: merchantOrder.external_reference,
      };
      await applyPaymentToOrder(payment, {
        topic: body.type,
        eventKey: buildEventKey(body.type, payment),
      });
    }
  },
};
