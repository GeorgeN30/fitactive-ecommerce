import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { validateJWT } from "../middlewares/auth";
import { supportController } from "../controllers/support";
const router = Router();
router.use(validateJWT);
router.get("/", supportController.list);
router.post("/", rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: { error: "SUPPORT_RATE_LIMIT" } }), supportController.create);
export default router;
