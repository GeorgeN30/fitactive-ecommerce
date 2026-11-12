import { Router } from "express";
import { adminController } from "../controllers/admin";
import { validateJWT } from "../middlewares/auth";
import { checkRole } from "../middlewares/role";
import { ROLES } from "../constants";
import { settingsController } from "../controllers/settings";
import { requireStaffMfa } from "../middlewares/storePolicy";
import { supportController } from "../controllers/support";
import { returnController } from "../controllers/returns";
import { expenseController } from "../controllers/expenses";

const router = Router();

router.use(validateJWT, checkRole(ROLES.ADMIN));
router.use(requireStaffMfa);
router.get("/settings", settingsController.get);
router.put("/settings", settingsController.update);
router.get("/support", supportController.list);
router.put("/support/:id", supportController.respond);
router.get("/returns", returnController.list);
router.put("/returns/:id/:action", returnController.action);

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
router.get("/finance/summary", adminController.getFinanceSummary);
router.get("/finance/expenses", expenseController.list);
router.post("/finance/expenses", expenseController.create);
router.get("/virtual-tryon/summary", adminController.getVirtualTryOnSummary);
router.get("/dashboard/top-products", adminController.getTopProducts);
router.get("/dashboard/categories", adminController.getCategories);

router.get("/discount-requests", adminController.listDiscountRequests);
router.put("/discount-requests/:id/review", adminController.reviewDiscountRequest);
router.put("/discount-requests/:id/revert", adminController.revertDiscountRequest);

export default router;
