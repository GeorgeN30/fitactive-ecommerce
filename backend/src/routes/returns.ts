import { Router } from "express";
import { validateJWT } from "../middlewares/auth";
import { returnController } from "../controllers/returns";
const router = Router();
router.use(validateJWT);
router.get("/", returnController.list);
router.post("/", returnController.create);
export default router;
