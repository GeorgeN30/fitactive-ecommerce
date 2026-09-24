import { Router } from "express";
import { adminController } from "../controllers/admin";
import { validateJWT } from "../middlewares/auth";
import { checkRole } from "../middlewares/role";
import { ROLES } from "../constants";

const router = Router();

router.use(validateJWT, checkRole(ROLES.ADMIN, ROLES.INVENTORY));

router.get("/products", adminController.getInventory);
router.get("/orders", adminController.listOrders);
router.put("/orders/:id/status", adminController.updateInventoryOrderStatus);
router.post("/products", adminController.createProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);
router.get("/movements", adminController.listMovements);
router.post("/movements", adminController.createMovement);
router.get("/low-stock", adminController.listLowStockProducts);
router.put("/products/:productId/stock", adminController.updateInventoryStock);
router.post(
  "/discount-requests",
  checkRole(ROLES.INVENTORY),
  adminController.createDiscountRequest,
);
router.get(
  "/discount-requests",
  checkRole(ROLES.INVENTORY),
  adminController.listMyDiscountRequests,
);

export default router;
