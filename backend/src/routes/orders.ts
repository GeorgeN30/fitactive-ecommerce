import { Router } from "express";
import { orderController } from "../controllers/orders";
import { validateJWT } from "../middlewares/auth";

const router = Router();

router.post("/", validateJWT, orderController.createOrder);
router.get("/", validateJWT, orderController.listMyOrders);

export default router;