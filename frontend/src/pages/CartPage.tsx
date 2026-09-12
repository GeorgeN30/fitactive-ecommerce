import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } =
    useCart();

  if (cartItems.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-6">🛒</div>

            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Tu carrito está vacío
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Agrega algunos productos para comenzar tu compra.
            </p>

            <Link
              to="/catalogo"
              className="inline-flex px-6 py-3 bg-brand-green text-black font-bold rounded-xl hover:opacity-90 transition"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Mi carrito
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Revisa tus productos antes de continuar con tu compra.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="w-28 h-32 sm:w-36 sm:h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-400 mb-1">
                            Producto
                          </p>

                          <h2 className="font-extrabold text-gray-900 dark:text-white">
                            {item.name}
                          </h2>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.id, item.size, item.color)
                          }
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Eliminar producto"
                        >
                          🗑️
                        </button>
                      </div>

                      {item.size && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Talla:{" "}
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {item.size}
                          </span>
                        </p>
                      )}

                      {item.color && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Color:{" "}
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {item.color}
                          </span>
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-4">
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                                item.size,
                                item.color,
                              )
                            }
                            className="w-9 h-9 hover:text-brand-green"
                          >
                            −
                          </button>

                          <span className="w-8 text-center font-bold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                                item.size,
                                item.color,
                              )
                            }
                            className="w-9 h-9 hover:text-brand-green"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            ${item.price.toFixed(2)} c/u
                          </p>

                          <p className="text-lg font-black text-gray-900 dark:text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="text-sm font-bold text-red-500 hover:underline"
              >
                Vaciar carrito
              </button>
            </div>

            <div>
              <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm sticky top-6">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Resumen de compra
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>

                    <span className="font-bold">${cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Envío</span>

                    <span className="font-bold text-brand-green">GRATIS</span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                    <span className="font-extrabold text-lg">Total</span>

                    <span className="font-black text-2xl">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full mt-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition"
                  onClick={() => navigate("/checkout")}
                >
                  Continuar con la compra
                </button>

                <Link
                  to="/catalogo"
                  className="block text-center mt-4 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  ← Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
