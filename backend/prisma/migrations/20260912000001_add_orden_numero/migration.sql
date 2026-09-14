-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN "numero" VARCHAR(30);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_numero_key" ON "ordenes"("numero");