import { Router } from "express";
import { virtualTryOnController } from "../controllers/virtualTryOn";
import { optionalJWT } from "../middlewares/auth";
import { tryOnSessionLimiter } from "../middlewares/storePolicy";

const router = Router();

router.post("/events", optionalJWT, tryOnSessionLimiter, virtualTryOnController.recordEvent);

export default router;
