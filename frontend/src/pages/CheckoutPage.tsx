import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppLayout from "../components/AppLayout";
import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);

  const [purchasedItems, setPurchasedItems] = useState(cartItems);

  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [addressData, setAddressData] = useState({
    address: "",
    district: "",
    city: "",
    reference: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");

  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
  });

  if (cartItems.length === 0 && step !== 5) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-6">🛒</div>

            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Tu carrito está vacío
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Agrega productos antes de continuar con tu compra.
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

  const generateOrderNumber = () => {
    const random = Math.floor(100 + Math.random() * 900);

    return `ORD-${new Date().getFullYear()}-${random}`;
  };

  const handleCustomerSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleGoToPayment = () => {
    setStep(4);
  };

  const handlePayment = (e: FormEvent) => {
    e.preventDefault();

    const newOrderNumber = generateOrderNumber();

    setPurchasedItems([...cartItems]);

    setPaidTotal(cartTotal);

    setOrderNumber(newOrderNumber);

    clearCart();

    setStep(5);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (step === 5) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 rounded-full bg-brand-green/15 flex items-center justify-center mb-5">
                <span className="text-4xl">✓</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                ¡Compra exitosa!
              </h1>

              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Tu pedido ha sido registrado correctamente.
              </p>
            </div>

            <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm mb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Pedido
                  </p>

                  <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                    {orderNumber}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Fecha
                  </p>

                  <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                    {new Date().toLocaleDateString("es-PE")}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Total
                  </p>

                  <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                    S/ {paidTotal.toFixed(2)}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Estado
                  </p>

                  <p className="text-sm font-black text-brand-green mt-1">
                    En curso
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <h2 className="font-extrabold text-gray-900 dark:text-white mb-4">
                  Productos
                </h2>

                <div className="space-y-4">
                  {purchasedItems.map((item) => (
                    <div
                      key={`${item.id}-${item.size}-${item.color}`}
                      className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Talla: {item.size}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Color: {item.color}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cantidad: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">Subtotal</span>

                  <span className="font-bold">S/ {paidTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm mb-3">
                  <span className="text-brand-green">Descuento</span>

                  <span className="font-bold text-brand-green">- S/ 0.00</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                  <span className="font-extrabold text-lg">Total pagado</span>

                  <span className="font-black text-xl">
                    S/ {paidTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mt-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Envío a</p>

                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {addressData.address}
                  </p>

                  <p className="text-sm text-gray-500">
                    {addressData.district}, {addressData.city}
                  </p>

                  {addressData.reference && (
                    <p className="text-sm text-gray-500">
                      Ref: {addressData.reference}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Método de pago</p>

                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {paymentMethod === "card" ? "Tarjeta" : "Yape"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <button
                onClick={() => navigate("/")}
                className="py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition"
              >
                📦 Ver pedido
              </button>

              <button
                onClick={handlePrintReceipt}
                className="py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition"
              >
                🧾 Comprobante
              </button>

              <Link
                to="/catalogo"
                className="py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition text-center"
              >
                🛍️ Seguir comprando
              </Link>
            </div>

            <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700">
              <div className="flex justify-between items-start border-b border-dashed border-gray-300 dark:border-gray-700 pb-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    FITLOOK
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    Comprobante digital
                  </p>
                </div>

                <button
                  onClick={handlePrintReceipt}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  🖨 Imprimir
                </button>
              </div>

              <div className="py-5 space-y-2 text-sm font-mono text-gray-600 dark:text-gray-400">
                <p>Pedido: {orderNumber}</p>

                <p>Cliente: {customerData.name}</p>

                <p>Correo: {customerData.email}</p>

                <p>Fecha: {new Date().toLocaleDateString("es-PE")}</p>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-4" />

                <p className="font-bold">Productos:</p>

                {purchasedItems.map((item) => (
                  <div
                    key={`receipt-${item.id}-${item.size}-${item.color}`}
                    className="flex justify-between gap-4"
                  >
                    <span>
                      {item.name} x{item.quantity}
                    </span>

                    <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-4" />

                <p className="font-bold text-gray-900 dark:text-white">
                  Total: S/ {paidTotal.toFixed(2)}
                </p>

                <p>Pago: {paymentMethod === "card" ? "Tarjeta" : "Yape"}</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <Link
              to="/carrito"
              className="text-sm font-bold text-gray-500 hover:text-brand-green transition"
            >
              ← Volver al carrito
            </Link>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-4">
              Finalizar compra
            </h1>
          </div>

          <div className="flex items-center justify-center mb-10">
            {[1, 2, 3, 4].map((number) => (
              <div key={number} className="flex items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${
                    step >= number
                      ? "bg-brand-green text-black"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {step > number ? "✓" : number}
                </div>

                {number < 4 && (
                  <div
                    className={`w-10 sm:w-20 h-1 ${
                      step > number
                        ? "bg-brand-green"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleCustomerSubmit}>
              <div className="max-w-2xl mx-auto bg-white dark:bg-brand-card-dark rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="mb-7">
                  <p className="text-xs font-bold text-brand-green uppercase tracking-wider">
                    Paso 1 de 4
                  </p>

                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
                    Tus datos
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Necesitamos estos datos para registrar tu pedido.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Nombre completo
                    </label>

                    <input
                      type="text"
                      required
                      value={customerData.name}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Correo electrónico
                    </label>

                    <input
                      type="email"
                      required
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          email: e.target.value,
                        })
                      }
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Teléfono
                    </label>

                    <input
                      type="tel"
                      required
                      value={customerData.phone}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="999 999 999"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition"
                >
                  Continuar
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleAddressSubmit}>
              <div className="max-w-2xl mx-auto bg-white dark:bg-brand-card-dark rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="mb-7">
                  <p className="text-xs font-bold text-brand-green uppercase tracking-wider">
                    Paso 2 de 4
                  </p>

                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
                    Dirección de entrega
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ¿Dónde deseas recibir tu pedido?
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Dirección
                    </label>

                    <input
                      type="text"
                      required
                      value={addressData.address}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          address: e.target.value,
                        })
                      }
                      placeholder="Av. Javier Prado 1234"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Distrito
                      </label>

                      <input
                        type="text"
                        required
                        value={addressData.district}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            district: e.target.value,
                          })
                        }
                        placeholder="Miraflores"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Ciudad
                      </label>

                      <input
                        type="text"
                        required
                        value={addressData.city}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            city: e.target.value,
                          })
                        }
                        placeholder="Lima"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Referencia
                    </label>

                    <input
                      type="text"
                      value={addressData.reference}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          reference: e.target.value,
                        })
                      }
                      placeholder="Cerca del parque / edificio azul..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                  >
                    ← Atrás
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <p className="text-xs font-bold text-brand-green uppercase tracking-wider">
                    Paso 3 de 4
                  </p>

                  <h2 className="text-2xl font-extrabold mt-2">
                    Resumen del pedido
                  </h2>

                  <div className="mt-7 space-y-5">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.id}-${item.size}-${item.color}`}
                        className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-5"
                      >
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />

                        <div className="flex-1">
                          <h3 className="font-bold">{item.name}</h3>

                          <p className="text-sm text-gray-500">
                            Talla: {item.size}
                          </p>

                          <p className="text-sm text-gray-500">
                            Color: {item.color}
                          </p>

                          <p className="text-sm text-gray-500">
                            Cantidad: {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold">
                      Entrega
                    </p>

                    <p className="font-bold mt-1">{customerData.name}</p>

                    <p className="text-sm text-gray-500">
                      {addressData.address}
                    </p>

                    <p className="text-sm text-gray-500">
                      {addressData.district}, {addressData.city}
                    </p>

                    {addressData.reference && (
                      <p className="text-sm text-gray-500">
                        Ref: {addressData.reference}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                    >
                      ← Atrás
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToPayment}
                      className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl"
                    >
                      Continuar al pago
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm sticky top-6">
                  <h3 className="font-extrabold text-lg mb-5">Total a pagar</h3>

                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500">Subtotal</span>

                    <span className="font-bold">S/ {cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500">Envío</span>

                    <span className="font-bold text-brand-green">GRATIS</span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                    <span className="font-extrabold">Total</span>

                    <span className="text-xl font-black">
                      S/ {cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handlePayment}>
              <div className="max-w-2xl mx-auto bg-white dark:bg-brand-card-dark rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="mb-7">
                  <p className="text-xs font-bold text-brand-green uppercase tracking-wider">
                    Paso 4 de 4
                  </p>

                  <h2 className="text-2xl font-extrabold mt-2">Pago</h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona tu método de pago.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />

                    <div>
                      <p className="font-bold">Tarjeta de crédito/débito</p>

                      <p className="text-xs text-gray-500">
                        Visa, Mastercard, etc.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="yape"
                      checked={paymentMethod === "yape"}
                      onChange={() => setPaymentMethod("yape")}
                    />

                    <div>
                      <p className="font-bold">Yape</p>

                      <p className="text-xs text-gray-500">
                        Pago mediante Yape
                      </p>
                    </div>
                  </label>
                </div>

                {paymentMethod === "card" && (
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Número de tarjeta
                      </label>

                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            number: e.target.value,
                          })
                        }
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold mb-2">
                          Vencimiento
                        </label>

                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              expiry: e.target.value,
                            })
                          }
                          placeholder="MM/AA"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2">
                          CVV
                        </label>

                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardData.cvv}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              cvv: e.target.value,
                            })
                          }
                          placeholder="***"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-green/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "yape" && (
                  <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="font-bold">Pago con Yape</p>

                    <p className="text-sm text-gray-500 mt-1">
                      Para esta versión del prototipo, el pago será simulado.
                    </p>
                  </div>
                )}

                <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-lg">
                      Total a pagar
                    </span>

                    <span className="text-2xl font-black">
                      S/ {cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                  >
                    ← Atrás
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-green text-black font-black rounded-xl hover:opacity-90 transition"
                  >
                    Pagar S/ {cartTotal.toFixed(2)}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
