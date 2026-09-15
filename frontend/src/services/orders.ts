import api from "./api";
import type { CartItem } from "../context/CartContext";

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
}

export interface OrderView {
  id: string;
  numero: string;
  total: number;
  estado: string;
  fechaOrden: string | null;
  entries: OrderEntryView[];
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

export async function createOrder(entries: CreateOrderEntry[]): Promise<OrderView> {
  const { data } = await api.post("/orders", { entries });
  return data.order as OrderView;
}

export async function fetchMyOrders(): Promise<OrderView[]> {
  const { data } = await api.get("/orders");
  return data.orders as OrderView[];
}
