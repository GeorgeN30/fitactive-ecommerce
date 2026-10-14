import { test, expect, type Page } from "@playwright/test";

const customer = { id: "00000000-0000-4000-8000-000000000001", email: "qa@example.test", name: "Ana QA", role: "customer", onboarding_completado: true, twoFactorEnabled: false, genero: "Mujer", altura: 160, medida_pecho: 90, medida_cintura: 70, medida_cadera: 95, medida_muslo: 55 };
const settings = { storeName: "FitLook QA", email: "", tax: 18, tolerance: "Moderado", hqRender: false, limit: 50, twoFactor: false, timeout: 30 };
const product = { id: "p1", nombre: "Polo QA", precio: 100, descripcion: "Producto de prueba", categoria: "Running", marca: "FitLook", genero: "Mujer", imagenUrl: "/vite.svg", totalStock: 5, tallas: [{ id: "s1", talla: "M", stock: 3, discountPercent: 20, salePrice: 80, discountEndsAt: "2099-01-01T00:00:00Z", rangoCmMin: 85, rangoCmMax: 95 }, { id: "s2", talla: "L", stock: 2, discountPercent: 0, salePrice: 100 }] };
const order = { id: "o1", numero: "ORD-QA", total: 80, estado: "delivered", fechaOrden: "2026-10-08T12:00:00Z", entries: [{ productoTallaId: "s1", nombre: "Polo QA", talla: "M", cantidad: 1, precioUnitario: 80, subtotal: 80 }] };
async function fixtures(page: Page, role = "customer") {
  await page.route("**/*", (route) => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  await page.addInitScript((user) => { localStorage.setItem("token", "browser-qa-token"); localStorage.setItem("user", JSON.stringify(user)); }, { ...customer, role });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: object = {};
    if (path === "/api/products") data = { products: [product] };
    else if (path.includes("store-settings") || path.includes("admin/settings")) data = { settings };
    else if (path === "/api/auth/me") data = { user: { ...customer, role } };
    else if (path === "/api/orders") data = { orders: [order] };
    else if (path.endsWith("/support")) data = { tickets: [] };
    else if (path.endsWith("/returns") || path.endsWith("/discount-requests")) data = { requests: [] };
    else if (path.includes("notifications")) data = { notifications: [], unreadCount: 0 };
    else if (path.endsWith("/products") || path.endsWith("/inventory")) data = { products: [] };
    else if (path.endsWith("/orders")) data = { orders: [] };
    else if (path.endsWith("/users")) data = { users: [] };
    else if (path.endsWith("/customers")) data = { customers: [] };
    else if (path.endsWith("/movements")) data = { movements: [] };
    else if (path.endsWith("/stats")) data = { stats: { totalOrders: 0, revenue: 0, totalCustomers: 0, totalProducts: 0, lowStockCount: 0, pendingOrders: 0, totalUnitsSold: 0, totalReturns: 0 } };
    else if (path.endsWith("/sales-chart")) data = { sales: [] };
    else if (path.endsWith("/finance/summary")) data = { summary: { period: "month", periodLabel: "Últimos 12 meses", revenue: 0, ordersCount: 0, returnsCount: 0, monthlyRevenue: [], categories: [], transactions: [], expenses: [], expenseTotal: 0, paymentMethods: [] } };
    else if (path.endsWith("/finance/expenses")) data = route.request().method() === "POST" ? { expense: { id: "expense-qa", category: "Operaciones", description: "Flete QA", amount: 15, spentAt: new Date().toISOString() } } : { expenses: [] };
    await route.fulfill({ json: data });
  });
}
test("offer price survives catalog → selected size → cart", async ({ page }) => {
  await fixtures(page);
  await page.goto("/catalogo?ofertas=1");
  await expect(page.locator('a[href="/producto/1"]')).toHaveCount(0);
  await expect(page.getByText("Oferta por tiempo limitado", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Ver detalle", exact: true }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: /Agregar al carrito/i }).click();
  await page.goto("/carrito");
  await expect(page.getByText("Polo QA", { exact: true })).toBeVisible();
  await expect(page.getByText("S/ 80.00", { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("support and legal footer destinations are functional", async ({ page }) => {
  await fixtures(page); await page.goto("/soporte/faq");
  await expect(page.getByRole("heading", { name: "Preguntas frecuentes", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Privacidad", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Política de Privacidad", exact: true })).toBeVisible();
  await page.locator("main").getByRole("link", { name: "Contacto", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enviar consulta" })).toBeVisible();
});
test("customer pages load without route crashes", async ({ page }) => {
  test.setTimeout(180_000);
  await fixtures(page);
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/perfil", "/medidas", "/favoritos", "/mis-compras", "/mis-compras/o1", "/notificaciones", "/configuracion", "/producto/no-existe", "/ruta-no-existe"]) {
    await page.goto(path); await expect(page.getByText("No se pudo mostrar esta página")).toHaveCount(0);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});
test("admin settings and returns use real empty states instead of simulated records", async ({ page }) => {
  await fixtures(page, "admin"); await page.goto("/admin");
  if ((page.viewportSize()?.width || 0) < 1024) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  await page.getByRole("button", { name: "Configuración", exact: true }).click();
  await expect(page.getByLabel("Nombre de la tienda")).toHaveValue("FitLook QA");
  if ((page.viewportSize()?.width || 0) < 1024) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  await page.getByRole("button", { name: "Devoluciones", exact: true }).click();
  await expect(page.getByText("No hay devoluciones en este filtro.")).toBeVisible();
  await expect(page.getByText("Mock", { exact: true })).toHaveCount(0);
  if ((page.viewportSize()?.width || 0) < 1024) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  await page.getByRole("button", { name: "Consultas de soporte", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Consultas de soporte", exact: true, level: 1 })).toBeVisible();
  if ((page.viewportSize()?.width || 0) < 1024) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  await page.getByRole("button", { name: "Descuentos", exact: true }).click();
  await expect(page.getByText("No hay solicitudes en este filtro.")).toBeVisible();
  if ((page.viewportSize()?.width || 0) < 1024) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  await page.getByRole("button", { name: "Finanzas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Registrar egreso", exact: true })).toBeVisible();
  await page.getByLabel("Descripción").fill("Flete QA"); await page.getByLabel("Importe (S/)").fill("15");
  const expenseRequest = page.waitForRequest((request) => request.url().includes("/finance/expenses") && request.method() === "POST");
  await page.getByRole("button", { name: "Registrar egreso" }).click();
  expect((await expenseRequest).postDataJSON()).toMatchObject({ category: "Operaciones", description: "Flete QA", amount: 15 });
});
test("inventory screens load their live-data empty states", async ({ page }) => {
  await fixtures(page, "inventory"); await page.goto("/inventory");
  if ((page.viewportSize()?.width || 0) < 1024) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  await page.getByRole("button", { name: /Descuentos/i }).click();
  await expect(page.getByLabel("Duración de la oferta")).toBeVisible();
  await expect(page.getByText("No hay productos cargados.")).toBeVisible();
});

test("the former demo products page opens the real API-backed admin product module", async ({ page }) => {
  await fixtures(page, "admin");
  let payload: Record<string, unknown> | undefined;
  let productRecord: Record<string, unknown> | undefined;
  await page.route("**/api/admin/products", async (route) => {
    if (route.request().method() === "POST") {
      payload = route.request().postDataJSON();
      productRecord = { id: "p-created", nombre: payload.nombre, precio: payload.precio, descripcion: "QA", categoria: "Running", marca: null, imagenUrl: null, imageUrls: [], genero: "Unisex", fechaCreacion: new Date().toISOString(), tallas: [{ id: "s-created", talla: "M", stock: 4, discountPercent: 0, salePrice: 25 }], totalStock: 4 };
      await route.fulfill({ json: { product: productRecord } });
    } else await route.fulfill({ json: { products: productRecord ? [productRecord] : [] } });
  });
  await page.goto("/admin/products");
  await expect(page.getByRole("heading", { name: "Productos", exact: true, level: 1 })).toBeVisible();
  await page.getByLabel("Nombre del producto").fill("QA Product");
  await page.getByLabel("Precio").fill("25");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect.poll(() => payload?.nombre).toBe("QA Product");
  await expect(page.getByText("QA Product", { exact: true })).toBeVisible();
});
