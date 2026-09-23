import { Router } from "express";
import { virtualTryOnController } from "../controllers/virtualTryOn";
import { optionalJWT } from "../middlewares/auth";

const router = Router();

router.post("/events", optionalJWT, virtualTryOnController.recordEvent);

export default router;
