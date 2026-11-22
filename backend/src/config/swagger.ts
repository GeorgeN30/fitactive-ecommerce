export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "FitLook E-Commerce API",
    version: "1.0.0",
    description: "Documentación de endpoints de la plataforma FitLook (E-commerce y Probador Virtual 3D)"
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Servidor Local de Desarrollo"
    }
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["system"],
        summary: "Verificar estado del servidor",
        responses: {
          "200": {
            description: "Servidor operativo",
            content: {
              "application/json": {
                example: { status: "ok", timestamp: "2026-11-20T14:00:00.000Z" }
              }
            }
          }
        }
      }
    },
    "/api/products": {
      get: {
        tags: ["product-controller"],
        summary: "Listar catálogo de prendas deportivas con filtros y stock",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Filtrar por categoría (Polos, Shorts, etc.)" },
          { name: "gender", in: "query", schema: { type: "string" }, description: "Filtrar por género (HOMBRE, MUJER)" }
        ],
        responses: {
          "200": {
            description: "Lista de productos devuelta exitosamente",
            content: {
              "application/json": {
                example: [
                  {
                    id: "b0000001-0000-0000-0000-000000000001",
                    nombre: "Polo Performance Dry-Fit",
                    categoria: "Polos",
                    precio: 89.90,
                    genero: "HOMBRE",
                    producto_tallas: [
                      { talla: "S", stock: 15 },
                      { talla: "M", stock: 25 },
                      { talla: "L", stock: 8 }
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    },
    "/api/orders": {
      post: {
        tags: ["order-controller"],
        summary: "Crear una nueva orden de compra con reserva de stock",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                items: [{ producto_talla_id: "c0000001-0000-0000-0000-000000000002", cantidad: 1 }],
                shipping_address: "Av. Arequipa 1250",
                shipping_city: "Lima"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Orden creada exitosamente",
            content: {
              "application/json": {
                example: { id: "d0000001-...", numero: "ORD-2026-0001", total: 89.90, estado: "PENDIENTE" }
              }
            }
          }
        }
      }
    },
    "/api/virtual-tryon/events": {
      post: {
        tags: ["virtual-tryon-controller"],
        summary: "Registrar evento de prueba en avatar 3D Three.js",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                producto_id: "b0000001-0000-0000-0000-000000000001",
                talla: "M",
                tipo: "Regular Fit",
                compatibilidad: 99,
                duracion_segundos: 45
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Evento registrado",
            content: {
              "application/json": {
                example: { success: true, message: "Evento 3D guardado" }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["auth-controller"],
        summary: "Iniciar sesión de usuario con credenciales y JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                email: "carlos.espa@gmail.com",
                password: "Password123*"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Autenticación exitosa",
            content: {
              "application/json": {
                example: {
                  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  user: { id: "a0000001-...", name: "Carlos Espa", role: "customer" }
                }
              }
            }
          },
          "401": {
            description: "Credenciales inválidas"
          }
        }
      }
    }
  }
};
