#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding admin and inventory users if not exists..."
npx ts-node-dev --transpile-only prisma/seed.ts

echo "Starting server..."
node dist/index.js
