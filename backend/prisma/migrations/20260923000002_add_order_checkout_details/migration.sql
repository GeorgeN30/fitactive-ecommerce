ALTER TABLE "ordenes"
  ADD COLUMN "customer_name" VARCHAR(150),
  ADD COLUMN "customer_email" VARCHAR(255),
  ADD COLUMN "customer_phone" VARCHAR(40),
  ADD COLUMN "shipping_address" VARCHAR(255),
  ADD COLUMN "shipping_district" VARCHAR(120),
  ADD COLUMN "shipping_city" VARCHAR(120),
  ADD COLUMN "shipping_reference" VARCHAR(255);
