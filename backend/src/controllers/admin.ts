import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { adminService } from "../services/admin";
import { notifications } from "../services/notifications";
import { HTTP_STATUS } from "../constants";

const VALIDATION_ERRORS = new Set([
  "NAME_REQUIRED",
  "INVALID_PRICE",
  "STATUS_REQUIRED",
  "INVALID_STATUS",
  "INVALID_ROLE",
  "SIZE_REQUIRED",
  "INVALID_QUANTITY",
  "INVALID_MOVEMENT_TYPE",
  "MOTIVE_REQUIRED",
  "DUPLICATE_SIZE",
  "INVALID_ENTRY",
]);

const NOT_FOUND_ERRORS = new Set([
  "PRODUCT_NOT_FOUND",
  "ORDER_NOT_FOUND",
  "CUSTOMER_NOT_FOUND",
  "SIZE_NOT_FOUND",
]);

function respondWithError(res: Response, err: unknown, fallback: string): void {
  const message = err instanceof Error ? err.message : fallback;

  if (VALIDATION_ERRORS.has(message)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: message });
    return;
  }
  if (NOT_FOUND_ERRORS.has(message)) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ error: message });
    return;
  }
  if (message === "PRODUCT_HAS_ORDERS" || message === "INSUFFICIENT_STOCK") {
    res.status(HTTP_STATUS.CONFLICT).json({ error: message });
    return;
  }

  console.error(fallback + ":", err);
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: fallback });
}

export const adminController = {
  // GET /api/admin/products
  async listProducts(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await adminService.listProducts();
      res.status(HTTP_STATUS.OK).json({ products });
    } catch (err) {
      respondWithError(res, err, "PRODUCT_LIST_FAILED");
    }
  },

  // POST /api/admin/products
  async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await adminService.createProduct(req.body);
      res.status(HTTP_STATUS.CREATED).json({ product });
    } catch (err) {
      respondWithError(res, err, "PRODUCT_CREATE_FAILED");
    }
  },

  // PUT /api/admin/products/:id
  async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await adminService.updateProduct(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({ product });
    } catch (err) {
      respondWithError(res, err, "PRODUCT_UPDATE_FAILED");
    }
  },

  // DELETE /api/admin/products/:id
  async deleteProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await adminService.deleteProduct(req.params.id);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err) {
      respondWithError(res, err, "PRODUCT_DELETE_FAILED");
    }
  },

  // GET /api/admin/orders
  async listOrders(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const orders = await adminService.listOrders();
      res.status(HTTP_STATUS.OK).json({ orders });
    } catch (err) {
      respondWithError(res, err, "ADMIN_ORDER_LIST_FAILED");
    }
  },

  // PUT /api/admin/orders/:id/status
  async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const order = await adminService.updateOrderStatus(
        req.params.id,
        req.body.status,
      );

      void notifications.notifyOrderStatus(order.customer.id, {
        orderId: order.id,
        orderNumber: order.numero,
        status: order.estado,
      });

      res.status(HTTP_STATUS.OK).json({ order });
    } catch (err) {
      respondWithError(res, err, "ORDER_STATUS_UPDATE_FAILED");
    }
  },

  // GET /api/admin/customers
  async listCustomers(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const customers = await adminService.listCustomers();
      res.status(HTTP_STATUS.OK).json({ customers });
    } catch (err) {
      respondWithError(res, err, "CUSTOMER_LIST_FAILED");
    }
  },

  // PUT /api/admin/customers/:id/role
  async updateCustomerRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customer = await adminService.updateCustomerRole(
        req.params.id,
        req.body.role,
      );
      res.status(HTTP_STATUS.OK).json({ customer });
    } catch (err) {
      respondWithError(res, err, "CUSTOMER_ROLE_UPDATE_FAILED");
    }
  },

  // GET /api/admin/inventory
  async getInventory(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await adminService.getInventory();
      res.status(HTTP_STATUS.OK).json({ products });
    } catch (err) {
      respondWithError(res, err, "INVENTORY_LIST_FAILED");
    }
  },

  // PUT /api/admin/inventory/:productId/stock
  async updateStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }

      const product = await adminService.updateStock(
        req.params.productId,
        req.body.size,
        req.body.quantity,
        req.user.userId,
        req.body.motivo,
      );

      const updatedSize = product.tallas.find(
        (talla) => talla.talla === req.body.size,
      );
      void notifications.notifyStockAlert({
        productId: product.id,
        productName: product.nombre,
        size: req.body.size,
        stock: updatedSize?.stock ?? 0,
      });

      res.status(HTTP_STATUS.OK).json({ product });
    } catch (err) {
      respondWithError(res, err, "STOCK_UPDATE_FAILED");
    }
  },

  // GET /api/admin/inventory/movements
  async listMovements(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const movements = await adminService.listMovements();
      res.status(HTTP_STATUS.OK).json({ movements });
    } catch (err) {
      respondWithError(res, err, "MOVEMENT_LIST_FAILED");
    }
  },

  // GET /api/admin/inventory/low-stock
  async listLowStockProducts(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await adminService.getLowStockProducts();
      res.status(HTTP_STATUS.OK).json({ products });
    } catch (err) {
      respondWithError(res, err, "LOW_STOCK_LIST_FAILED");
    }
  },

  // POST /api/inventory/movements
  async createMovement(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }
      const result = await adminService.recordMovement(req.body, req.user.userId);
      void notifications.notifyStockAlert({
        productId: result.product.id,
        productName: result.product.nombre,
        size: result.movement.talla,
        stock:
          result.product.tallas.find((talla) => talla.talla === result.movement.talla)
            ?.stock ?? 0,
      });
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      respondWithError(res, err, "MOVEMENT_CREATE_FAILED");
    }
  },

  // PUT /api/inventory/products/:productId/stock
  async updateInventoryStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
        return;
      }
      const product = await adminService.updateStock(
        req.params.productId,
        req.body.talla || req.body.size,
        req.body.quantity,
        req.user.userId,
        req.body.motivo,
      );
      const size = req.body.talla || req.body.size;
      void notifications.notifyStockAlert({
        productId: product.id,
        productName: product.nombre,
        size,
        stock: product.tallas.find((talla) => talla.talla === size)?.stock ?? 0,
      });
      res.status(HTTP_STATUS.OK).json({ product });
    } catch (err) {
      respondWithError(res, err, "STOCK_UPDATE_FAILED");
    }
  },

  // GET /api/admin/dashboard/stats
  async getDashboardStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(HTTP_STATUS.OK).json({ stats });
    } catch (err) {
      respondWithError(res, err, "DASHBOARD_STATS_FAILED");
    }
  },

  // GET /api/admin/dashboard/sales-chart
  async getSalesChart(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const sales = await adminService.getSalesChart();
      res.status(HTTP_STATUS.OK).json({ sales });
    } catch (err) {
      respondWithError(res, err, "SALES_CHART_FAILED");
    }
  },

  // GET /api/admin/dashboard/top-products
  async getTopProducts(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await adminService.getTopProducts();
      res.status(HTTP_STATUS.OK).json({ products });
    } catch (err) {
      respondWithError(res, err, "TOP_PRODUCTS_FAILED");
    }
  },

  // GET /api/admin/dashboard/categories
  async getCategories(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await adminService.getCategories();
      res.status(HTTP_STATUS.OK).json({ categories });
    } catch (err) {
      respondWithError(res, err, "CATEGORIES_FAILED");
    }
  },
};
