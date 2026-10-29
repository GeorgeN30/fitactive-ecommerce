CREATE TYPE "BodyType" AS ENUM ('slim', 'average', 'broad');

ALTER TABLE "usuarios" ADD COLUMN "body_type" "BodyType";
