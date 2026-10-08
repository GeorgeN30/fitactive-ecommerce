import api from "./api";
import type { CartItem } from "../context/CartContext";
import { getVirtualTryOnSessionId } from "./virtualTryOn";

export interface CreateOrderEntry {
  productoTallaId: string;
  cantidad: number;
}

export interface OrderEntryView {
  productoTallaId: string;
  nombre: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  imagenUrl?: string | null;
}

export interface OrderView {
  id: string;
  numero: string;
  total: number;
  estado: string;
  fechaOrden: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingCity: string | null;
  shippingReference: string | null;
  entries: OrderEntryView[];
}

export interface CheckoutDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingReference?: string;
}

export async function resolveOrderEntries(
  items: CartItem[],
): Promise<CreateOrderEntry[]> {
  const missing = items.filter((item) => !item.tallaId);

  if (missing.length === 0) {
    return items.map((item) => ({
      productoTallaId: item.tallaId as string,
      cantidad: item.quantity,
    }));
  }

  const { data } = await api.get("/products");
  const products: unknown[] = Array.isArray(data)
    ? data
    : ((data as { products?: unknown[]; data?: unknown[] }).products ??
      (data as { data?: unknown[] }).data ??
      []);

  return items.map((item) => {
    const product = products.find(
      (p) =>
        String((p as { id?: string }).id) === String(item.id),
    );
    const tallaRow = (
      (product as
        | {
            producto_tallas?: { id: string; talla: string }[];
            tallas?: { id: string; talla: string }[];
          }
        | undefined)?.producto_tallas ?? []
    ).concat(
      (product as { tallas?: { id: string; talla: string }[] } | undefined)
        ?.tallas ?? [],
    ).find((t) => String(t.talla) === String(item.size));

    const productoTallaId = item.tallaId ?? tallaRow?.id;

    if (!productoTallaId) {
      throw new Error("SIZE_NOT_FOUND");
    }

    return { productoTallaId, cantidad: item.quantity };
  });
}

export async function createOrder(
  entries: CreateOrderEntry[],
  tryOnSessionId?: string,
  checkoutDetails?: CheckoutDetails,
): Promise<OrderView> {
  const { data } = await api.post("/orders", {
    entries,
    tryOnSessionId: tryOnSessionId || getVirtualTryOnSessionId(),
    checkoutDetails,
  });
  return data.order as OrderView;
}

export interface MercadoPagoPreferenceView {
  orderId: string;
  orderNumber: string;
  preferenceId: string;
  initPoint: string;
}

export interface MercadoPagoOrderStatusView {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string | null;
  paymentStatusDetail: string | null;
  paymentId: string | null;
  preferenceId: string | null;
}

export async function createMercadoPagoPreference(
  orderId: string,
): Promise<MercadoPagoPreferenceView> {
  const { data } = await api.post("/payments/mercadopago/preferences", { orderId });
  return data.preference as MercadoPagoPreferenceView;
}

export async function fetchMercadoPagoOrderStatus(
  orderId: string,
  paymentId?: string,
): Promise<MercadoPagoOrderStatusView> {
  const { data } = await api.get(`/payments/mercadopago/orders/${orderId}`, {
    params: paymentId ? { payment_id: paymentId } : undefined,
  });
  return data.status as MercadoPagoOrderStatusView;
}

export async function fetchMyOrders(): Promise<OrderView[]> {
  const { data } = await api.get("/orders");
  return data.orders as OrderView[];
}

export function redirectToMercadoPago(initPoint: string): void {
  window.location.assign(initPoint);
}
