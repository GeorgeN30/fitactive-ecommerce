import { Router } from "express";
import { adminController } from "../controllers/admin";
import { validateJWT } from "../middlewares/auth";
import { checkRole } from "../middlewares/role";
import { ROLES } from "../constants";

const router = Router();

router.use(validateJWT, checkRole(ROLES.ADMIN));

router.get("/products", adminController.listProducts);
router.post("/products", adminController.createProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);

router.get("/orders", adminController.listOrders);
router.put("/orders/:id/status", adminController.updateOrderStatus);

router.get("/customers", adminController.listCustomers);
router.get("/users", adminController.listUsers);
router.put("/customers/:id/role", adminController.updateCustomerRole);
router.put("/users/:id/role", adminController.updateCustomerRole);
router.put("/customers/:id/status", adminController.updateCustomerStatus);

router.get("/inventory", adminController.getInventory);
router.put("/inventory/:productId/stock", adminController.updateStock);
router.get("/inventory/movements", adminController.listMovements);
router.get("/inventory/low-stock", adminController.listLowStockProducts);

router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/sales-chart", adminController.getSalesChart);
router.get("/dashboard/top-products", adminController.getTopProducts);
router.get("/dashboard/categories", adminController.getCategories);

router.get("/discount-requests", adminController.listDiscountRequests);
router.put("/discount-requests/:id/review", adminController.reviewDiscountRequest);
router.put("/discount-requests/:id/revert", adminController.revertDiscountRequest);

export default router;
