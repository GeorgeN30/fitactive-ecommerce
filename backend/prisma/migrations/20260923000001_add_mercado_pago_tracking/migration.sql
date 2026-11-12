-- Additive Mercado Pago tracking. Existing orders and catalog data are preserved.
ALTER TABLE "ordenes"
    ADD COLUMN "mp_preference_id" VARCHAR(100),
    ADD COLUMN "mp_init_point" TEXT,
    ADD COLUMN "mp_payment_id" VARCHAR(100),
    ADD COLUMN "mp_status" VARCHAR(50),
    ADD COLUMN "mp_status_detail" VARCHAR(100),
    ADD COLUMN "mp_paid_at" TIMESTAMP(6);

CREATE INDEX "ordenes_mp_preference_id_idx" ON "ordenes"("mp_preference_id");
CREATE INDEX "ordenes_mp_payment_id_idx" ON "ordenes"("mp_payment_id");

CREATE TABLE "mercadopago_webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_key" VARCHAR(250) NOT NULL,
    "topic" VARCHAR(80) NOT NULL,
    "resource_id" VARCHAR(100) NOT NULL,
    "payment_status" VARCHAR(50),
    "payload" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mercadopago_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mercadopago_webhook_events_event_key_key"
    ON "mercadopago_webhook_events"("event_key");
CREATE INDEX "mercadopago_webhook_events_resource_id_idx"
    ON "mercadopago_webhook_events"("resource_id");
CREATE INDEX "mercadopago_webhook_events_topic_resource_id_idx"
    ON "mercadopago_webhook_events"("topic", "resource_id");
