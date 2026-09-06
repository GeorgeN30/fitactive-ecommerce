import React, { useState } from "react";

export default function InventoryRestockView({
  products,
  setProducts,
  addNotification,
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priority, setPriority] = useState("Media");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<any>({});

  const suggestions = products
    .filter((p: any) => {
      const total = Object.values(p.stock).reduce(
        (a: any, b: any) => a + b,
        0,
      ) as number;
      return total < 15;
    })
    .map((p: any) => ({
      ...p,
      actual: Object.values(p.stock).reduce(
        (a: any, b: any) => a + b,
        0,
      ) as number,
      recommended: 15 + Math.floor(Math.random() * 10),
    }));

  const [requests, setRequests] = useState([
    {
      id: 1,
      name: "Polo Performance Pro",
      priority: "Alta",
      status: "Pendiente",
      qty: 50,
      desc: "Agotamiento previsto en 3 días",
      date: "2026-09-03",
      icon: "fa-box",
    },
    {
      id: 2,
      name: "Shorts Running Aerox",
      priority: "Media",
      status: "Enviado",
      qty: 30,
      desc: "Aprobado para ingreso",
      date: "2026-09-01",
      icon: "fa-box-open",
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleCreateRequest = () => {
    const newErrors: any = {};
    if (!selectedProduct) newErrors.product = "Debe seleccionar un producto";
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0)
      newErrors.quantity = "Cantidad inválida";
    if (!note.trim()) newErrors.note = "La nota es obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const prodName =
      products.find((p: any) => p.id.toString() === selectedProduct)?.name ||
      "Producto Nuevo";

    setRequests([
      {
        id: Date.now(),
        name: prodName,
        priority,
        status: "Pendiente",
        qty: Number(quantity),
        desc: "Solicitud recién creada",
        date: new Date().toISOString().split("T")[0],
        icon: "fa-box",
      },
      ...requests,
    ]);

    showToast("¡Solicitud creada exitosamente y notificada al administrador!");
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProduct("");
    setQuantity("");
    setPriority("Media");
    setNote("");
    setErrors({});
  };

  const markAsReceived = (req: any) => {
    setProducts(
      products.map((p: any) => {
        if (p.name === req.name) {
          return {
            ...p,
            stock: {
              ...p.stock,
              [Object.keys(p.stock)[0] || "Única"]:
                (p.stock[Object.keys(p.stock)[0] || "Única"] || 0) + req.qty,
            },
          };
        }
        return p;
      }),
    );

    showToast("¡Inventario actualizado! Solicitud marcada como recibida.");
    setRequests(requests.filter((r: any) => r.id !== req.id));
    if (addNotification) {
      addNotification({
        id: Date.now(),
        title: "Ingreso Completado",
        message: `Han ingresado ${req.qty} unidades de "${req.name}" al catálogo exitosamente.`,
        type: "success",
        time: "Justo ahora",
        read: false,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white dark:text-white pb-10 max-w-6xl mx-auto relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] bg-[#00FF66] text-black dark:text-white px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
          {toastMessage}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up p-6">
            <h2 className="text-[22px] font-black text-black dark:text-white mb-6">
              Nueva solicitud
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Producto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 border ${errors.product ? "border-red-500" : "border-gray-200 dark:border-zinc-800"} rounded-xl focus:outline-none focus:border-[#F59E0B] text-sm text-black dark:text-white`}
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock:{" "}
                      {Object.values(p.stock).reduce(
                        (a: any, b: any) => a + b,
                        0,
                      )}
                      )
                    </option>
                  ))}
                </select>
                {errors.product && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">
                    {errors.product}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="20"
                  className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 border ${errors.quantity ? "border-red-500" : "border-gray-200 dark:border-zinc-800"} rounded-xl focus:outline-none focus:border-[#F59E0B] text-black dark:text-white font-medium`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">
                    {errors.quantity}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                  Prioridad
                </label>
                <div className="flex gap-2">
                  {["Alta", "Media", "Baja"].map((pri) => (
                    <button
                      key={pri}
                      onClick={() => setPriority(pri)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${priority === pri ? "border-2 border-[#F59E0B] text-[#F59E0B] bg-orange-50/50" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200"}`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Nota
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Motivo o instrucciones..."
                  className={`w-full px-4 py-3 bg-white dark:bg-zinc-900 border ${errors.note ? "border-red-500" : "border-gray-200 dark:border-zinc-800"} rounded-xl focus:outline-none focus:border-[#F59E0B] text-sm text-black dark:text-white resize-none`}
                ></textarea>
                {errors.note && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">
                    {errors.note}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-black dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:bg-zinc-950/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRequest}
                className="flex-1 py-3 bg-[#F59E0B] text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
              >
                Crear solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-black tracking-tight">
            Reabastecimiento
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Gestión de solicitudes de producción e ingreso interno
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-[#F59E0B] text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2"
        >
          + Nueva Solicitud
        </button>
      </div>

      <div className="bg-[#FFFDF9] dark:bg-yellow-500/5 border border-[#FDE6B8] dark:border-[#F59E0B]/20 rounded-[24px] p-5">
        <h3 className="text-sm font-bold text-[#F59E0B] flex items-center gap-2 mb-4">
          <i className="fa-solid fa-bolt"></i> Sugerencias automáticas de
          reabastecimiento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.slice(0, 4).map((s: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-950/50/50 border border-gray-200 dark:border-zinc-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-10 h-10 rounded-lg object-cover bg-white dark:bg-zinc-900 p-0.5 border border-gray-100 dark:border-zinc-800"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {s.name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Stock actual: {s.actual} · Recomendado: {s.recommended} uds.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(s.id.toString());
                  setQuantity((s.recommended - s.actual).toString());
                  setIsModalOpen(true);
                }}
                className="px-4 py-1.5 bg-[#F59E0B] text-black text-[10px] font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Crear
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-gray-100 dark:border-zinc-800 overflow-hidden mt-6">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold text-lg">Solicitudes ({requests.length})</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 flex items-center justify-between hover:bg-gray-50 dark:bg-zinc-950/50/50 transition-colors"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F59E0B] text-xl">
                  <i className={`fa-solid ${req.icon}`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {req.name}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.priority === "Alta" ? "text-red-500 bg-red-50" : req.priority === "Media" ? "text-[#F59E0B] bg-orange-50" : "text-gray-500 bg-gray-100 dark:bg-zinc-800"}`}
                    >
                      Prioridad {req.priority}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.status === "Enviado" ? "text-blue-500 bg-blue-50" : "text-[#F59E0B] bg-orange-50"}`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm font-black mt-1">{req.qty} unidades</p>
                  <p className="text-xs text-gray-500 mt-1">{req.desc}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {req.date}
                  </p>
                </div>
              </div>

              {req.status === "Enviado" && (
                <button
                  onClick={() => markAsReceived(req)}
                  className="px-4 py-2 bg-green-50 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors"
                >
                  Marcar recibido
                </button>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No hay solicitudes activas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
