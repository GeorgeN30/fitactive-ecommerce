CREATE TABLE "virtual_tryon_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "producto_id" UUID,
    "orden_id" UUID,
    "sesion_id" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "talla" VARCHAR(20),
    "genero" VARCHAR(30),
    "compatibilidad" INTEGER,
    "duracion_segundos" INTEGER,
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_tryon_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "virtual_tryon_events_creado_en_idx"
  ON "virtual_tryon_events"("creado_en");
CREATE INDEX "virtual_tryon_events_tipo_creado_en_idx"
  ON "virtual_tryon_events"("tipo", "creado_en");
CREATE INDEX "virtual_tryon_events_producto_id_creado_en_idx"
  ON "virtual_tryon_events"("producto_id", "creado_en");
CREATE INDEX "virtual_tryon_events_sesion_id_producto_id_idx"
  ON "virtual_tryon_events"("sesion_id", "producto_id");
CREATE INDEX "virtual_tryon_events_orden_id_idx"
  ON "virtual_tryon_events"("orden_id");

ALTER TABLE "virtual_tryon_events"
  ADD CONSTRAINT "fk_virtual_tryon_user"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "virtual_tryon_events"
  ADD CONSTRAINT "fk_virtual_tryon_product"
  FOREIGN KEY ("producto_id") REFERENCES "productos"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
