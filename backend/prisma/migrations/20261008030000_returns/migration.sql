ALTER TABLE "ordenes" ADD COLUMN "refunded_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "delivered_at" TIMESTAMPTZ;
CREATE TABLE "return_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL REFERENCES "ordenes"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "usuarios"("id"), "reason" VARCHAR(1000) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING', "comment" VARCHAR(1000), "reviewed_by" UUID REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "amount" DECIMAL(10,2) NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "reviewed_at" TIMESTAMPTZ, "received_at" TIMESTAMPTZ, "refunded_at" TIMESTAMPTZ,
  "refund_id" VARCHAR(100), "refund_status" VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUESTED', "refund_attempted_at" TIMESTAMPTZ,
  CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED')), CHECK ("amount" >= 0)
);
CREATE TABLE "return_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "request_id" UUID NOT NULL REFERENCES "return_requests"("id") ON DELETE CASCADE,
  "detail_id" UUID NOT NULL REFERENCES "orden_detalles"("id"), "quantity" INTEGER NOT NULL CHECK ("quantity" > 0)
);
CREATE UNIQUE INDEX "return_items_request_id_detail_id_key" ON "return_items"("request_id", "detail_id");
CREATE INDEX "return_requests_user_id_created_at_idx" ON "return_requests"("user_id", "created_at");
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");
