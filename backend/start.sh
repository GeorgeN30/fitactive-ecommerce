#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding admin and inventory users if not exists..."
  npx ts-node-dev --transpile-only prisma/seed.ts
else
  echo "SEED_ON_START not enabled, skipping seed."
fi

echo "Starting server..."
node dist/index.js