import React, { useState } from "react";

export default function InventoryStockView({
  products,
  setProducts,
}: {
  products: any[];
  setProducts: any;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [stockInput, setStockInput] = useState("");

  const metrics = [
    { label: "Total productos", value: "8", desc: "" },
    {
      label: "Unidades totales",
      value: "205 uds.",
      desc: "",
      color: "text-[#00FF66]",
    },
    {
      label: "Valor del inventario",
      value: "S/ 22900",
      desc: "",
      color: "text-[#F59E0B]",
    },
    {
      label: "Requieren atención",
      value: "3",
      desc: "",
      color: "text-red-500",
    },
  ];

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setStockInput(
      Object.values(product.stock).reduce(
        (a: any, b: any) => a + b,
        0,
      ) as string,
    );
    setIsEditModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSaveStock = () => {
    if (!stockInput || isNaN(Number(stockInput))) {
      alert("Debe ingresar un número válido");
      return;
    }

    setProducts(
      products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            stock: { S: 0, M: 0, L: Number(stockInput) },
          };
        }
        return p;
      }),
    );

    showToast("¡Stock actualizado correctamente!");
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] bg-[#00FF66] text-black px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
          {toastMessage}
        </div>
      )}

      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-gray-100 dark:border-zinc-800">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Ajustar Stock</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={editingProduct.image}
                  alt={editingProduct.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {editingProduct.name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    FIT-001-{editingProduct.id}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Nuevo Stock Total
                </label>
                <div className="flex items-center border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-950/50">
                  <button
                    onClick={() =>
                      setStockInput((Number(stockInput) - 1).toString())
                    }
                    className="px-5 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    className="w-full text-center bg-transparent focus:outline-none font-bold"
                  />
                  <button
                    onClick={() =>
                      setStockInput((Number(stockInput) + 1).toString())
                    }
                    className="px-5 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Motivo del ajuste
                </label>
                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#F59E0B] text-sm">
                  <option>Recepción de mercadería (Entrada)</option>
                  <option>Venta offline (Salida)</option>
                  <option>Producto defectuoso (Baja)</option>
                  <option>Auditoría (Ajuste)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex gap-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStock}
                className="flex-1 px-4 py-3 bg-[#00FF66] text-black font-bold rounded-xl hover:bg-[#00cc52] transition-colors shadow-lg shadow-[#00FF66]/20"
              >
                Guardar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Control de Stock</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vista detallada y edición directa de inventario
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
          >
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {m.label}
            </span>
            <span
              className={`text-3xl font-black mt-2 ${m.color || "text-gray-900 dark:text-white"}`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Todos", "Normal", "Bajo", "Crítico", "Agotado"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f ? "bg-[#111111] dark:bg-white text-white dark:text-black shadow-md" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((p) => {
                  const totalStock = Object.values(p.stock).reduce(
                    (a: any, b: any) => a + b,
                    0,
                  ) as number;
                  const minStock = 15;
                  const status =
                    totalStock === 0
                      ? "Agotado"
                      : totalStock < minStock
                        ? "Crítico"
                        : totalStock < minStock + 10
                          ? "Bajo"
                          : "Normal";

                  if (filter !== "Todos" && status !== filter) return null;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {p.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        FIT-001-{p.id}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {p.category}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-bold ${status === "Normal" ? "text-[#00FF66]" : status === "Agotado" ? "text-red-500" : "text-[#F59E0B]"}`}
                          >
                            {totalStock} uds.
                          </span>
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[100px] hidden lg:block">
                            <div
                              className={`h-full rounded-full ${status === "Normal" ? "bg-[#00FF66]" : status === "Agotado" ? "bg-red-500" : "bg-[#F59E0B]"}`}
                              style={{
                                width: `${Math.max(5, (totalStock / (minStock * 2)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {minStock} uds.
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full ${status === "Normal" ? "text-[#00FF66] bg-[#00FF66]/10" : status === "Agotado" ? "text-red-500 bg-red-500/10" : "text-[#F59E0B] bg-[#F59E0B]/10"}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="text-[10px] font-bold px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Editar stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
