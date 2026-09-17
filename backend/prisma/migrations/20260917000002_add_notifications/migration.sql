CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "referencia_id" VARCHAR(100),
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creada_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_usuario_id_leida_creada_en_idx"
  ON "notifications"("usuario_id", "leida", "creada_en");

ALTER TABLE "notifications" ADD CONSTRAINT "fk_notification_user"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
