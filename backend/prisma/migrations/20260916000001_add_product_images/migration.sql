CREATE TABLE "producto_imagenes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "producto_imagenes_producto_id_orden_idx" ON "producto_imagenes"("producto_id", "orden");

ALTER TABLE "producto_imagenes" ADD CONSTRAINT "fk_producto_imagen" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
