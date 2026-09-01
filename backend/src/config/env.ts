import dotenv from "dotenv";
import path from "path";

// El archivo de entorno se mantiene en la raíz del monorepo.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  baas: {
    url: process.env.EXTERNAL_BAAS_URL || "https://core.geozns.com",
    apiKey: process.env.EXTERNAL_BAAS_API_KEY || "",
  },
  jwtAppId: process.env.JWT_APP_ID || "integrador2_web",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  // Keep the old variable names as a fallback while exposing the new role as inventory.
  inventoryEmail: process.env.INVENTORY_EMAIL || process.env.RECEPTIONIST_EMAIL || "",
  inventoryPassword: process.env.INVENTORY_PASSWORD || process.env.RECEPTIONIST_PASSWORD || "",
  receptionistEmail: process.env.INVENTORY_EMAIL ? "" : process.env.RECEPTIONIST_EMAIL || "",
  receptionistPassword: process.env.INVENTORY_EMAIL ? "" : process.env.RECEPTIONIST_PASSWORD || "",
};
