import { Router } from "express";
import { notificationController } from "../controllers/notifications";
import { validateJWT } from "../middlewares/auth";

const router = Router();

router.use(validateJWT);
router.get("/", notificationController.listMine);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);

export default router;
