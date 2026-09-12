import api from "./api";
import type {
  Product,
  Order,
  Customer,
  InventoryMovement,
  DashboardStats,
  TopProduct,
  CategoryData,
  SalesDataPoint,
  ArMetrics,
} from "../data/types";
import {
  mockProducts,
  mockOrders,
  mockCustomers,
  mockMovements,
  mockDashboardStats,
  mockTopProducts,
  mockCategories,
  mockSalesData,
  mockArMetrics,
} from "../data/mock";

const USE_MOCK = true;

export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCK) return mockDashboardStats;
  const { data } = await api.get("/admin/dashboard/stats");
  return data;
}

export async function fetchSalesData(): Promise<SalesDataPoint[]> {
  if (USE_MOCK) return mockSalesData;
  const { data } = await api.get("/admin/dashboard/sales-chart");
  return data;
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  if (USE_MOCK) return mockTopProducts;
  const { data } = await api.get("/admin/dashboard/top-products");
  return data;
}

export async function fetchCategories(): Promise<CategoryData[]> {
  if (USE_MOCK) return mockCategories;
  const { data } = await api.get("/admin/dashboard/categories");
  return data;
}

export async function fetchProducts(): Promise<Product[]> {
  if (USE_MOCK) return mockProducts;
  const { data } = await api.get("/admin/products");
  return data;
}

export async function createProduct(
  product: Omit<Product, "id" | "sku" | "totalStock">,
): Promise<Product> {
  if (USE_MOCK) {
    return {
      ...product,
      id: String(Date.now()),
      sku: `FT-${product.sport.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      totalStock: product.sizes.reduce((sum, s) => sum + s.stock, 0),
    };
  }
  const { data } = await api.post("/admin/products", product);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (USE_MOCK) return;
  await api.delete(`/admin/products/${id}`);
}

export async function fetchOrders(): Promise<Order[]> {
  if (USE_MOCK) return mockOrders;
  const { data } = await api.get("/admin/orders");
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<void> {
  if (USE_MOCK) return;
  await api.put(`/admin/orders/${id}/status`, { status });
}

export async function fetchCustomers(): Promise<Customer[]> {
  if (USE_MOCK) return mockCustomers;
  const { data } = await api.get("/admin/customers");
  return data;
}

export async function toggleCustomerStatus(id: string): Promise<void> {
  if (USE_MOCK) return;
  await api.put(`/admin/customers/${id}/status`);
}

export async function updateCustomerRole(
  id: string,
  role: string,
): Promise<void> {
  if (USE_MOCK) return;
  await api.put(`/admin/customers/${id}/role`, { role });
}

export async function fetchInventory(): Promise<Product[]> {
  if (USE_MOCK) return mockProducts;
  const { data } = await api.get("/admin/inventory");
  return data;
}

export async function updateStock(
  productId: string,
  size: string,
  quantity: number,
): Promise<void> {
  if (USE_MOCK) return;
  await api.put(`/admin/inventory/${productId}/stock`, { size, quantity });
}

export async function fetchMovements(): Promise<InventoryMovement[]> {
  if (USE_MOCK) return mockMovements;
  const { data } = await api.get("/admin/inventory/movements");
  return data;
}

export async function fetchArMetrics(): Promise<ArMetrics> {
  if (USE_MOCK) return mockArMetrics;
  const { data } = await api.get("/admin/metrics/ar");
  return data;
}
