import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@integrador2.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";
const INVENTORY_EMAIL = process.env.INVENTORY_EMAIL || process.env.RECEPTIONIST_EMAIL || "inventory@fitlook.pe";
const INVENTORY_PASSWORD = process.env.INVENTORY_PASSWORD || process.env.RECEPTIONIST_PASSWORD || "Admin123";
const INVENTORY_ROLE = "inventory";

async function main() {
  const adminEmail = ADMIN_EMAIL.trim().toLowerCase();
  const inventoryEmail = INVENTORY_EMAIL.trim().toLowerCase();
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const inventoryPasswordHash = await bcrypt.hash(INVENTORY_PASSWORD, 12);

  // Non-destructive seed: create accounts only when missing,
  // never overwrite the password or role of an existing account.
  await prisma.usuarios.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrador",
      role: "admin",
      provider: "password",
      passwordHash: adminPasswordHash,
    },
  });
  console.log("Admin account synchronized:", adminEmail);

  await prisma.usuarios.upsert({
    where: { email: inventoryEmail },
    update: {},
    create: {
      email: inventoryEmail,
      name: "Gestor de Inventario",
      role: INVENTORY_ROLE,
      provider: "password",
      passwordHash: inventoryPasswordHash,
    },
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