import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../src/services/api";
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchCustomers,
  fetchDashboardStats,
  fetchInventory,
  fetchLowStock,
  fetchMovements,
  fetchOrders,
  fetchProducts,
  fetchSalesData,
  fetchTopProducts,
  fetchUsers,
  updateProduct,
  updateCustomerRole,
  updateStock,
} from "../../src/services/admin";

vi.mock("../../src/services/api", () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const backendProduct = {
  id: "p1",
  nombre: "Polo técnico",
  descripcion: "Polo para entrenamiento",
  categoria: "Polos",
  marca: "FitActive",
  precio: 89.9,
  imagenUrl: null,
  genero: "unisex",
  fechaCreacion: "2026-09-01T00:00:00.000Z",
  tallas: [{ id: "t1", talla: "M", stock: 4 }],
  totalStock: 4,
};

describe("admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps dashboard metrics and chart data from the API", async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          stats: {
            revenue: 249.5,
            totalOrders: 3,
            totalCustomers: 2,
            totalUnitsSold: 5,
            totalReturns: 1,
          },
        },
      })
      .mockResolvedValueOnce({
        data: { sales: [{ label: "Sep 01", value: 249.5 }] },
      })
      .mockResolvedValueOnce({
        data: { products: [{ name: "Polo técnico", units: 5 }] },
      })
      .mockResolvedValueOnce({
        data: { categories: [{ name: "Polos", count: 3 }] },
      });

    await expect(fetchDashboardStats()).resolves.toMatchObject({
      totalSales: 249.5,
      totalOrders: 3,
      activeCustomers: 2,
      productsSold: 5,
      totalReturns: 1,
    });
    await expect(fetchSalesData()).resolves.toEqual([
      { label: "Sep 01", value: 249.5 },
    ]);
    await expect(fetchTopProducts()).resolves.toEqual([
      { name: "Polo técnico", unitsSold: 5, percentage: 100 },
    ]);
    await expect(fetchCategories()).resolves.toEqual([
      { name: "Polos", percentage: 100, color: "#00FF66" },
    ]);
  });

  it("maps products and uses the configured admin or inventory paths", async () => {
    mockedApi.get.mockResolvedValue({ data: { products: [backendProduct] } });
    mockedApi.post.mockResolvedValue({ data: { product: backendProduct } });
    mockedApi.put.mockResolvedValue({ data: { product: backendProduct } });
    mockedApi.delete.mockResolvedValue({ data: {} });

    const products = await fetchProducts();
    const created = await createProduct(
      { nombre: "Polo técnico", precio: 89.9 },
      "/inventory",
    );
    const updated = await updateProduct(
      "p1",
      { nombre: "Polo técnico", precio: 99.9 },
      "/inventory",
    );
    await deleteProduct("p1", "/inventory");

    expect(products[0]).toMatchObject({
      id: "p1",
      name: "Polo técnico",
      stock: { M: 4 },
    });
    expect(created.id).toBe("p1");
    expect(updated.id).toBe("p1");
    expect(mockedApi.post).toHaveBeenCalledWith("/inventory/products", {
      nombre: "Polo técnico",
      precio: 89.9,
    });
    expect(mockedApi.put).toHaveBeenCalledWith("/inventory/products/p1", {
      nombre: "Polo técnico",
      precio: 99.9,
    });
    expect(mockedApi.delete).toHaveBeenCalledWith("/inventory/products/p1");
  });

  it("maps orders and customers returned by the backend", async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          orders: [
            {
              id: "o1",
              numero: "ORD-001",
              estado: "DELIVERED",
              total: 120,
              fechaOrden: "2026-09-02T00:00:00.000Z",
              customer: { id: "u1", email: "ana@example.com", name: "Ana" },
              items: [
                {
                  productoId: "p1",
                  nombre: "Polo técnico",
                  talla: "M",
                  cantidad: 2,
                  precioUnitario: 60,
                  subtotal: 120,
                },
              ],
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          customers: [
            {
              id: "u1",
              email: "ana@example.com",
              name: "Ana",
              picture: null,
              points: 10,
              fechaCreacion: "2026-09-01T00:00:00.000Z",
              medidaPecho: null,
              medidaCintura: null,
              medidaCadera: null,
              orders: 2,
              spent: 240,
            },
          ],
        },
      });

    const orders = await fetchOrders();
    const customers = await fetchCustomers();

    expect(orders[0]).toMatchObject({
      id: "o1",
      orderNumber: "ORD-001",
      status: "delivered",
      items: [{ productId: "p1", quantity: 2 }],
    });
    expect(customers[0]).toMatchObject({
      id: "u1",
      name: "Ana",
      orders: 2,
      spent: 240,
    });
  });

  it("uses the inventory endpoints for stock and movement data", async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { products: [backendProduct] } })
      .mockResolvedValueOnce({
        data: {
          movements: [
            {
              id: "m1",
              tipo: "ENTRADA",
              cantidad: 4,
              motivo: "Compra",
              fecha: "2026-09-03T00:00:00.000Z",
              producto: "Polo técnico",
              talla: "M",
              responsable: "Almacén",
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { products: [backendProduct] } });
    mockedApi.put.mockResolvedValue({ data: { product: backendProduct } });

    await fetchInventory();
    const movements = await fetchMovements();
    await fetchLowStock();
    await updateStock("p1", "M", 7, "Conteo físico");

    expect(movements[0]).toMatchObject({
      id: "m1",
      type: "Entry",
      quantity: 4,
      size: "M",
    });
    expect(mockedApi.put).toHaveBeenCalledWith(
      "/inventory/products/p1/stock",
      { size: "M", quantity: 7, motivo: "Conteo físico" },
    );
  });

  it("loads all users and updates a user's role through the admin API", async () => {
    const backendUser = {
      id: "u1",
      email: "ana@example.com",
      name: "Ana",
      picture: null,
      role: "customer",
      blocked: false,
      points: 0,
      fechaCreacion: "2026-09-01T00:00:00.000Z",
      medidaPecho: null,
      medidaCintura: null,
      medidaCadera: null,
      orders: 2,
      spent: 120,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { users: [backendUser] } });
    mockedApi.put.mockResolvedValueOnce({
      data: { customer: { ...backendUser, role: "inventory" } },
    });

    const users = await fetchUsers();
    const updated = await updateCustomerRole("u1", "inventory");

    expect(mockedApi.get).toHaveBeenCalledWith("/admin/users");
    expect(mockedApi.put).toHaveBeenCalledWith("/admin/users/u1/role", {
      role: "inventory",
    });
    expect(users[0]).toMatchObject({ id: "u1", role: "client" });
    expect(updated).toMatchObject({ id: "u1", role: "inventory" });
  });
});
