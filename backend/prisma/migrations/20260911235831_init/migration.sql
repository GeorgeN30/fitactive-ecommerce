-- CreateTable
CREATE TABLE "orden_detalles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orden_id" UUID NOT NULL,
    "producto_talla_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "orden_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" VARCHAR(50) DEFAULT 'PENDIENTE',
    "fecha_orden" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_tallas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" UUID NOT NULL,
    "talla" VARCHAR(10) NOT NULL,
    "stock" INTEGER DEFAULT 0,
    "rango_cm_min" DECIMAL(5,2),
    "rango_cm_max" DECIMAL(5,2),

    CONSTRAINT "producto_tallas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(100),
    "marca" VARCHAR(100),
    "precio" DECIMAL(10,2) NOT NULL,
    "imagen_url" TEXT,
    "imagen_avatar_2d" TEXT,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "genero" TEXT,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "auth_provider" VARCHAR(50) DEFAULT 'LOCAL',
    "google_id" VARCHAR(255),
    "rol" VARCHAR(50) DEFAULT 'customer',
    "medida_pecho" DECIMAL(5,2),
    "medida_cintura" DECIMAL(5,2),
    "medida_cadera" DECIMAL(5,2),
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "picture" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_google_id_key" ON "usuarios"("google_id");

-- AddForeignKey
ALTER TABLE "orden_detalles" ADD CONSTRAINT "fk_orden" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orden_detalles" ADD CONSTRAINT "fk_producto_talla" FOREIGN KEY ("producto_talla_id") REFERENCES "producto_tallas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "fk_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_tallas" ADD CONSTRAINT "fk_producto" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
