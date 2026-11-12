CREATE TABLE "support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "subject" VARCHAR(150) NOT NULL, "message" VARCHAR(2000) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN', "response" VARCHAR(2000), "responded_by" UUID REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "support_status" CHECK ("status" IN ('OPEN', 'ANSWERED', 'CLOSED'))
);
CREATE INDEX "support_tickets_user_created" ON "support_tickets" ("user_id", "created_at");
