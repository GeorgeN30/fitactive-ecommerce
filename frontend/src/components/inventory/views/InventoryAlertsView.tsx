import React, { useState } from "react";

export default function InventoryAlertsView({ products }: { products: any[] }) {
  const [filter, setFilter] = useState("Todos");
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState<any>(null);

  const handleRestockClick = (product: any) => {
    setRestockingProduct(product);
    setIsRestockModalOpen(true);
  };

  const alertProducts = products
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
      return { ...p, totalStock, minStock, status };
    })
    .filter((p) => p.status !== "Normal");

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto relative">
      {isRestockModalOpen && restockingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsRestockModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up border border-gray-100 dark:border-zinc-800">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Reabastecer producto</h2>
              <p className="text-sm text-gray-500 mt-1">
                {restockingProduct.name}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Unidades a añadir
                </label>
                <div className="flex items-center border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-950/50">
                  <button className="px-5 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors font-bold">
                    -
                  </button>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full text-center bg-transparent focus:outline-none font-bold"
                  />
                  <button className="px-5 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors font-bold">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex gap-4">
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="flex-1 px-4 py-3 bg-[#F59E0B] text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-[#F59E0B]/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Alertas de Stock</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitoreo de inventario crítico y bajo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <span className="text-3xl font-black text-red-500">
            {alertProducts.filter((p) => p.status === "Agotado").length}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
            Agotados
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <span className="text-3xl font-black text-[#F97316]">
            {alertProducts.filter((p) => p.status === "Crítico").length}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
            Críticos
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <span className="text-3xl font-black text-[#F59E0B]">
            {alertProducts.filter((p) => p.status === "Bajo").length}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
            Stock Bajo
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {["Todos", "Agotado", "Crítico", "Bajo"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f ? "bg-[#111111] dark:bg-white text-white dark:text-black shadow-md" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {alertProducts.length} resultados
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {alertProducts
            .filter((p) => filter === "Todos" || p.status === filter)
            .map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col md:flex-row items-center gap-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div
                    className={`w-2 h-2 rounded-full ${p.status === "Agotado" ? "bg-red-500" : p.status === "Crítico" ? "bg-[#F97316]" : "bg-[#F59E0B]"}`}
                  />
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {p.name}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === "Agotado" ? "text-red-500 bg-red-500/10" : p.status === "Crítico" ? "text-[#F97316] bg-[#F97316]/10" : "text-[#F59E0B] bg-[#F59E0B]/10"}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      FIT-001-{p.id}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Mínimo requerido: {p.minStock} uds. | Déficit:{" "}
                      {Math.max(0, p.minStock - p.totalStock)} uds.
                    </span>
                    <span
                      className={`text-xs font-bold ${p.status === "Agotado" ? "text-red-500" : p.status === "Crítico" ? "text-[#F97316]" : "text-[#F59E0B]"}`}
                    >
                      {p.totalStock} / {p.minStock * 2} uds.
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.status === "Agotado" ? "bg-red-500" : p.status === "Crítico" ? "bg-[#F97316]" : "bg-[#F59E0B]"}`}
                      style={{
                        width: `${Math.max(2, (p.totalStock / (p.minStock * 2)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleRestockClick(p)}
                    className="px-5 py-2.5 bg-[#F59E0B] text-black text-xs font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-sm"
                  >
                    Reabastecer
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
