CREATE TABLE "store_settings" (
  "id" TEXT PRIMARY KEY DEFAULT 'store',
  "values" JSONB NOT NULL,
  "updated_by" UUID,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
