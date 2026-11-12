import { Router } from "express";
import { productController } from "../controllers/products";

const router = Router();

router.get("/", productController.listProducts);
router.get("/image-proxy", productController.imageProxy);

export default router;
