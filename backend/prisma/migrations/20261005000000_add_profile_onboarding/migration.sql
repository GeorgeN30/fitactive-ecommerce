ALTER TABLE "usuarios"
  ADD COLUMN "genero" VARCHAR(50),
  ADD COLUMN "altura" DECIMAL(5, 2),
  ADD COLUMN "medida_muslo" DECIMAL(5, 2),
  ADD COLUMN "preferencia_ropa" VARCHAR(100),
  ADD COLUMN "preferencia_colores" VARCHAR(100),
  ADD COLUMN "preferencia_deporte" VARCHAR(100),
  ADD COLUMN "onboarding_completado" BOOLEAN NOT NULL DEFAULT false;
