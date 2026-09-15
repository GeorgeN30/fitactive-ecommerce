-- AlterTable
ALTER TABLE "producto_tallas" ADD COLUMN "descuento_porcentaje" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "discount_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_talla_id" UUID NOT NULL,
    "solicitado_por" UUID NOT NULL,
    "porcentaje" INTEGER NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "revisado_por" UUID,
    "comentario_admin" VARCHAR(255),
    "solicitado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisado_en" TIMESTAMP(6),
    CONSTRAINT "discount_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discount_requests" ADD CONSTRAINT "fk_discount_request_variant" FOREIGN KEY ("producto_talla_id") REFERENCES "producto_tallas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "discount_requests" ADD CONSTRAINT "fk_discount_requester" FOREIGN KEY ("solicitado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "discount_requests" ADD CONSTRAINT "fk_discount_reviewer" FOREIGN KEY ("revisado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Only one active request may exist for a variant at a time.
CREATE UNIQUE INDEX "discount_requests_pending_variant_key"
ON "discount_requests" ("producto_talla_id")
WHERE "estado" = 'PENDING';

CREATE INDEX "discount_requests_estado_idx" ON "discount_requests" ("estado");
CREATE INDEX "discount_requests_solicitado_por_idx" ON "discount_requests" ("solicitado_por");
CREATE INDEX "discount_requests_producto_talla_id_idx" ON "discount_requests" ("producto_talla_id");
