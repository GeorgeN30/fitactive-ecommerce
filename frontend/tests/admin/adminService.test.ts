import { describe, it, expect } from "vitest";
import {
  fetchDashboardStats,
  fetchSalesData,
  fetchTopProducts,
  fetchCategories,
  fetchProducts,
  createProduct,
  deleteProduct,
  fetchOrders,
  updateOrderStatus,
  fetchCustomers,
  toggleCustomerStatus,
  updateCustomerRole,
  fetchInventory,
  updateStock,
  fetchArMetrics,
} from "../../src/services/admin";

describe("adminService (mock)", () => {
  it("retorna las estadisticas del dashboard", async () => {
    const stats = await fetchDashboardStats();
    expect(stats).toMatchObject({ totalSales: expect.any(Number), totalOrders: expect.any(Number) });
  });

  it("retorna series de ventas y categorias", async () => {
    const [sales, categories] = await Promise.all([fetchSalesData(), fetchCategories()]);
    expect(sales.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("gestiona productos: listar, crear y eliminar", async () => {
    const initial = await fetchProducts();
    expect(initial.length).toBeGreaterThan(0);

    const created = await createProduct({ name: "Test", description: "", category: "Clothing", sport: "Gym", price: 10, sizes: [], status: "Active", imageUrl: "", isPublished: true });
    expect(created.id).toBeTruthy();

    await deleteProduct(created.id);
    const after = await fetchProducts();
    expect(after.find((p) => p.id === created.id)).toBeUndefined();
  });

  it("gestiona pedidos y su estado", async () => {
    const orders = await fetchOrders();
    expect(orders.length).toBeGreaterThan(0);
    await expect(updateOrderStatus(orders[0].id, "Shipped")).resolves.toBeUndefined();
  });

  it("gestiona clientes y sus roles", async () => {
    const customers = await fetchCustomers();
    expect(customers.length).toBeGreaterThan(0);
    await expect(toggleCustomerStatus(customers[0].id)).resolves.toBeUndefined();
    await expect(updateCustomerRole(customers[0].id, "Admin")).resolves.toBeUndefined();
  });

  it("gestiona inventario y movimientos", async () => {
    const products = await fetchInventory();
    expect(products.length).toBeGreaterThan(0);
    await expect(updateStock(products[0].id, "M", 5)).resolves.toBeUndefined();
  });

  it("retorna metricas del probador AR", async () => {
    const metrics = await fetchArMetrics();
    expect(metrics).toHaveProperty("totalTests");
    expect(metrics).toHaveProperty("conversionRate");
  });

  it("retorna top productos y top categorias", async () => {
    const [topProducts, topCategories] = await Promise.all([fetchTopProducts(), fetchCategories()]);
    expect(topProducts.length).toBeGreaterThan(0);
    expect(topCategories.length).toBeGreaterThan(0);
  });
});