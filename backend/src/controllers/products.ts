import { Response } from "express";
import { HTTP_STATUS } from "../constants";
import { adminService } from "../services/admin";

export const productController = {
  async listProducts(_req: unknown, res: Response): Promise<void> {
    try {
      const products = await adminService.listProducts();
      res.status(HTTP_STATUS.OK).json({ products });
    } catch (error) {
      console.error("Public product list error:", error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "PRODUCT_LIST_FAILED" });
    }
  },
};
