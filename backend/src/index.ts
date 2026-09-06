import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env";
import authRoutes from "./routes/auth";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);

// --- RUTA ACTUALIZADA CON TALLAS Y STOCK ---
app.get("/api/products", async (req, res) => {
  console.log("👉 1. El frontend acaba de tocar la puerta de /api/products");
  
  try {
    const supabaseUrl = process.env.EXTERNAL_BAAS_URL;
    const supabaseKey = process.env.EXTERNAL_BAAS_API_KEY;
    
    console.log("👉 2. URL leída del .env:", supabaseUrl ? "Sí hay URL" : "¡VACÍO!");
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Faltan credenciales" });
    }

    // Se agrega producto_tallas(*) para traer la relación de tallas y stock desde Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/productos?select=*,producto_tallas(*)`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    
    const data = await response.json();
    console.log("👉 3. Respuesta de Supabase:", data.length !== undefined ? `¡Llegaron ${data.length} productos con tallas!` : data);
    
    res.json(data);
  } catch (error) {
    console.error("👉 ERROR CRÍTICO:", error);
    res.status(500).json({ error: "Error interno" });
  }
});
// --- FIN DE LA RUTA ---

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;