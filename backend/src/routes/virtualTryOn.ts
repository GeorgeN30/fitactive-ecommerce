import { Router } from "express";
import { virtualTryOnController } from "../controllers/virtualTryOn";
import { optionalJWT, validateJWT } from "../middlewares/auth";
import { tryOnSessionLimiter } from "../middlewares/storePolicy";

const router = Router();

router.post("/events", optionalJWT, tryOnSessionLimiter, virtualTryOnController.recordEvent);
router.get("/my-history", validateJWT, virtualTryOnController.getMyHistory);

export default router;
