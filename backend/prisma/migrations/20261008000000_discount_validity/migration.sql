ALTER TABLE "producto_tallas"
  ADD COLUMN "descuento_inicio" TIMESTAMPTZ,
  ADD COLUMN "descuento_fin" TIMESTAMPTZ,
  ADD COLUMN "descuento_solicitud_id" UUID;
ALTER TABLE "discount_requests"
  ADD COLUMN "duracion_horas" INTEGER,
  ADD COLUMN "fecha_inicio" TIMESTAMPTZ,
  ADD COLUMN "fecha_fin" TIMESTAMPTZ;
ALTER TABLE "producto_tallas" ADD CONSTRAINT "discount_valid_window"
  CHECK (descuento_fin IS NULL OR descuento_inicio IS NULL OR descuento_fin > descuento_inicio);
ALTER TABLE "discount_requests" ADD CONSTRAINT "request_valid_window"
  CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin > fecha_inicio);
CREATE INDEX "producto_tallas_discount_expiry" ON "producto_tallas" ("descuento_fin")
  WHERE "descuento_porcentaje" > 0;
