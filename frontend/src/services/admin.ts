import api from "./api";
import type {
  Product as AdminPrototypeProduct,
  Order as AdminPrototypeOrder,
  User as AdminPrototypeUser,
} from "../data/adminPrototypeTypes";
import type {
  InventoryMovement,
  DashboardStats,
  TopProduct,
  CategoryData,
  SalesDataPoint,
  ArMetrics,
} from "../data/types";
import { mockArMetrics } from "../data/mock";

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=700&fit=crop&auto=format";

interface BackendTalla {
  id: string;
  talla: string;
  stock: number;
  discountPercent?: number;
  salePrice?: number;
  rangoCmMin?: number | null;
  rangoCmMax?: number | null;
}

interface BackendProduct {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  precio: number;
  imagenUrl: string | null;
  imageUrls?: string[];
  genero: string | null;
  fechaCreacion: string | null;
  tallas: BackendTalla[];
  totalStock: number;
}

interface BackendOrder {
  id: string;
  numero: string;
  estado: string;
  total: number;
  fechaOrden: string | null;
  customer: { id: string; email: string; name: string | null };
  items: {
    productoId: string;
    nombre: string;
    talla: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

interface BackendCustomer {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: string;
  blocked: boolean;
  points: number;
  fechaCreacion: string | null;
  medidaPecho: number | null;
  medidaCintura: number | null;
  medidaCadera: number | null;
  orders: number;
  spent: number;
}

interface BackendMovement {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  fecha: string | null;
  producto: string;
  talla: string;
  responsable: string;
}

export interface ProductTallaInput {
  talla: string;
  stock?: number;
}

export interface ProductInput {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  precio: number;
  imagenUrl?: string;
  imageUrls?: string[];
  genero?: string;
  tallas?: ProductTallaInput[];
}

function toDisplayDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function toPrototypeProduct(p: BackendProduct): AdminPrototypeProduct {
  const sizes = p.tallas.map((t) => t.talla);
  const stock: Record<string, number> = Object.fromEntries(
    p.tallas.map((t) => [t.talla, t.stock]),
  );
  const tallaIds: Record<string, string> = Object.fromEntries(
    p.tallas.map((t) => [t.talla, t.id]),
  );
  const discounts = Object.fromEntries(
    p.tallas.map((t) => [
      t.talla,
      {
        percent: t.discountPercent ?? 0,
        salePrice: t.salePrice ?? p.precio,
      },
    ]),
  );
  const imageUrls = p.imageUrls?.length
    ? p.imageUrls
    : p.imagenUrl
      ? [p.imagenUrl]
      : [];
  const image = imageUrls[0] || DEFAULT_PRODUCT_IMAGE;
  return {
    id: p.id,
    name: p.nombre,
    category: p.categoria || "Clothing",
    sport: "Training",
    price: p.precio,
    image,
    images: imageUrls,
    sizes,
    availableColors: [{ name: "Único", hex: "#1a1a1a" }],
    description: p.descripcion || "",
    stock,
    tallaIds,
    discounts,
    gender:
      p.genero === "male"
        ? "male"
        : p.genero === "female"
          ? "female"
          : "unisex",
    measurements: { chest: [80, 110], waist: [60, 100], hips: [80, 115] },
    featured: false,
    minStock: 5,
  };
}

function toPrototypeOrder(o: BackendOrder): AdminPrototypeOrder {
  return {
    id: o.id,
    orderNumber: o.numero || o.id,
    userId: o.customer.id,
    items: o.items.map((item) => ({
      productId: item.productoId,
      name: item.nombre,
      size: item.talla,
      color: "Único",
      quantity: item.cantidad,
    })),
    total: o.total,
    subtotal: o.total,
    discount: 0,
    date: toDisplayDate(o.fechaOrden),
    estimatedDelivery: "",
    status: normalizeOrderStatus(o.estado),
    address: "",
    district: "",
    city: "",
    paymentMethod: "Mercado Pago",
    customer: {
      name: o.customer.name || o.customer.email,
      email: o.customer.email,
      phone: "",
    },
  };
}

function normalizeOrderStatus(status: string): AdminPrototypeOrder["status"] {
  const normalized = status.toLowerCase();
  if (normalized === "returned") return "return";
  if (
    ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "return"].includes(
      normalized,
    )
  ) {
    return normalized as AdminPrototypeOrder["status"];
  }
  return "pending";
}

function toPrototypeUser(u: BackendCustomer): AdminPrototypeUser {
  const name = u.name || u.email;
  const avatar =
    u.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00E87A&color=fff`;
  const registeredAt = toDisplayDate(u.fechaCreacion);
  const role: AdminPrototypeUser["role"] =
    u.role === "admin"
      ? "admin"
      : u.role === "inventory" || u.role === "receptionist"
        ? "inventory"
        : "client";
  return {
    id: u.id,
    name,
    email: u.email,
    phone: "",
    avatar,
    role,
    blocked: u.blocked,
    customerMeasurements:
      u.medidaPecho !== null || u.medidaCintura !== null || u.medidaCadera !== null
        ? {
            chest: u.medidaPecho,
            waist: u.medidaCintura,
            hips: u.medidaCadera,
            updatedAt: registeredAt,
          }
        : undefined,
    registeredAt,
    lastAccess: registeredAt,
    orders: u.orders,
    spent: u.spent,
  };
}

function toInventoryMovement(m: BackendMovement): InventoryMovement {
  const tipo =
    m.tipo.toUpperCase() === "ENTRADA"
      ? "Entry"
      : m.tipo.toUpperCase() === "SALIDA"
        ? "Exit"
        : "Adjustment";
  return {
    id: m.id,
    datetime: toDisplayDate(m.fecha),
    productName: m.producto,
    type: tipo,
    quantity: m.cantidad,
    responsible: m.responsable,
    size: m.talla,
    note: m.motivo || undefined,
  };
}

const CATEGORY_COLORS = [
  "#00FF66",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
];

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get("/admin/dashboard/stats");
  const stats = data.stats || {};
  return {
    totalSales: stats.revenue ?? 0,
    salesGrowth: 0,
    totalOrders: stats.totalOrders ?? 0,
    ordersGrowth: 0,
    activeCustomers: stats.totalCustomers ?? 0,
    customersGrowth: 0,
    productsSold: stats.totalUnitsSold ?? 0,
    productsGrowth: 0,
    totalReturns: stats.totalReturns ?? 0,
  };
}

export async function fetchSalesData(): Promise<SalesDataPoint[]> {
  const { data } = await api.get("/admin/dashboard/sales-chart");
  return (data.sales || []).map((point: { label: string; value: number }) => ({
    label: point.label,
    value: point.value,
  }));
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  const { data } = await api.get("/admin/dashboard/top-products");
  const max =
    (data.products || []).reduce(
      (top: number, p: { units: number }) => Math.max(top, p.units || 0),
      0,
    ) || 1;
  return (data.products || []).map(
    (p: { name: string; units: number }) => ({
      name: p.name,
      unitsSold: p.units || 0,
      percentage: Math.round(((p.units || 0) / max) * 100),
    }),
  );
}

export async function fetchCategories(): Promise<CategoryData[]> {
  const { data } = await api.get("/admin/dashboard/categories");
  const total =
    (data.categories || []).reduce(
      (sum: number, c: { count: number }) => sum + (c.count || 0),
      0,
    ) || 1;
  return (data.categories || []).map(
    (c: { name: string; count: number }, index: number) => ({
      name: c.name,
      percentage: Math.round(((c.count || 0) / total) * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }),
  );
}

export async function fetchProducts(): Promise<AdminPrototypeProduct[]> {
  const { data } = await api.get("/admin/products");
  return (data.products || []).map(toPrototypeProduct);
}

export async function createProduct(
  input: ProductInput,
  basePath = "/admin",
): Promise<AdminPrototypeProduct> {
  const { data } = await api.post(`${basePath}/products`, input);
  return toPrototypeProduct(data.product);
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  basePath = "/admin",
): Promise<AdminPrototypeProduct> {
  const { data } = await api.put(`${basePath}/products/${id}`, input);
  return toPrototypeProduct(data.product);
}

export async function deleteProduct(id: string, basePath = "/admin"): Promise<void> {
  await api.delete(`${basePath}/products/${id}`);
}

export async function fetchOrders(): Promise<AdminPrototypeOrder[]> {
  const { data } = await api.get("/admin/orders");
  return (data.orders || []).map(toPrototypeOrder);
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<void> {
  await api.put(`/admin/orders/${id}/status`, { status });
}

export async function fetchCustomers(): Promise<AdminPrototypeUser[]> {
  const { data } = await api.get("/admin/customers");
  return (data.customers || []).map(toPrototypeUser);
}

export async function fetchUsers(): Promise<AdminPrototypeUser[]> {
  const { data } = await api.get("/admin/users");
  return (data.users || []).map(toPrototypeUser);
}

export async function updateCustomerRole(
  id: string,
  role: string,
): Promise<AdminPrototypeUser> {
  const { data } = await api.put(`/admin/users/${id}/role`, { role });
  return toPrototypeUser(data.customer as BackendCustomer);
}

export async function updateCustomerStatus(
  id: string,
  blocked: boolean,
): Promise<AdminPrototypeUser> {
  const { data } = await api.put(`/admin/customers/${id}/status`, { blocked });
  return toPrototypeUser(data.customer as BackendCustomer);
}

export async function fetchInventory(): Promise<AdminPrototypeProduct[]> {
  const { data } = await api.get("/inventory/products");
  return (data.products || []).map(toPrototypeProduct);
}

export async function updateStock(
  productId: string,
  size: string,
  quantity: number,
  motivo?: string,
): Promise<AdminPrototypeProduct> {
  const { data } = await api.put(`/inventory/products/${productId}/stock`, {
    size,
    quantity,
    motivo,
  });
  return toPrototypeProduct(data.product);
}

export async function fetchMovements(): Promise<InventoryMovement[]> {
  const { data } = await api.get("/inventory/movements");
  return (data.movements || []).map(toInventoryMovement);
}

export async function fetchLowStock(): Promise<AdminPrototypeProduct[]> {
  const { data } = await api.get("/inventory/low-stock");
  return (data.products || []).map(toPrototypeProduct);
}

export async function fetchArMetrics(): Promise<ArMetrics> {
  return mockArMetrics;
}
