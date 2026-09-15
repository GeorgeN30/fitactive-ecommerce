import { Router } from "express";
import { productController } from "../controllers/products";

const router = Router();

router.get("/", productController.listProducts);

export default router;
