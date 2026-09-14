import dotenv from "dotenv";
import path from "path";

// Load backend/.env first and use the root .env as a fallback so local host
// development can keep its database settings separate from Docker production.
// Existing values are never overwritten by the fallback file.
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  directUrl: process.env.DIRECT_URL || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "",
  baas: {
    url: process.env.EXTERNAL_BAAS_URL || "https://core.geozns.com",
    apiKey: process.env.EXTERNAL_BAAS_API_KEY || "",
  },
  jwtAppId: process.env.JWT_APP_ID || "integrador2_web",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  inventoryEmail: process.env.INVENTORY_EMAIL || process.env.RECEPTIONIST_EMAIL || "",
  inventoryPassword: process.env.INVENTORY_PASSWORD || process.env.RECEPTIONIST_PASSWORD || "",
  receptionistEmail: process.env.INVENTORY_EMAIL ? "" : process.env.RECEPTIONIST_EMAIL || "",
  receptionistPassword: process.env.INVENTORY_EMAIL ? "" : process.env.RECEPTIONIST_PASSWORD || "",
};
