ALTER TABLE "ordenes"
  ADD COLUMN "reservation_expires_at" TIMESTAMP(6);

CREATE INDEX "ordenes_reservation_expires_at_idx"
  ON "ordenes"("reservation_expires_at");
