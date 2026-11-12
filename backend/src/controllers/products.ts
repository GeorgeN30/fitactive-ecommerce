import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants";
import { adminService } from "../services/admin";

export const productController = {
  async listProducts(_req: unknown, res: Response): Promise<void> {
    try {
      const allProducts = await adminService.listProducts();
      // Keep only products configured for Hombre or Mujer with standard sizes
      const products = allProducts.filter((p) => {
        const gen = (p.genero || "").trim().toLowerCase();
        const isValidGender =
          gen === "hombre" ||
          gen === "mujer" ||
          gen === "male" ||
          gen === "female" ||
          gen === "masculino" ||
          gen === "femenino";
        const hasSizes = Array.isArray(p.tallas) && p.tallas.length > 0;
        return isValidGender && hasSizes;
      });
      res.status(HTTP_STATUS.OK).json({ products });
    } catch (error) {
      console.error("Public product list error:", error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "PRODUCT_LIST_FAILED" });
    }
  },

  async imageProxy(req: Request, res: Response): Promise<void> {
    try {
      const url = req.query.url as string;
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "INVALID_URL" });
        return;
      }
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/*,*/*",
        },
      });
      if (!response.ok) {
        res.status(response.status).json({ error: "UPSTREAM_IMAGE_ERROR" });
        return;
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: "IMAGE_PROXY_FAILED" });
    }
  },
};
