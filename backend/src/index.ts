import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { config } from "./config/env";
import authRoutes from "./routes/auth";
import ordersRoutes from "./routes/orders";
import adminRoutes from "./routes/admin";
import inventoryRoutes from "./routes/inventory";
import productsRoutes from "./routes/products";
import notificationsRoutes from "./routes/notifications";
import virtualTryOnRoutes from "./routes/virtualTryOn";
import paymentsRoutes from "./routes/payments";
import { orderService } from "./services/orders";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "32mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/virtual-tryon", virtualTryOnRoutes);
app.use("/api/payments", paymentsRoutes);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  void orderService.releaseExpiredPendingOrders().catch((error: unknown) => {
    console.error("Initial pending order cleanup failed:", error);
  });
  setInterval(() => {
    void orderService.releaseExpiredPendingOrders().catch((error: unknown) => {
      console.error("Pending order cleanup failed:", error);
    });
  }, 60_000);
});

export default app;
