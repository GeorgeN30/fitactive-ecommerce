import { Router } from "express";
import { paymentController } from "../controllers/payments";
import { validateJWT } from "../middlewares/auth";

const router = Router();

// Public endpoint: Mercado Pago authenticates notifications with x-signature.
router.post("/mercadopago/webhook", paymentController.handleMercadoPagoWebhook);

router.post(
  "/mercadopago/preferences",
  validateJWT,
  paymentController.createMercadoPagoPreference,
);
router.get(
  "/mercadopago/orders/:orderId",
  validateJWT,
  paymentController.getMercadoPagoOrderStatus,
);

export default router;
