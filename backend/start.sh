#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding admin user if not exists..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) { console.log('No admin env vars, skipping seed.'); return; }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { console.log('Admin already exists:', email); return; }
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, name: 'Administrador', role: 'admin', provider: 'password', passwordHash: hash } });
  console.log('Admin user created:', email);
  await prisma.\$disconnect();
})().catch(async (e) => { console.error('Seed failed:', e); await prisma.\$disconnect(); process.exit(1); });
"

echo "Starting server..."
node dist/index.js
