import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@integrador2.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";
const INVENTORY_EMAIL = process.env.INVENTORY_EMAIL || process.env.RECEPTIONIST_EMAIL || "inventory@fitlook.pe";
const INVENTORY_PASSWORD = process.env.INVENTORY_PASSWORD || process.env.RECEPTIONIST_PASSWORD || "Admin123";
const INVENTORY_ROLE = "inventory";

async function normalizeSeedEmail(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  if (email === normalizedEmail) return normalizedEmail;

  const existingNormalized = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!existingNormalized) {
    const existingOriginal = await prisma.user.findUnique({ where: { email } });
    if (existingOriginal) {
      await prisma.user.update({
        where: { email },
        data: { email: normalizedEmail },
      });
    }
  }

  return normalizedEmail;
}

async function main() {
  const adminEmail = await normalizeSeedEmail(ADMIN_EMAIL);
  const inventoryEmail = await normalizeSeedEmail(INVENTORY_EMAIL);
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const inventoryPasswordHash = await bcrypt.hash(INVENTORY_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Administrador", role: "admin", provider: "password", passwordHash: adminPasswordHash, isActive: true },
    create: { email: adminEmail, name: "Administrador", role: "admin", provider: "password", passwordHash: adminPasswordHash },
  });
  console.log("Admin account synchronized:", adminEmail);

  await prisma.user.upsert({
    where: { email: inventoryEmail },
    update: { name: "Gestor de Inventario", role: INVENTORY_ROLE, provider: "password", passwordHash: inventoryPasswordHash, isActive: true },
    create: { email: inventoryEmail, name: "Gestor de Inventario", role: INVENTORY_ROLE, provider: "password", passwordHash: inventoryPasswordHash },
  });
  console.log("Inventory account synchronized:", inventoryEmail);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
