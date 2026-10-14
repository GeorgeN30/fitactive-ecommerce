import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { config } from "../config/env";

export const DEFAULT_SETTINGS = {
  storeName: "FITLOOK Perú", email: "", tax: 18,
  tolerance: "Moderado", hqRender: false, limit: 50,
  twoFactor: false, timeout: 30,
};
export type StoreSettings = typeof DEFAULT_SETTINGS;
let cache: { settings: StoreSettings; until: number } | undefined;
export function validateSettings(input: unknown): Partial<StoreSettings> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_SETTINGS");
  const data = input as Record<string, unknown>;
  if (!Object.keys(data).length || Object.keys(data).some((key) => !Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key))) throw new Error("INVALID_SETTINGS");
  for (const [key, value] of Object.entries(data)) {
    if (key === "storeName" && (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 100)) throw new Error("INVALID_STORE_NAME");
    if (key === "email" && (typeof value !== "string" || value.length > 255 || value !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) throw new Error("INVALID_CONTACT_EMAIL");
    if (key === "tax" && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 30)) throw new Error("INVALID_TAX");
    if (key === "tolerance" && !["Estricto", "Moderado", "Flexible"].includes(value as string)) throw new Error("INVALID_TOLERANCE");
    if (["twoFactor", "hqRender"].includes(key) && typeof value !== "boolean") throw new Error("INVALID_SETTINGS_BOOLEAN");
    if (key === "limit" && (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 1000)) throw new Error("INVALID_TRYON_LIMIT");
    if (key === "timeout" && (typeof value !== "number" || !Number.isInteger(value) || value < 5 || value > 1440)) throw new Error("INVALID_SESSION_TIMEOUT");
  }
  return data as Partial<StoreSettings>;
}
export const settingsService = {
  async get(): Promise<StoreSettings> {
    if (cache && cache.until > Date.now()) return cache.settings;
    const row = await prisma.store_settings.findUnique({ where: { id: "store" } });
    const settings = { ...DEFAULT_SETTINGS, ...(row?.values as Partial<StoreSettings>) };
    cache = { settings, until: Date.now() + 15_000 };
    return settings;
  },
  async update(input: unknown, userId: string): Promise<StoreSettings> {
    const patch = validateSettings(input);
    if (patch.twoFactor) {
      const unconfigured = await prisma.usuarios.count({ where: { role: { in: ["admin", "inventory", "receptionist"] }, blocked: false, twoFactorEnabled: false } });
      if (unconfigured > 0) throw new Error("STAFF_MFA_NOT_READY");
    }
    const result = await prisma.$transaction(async (tx) => {
      // Serialize concurrent section saves without overwriting another admin's changes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(861002)`;
      const row = await tx.store_settings.findUnique({ where: { id: "store" } });
      const settings = { ...DEFAULT_SETTINGS, ...(row?.values as Partial<StoreSettings>), ...patch };
      if (typeof settings.storeName === "string") settings.storeName = settings.storeName.trim();
      await tx.store_settings.upsert({ where: { id: "store" }, create: { id: "store", values: settings as Prisma.InputJsonValue, updated_by: userId }, update: { values: settings as Prisma.InputJsonValue, updated_by: userId } });
      return settings;
    });
    cache = { settings: result, until: Date.now() + 15_000 };
    return result;
  },
  paymentInfo() { return { gateway: "Mercado Pago", currency: "PEN", configured: !!config.mercadoPago.accessToken && config.mercadoPago.accessToken !== "TEST-local-placeholder" }; },
};
