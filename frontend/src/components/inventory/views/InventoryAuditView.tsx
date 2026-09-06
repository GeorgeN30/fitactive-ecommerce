import React, { useState } from "react";

export default function InventoryAuditView({ products }: { products: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("Este mes");

  const auditLogs = products
    .slice(0, 15)
    .map((p, index) => {
      const isEntry = index % 3 === 0;
      const type = isEntry ? "Entrada" : "Salida";
      const reason = isEntry
        ? "Recepción de mercadería"
        : "Venta #ORD-" + (9800 + index);
      const qty = isEntry
        ? Math.floor(Math.random() * 20) + 10
        : Math.floor(Math.random() * 3) + 1;
      const date = new Date(
        Date.now() - Math.floor(Math.random() * 10) * 86400000,
      );

      return {
        id: `AUD-${1000 + index}`,
        product: p,
        type,
        reason,
        qty: isEntry ? `+${qty}` : `-${qty}`,
        user: isEntry ? "Marco Salazar" : "Sistema",
        date: date.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Fecha",
      "Producto",
      "SKU",
      "Tipo",
      "Motivo",
      "Cantidad",
      "Usuario",
    ];
    const rows = auditLogs.map((log) => [
      log.id,
      log.date,
      log.product.name,
      `FIT-001-${log.product.id}`,
      log.type,
      log.reason,
      log.qty.replace("+", ""),
      log.user,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `auditoria_inventario_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Auditoría Entradías/Salidías</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Historial completo de movimientos de inventario
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <i className="fa-solid fa-download"></i> Exportar CSV
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar por producto, ID o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-600 dark:text-gray-400 focus:outline-none focus:border-[#F59E0B]"
            >
              <option>Hoy</option>
              <option>Esta semana</option>
              <option>Este mes</option>
              <option>Últimos 3 meses</option>
            </select>

            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-2"></div>

            {["Todos", "Entrada", "Salida"].map((f) => (
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
                  Fecha / ID
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {auditLogs
                .filter((log) => filter === "Todos" || log.type === filter)
                .filter(
                  (log) =>
                    log.product.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.reason.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {log.date}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {log.id}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={log.product.image}
                          alt={log.product.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {log.product.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            FIT-001-{log.product.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${log.type === "Entrada" ? "text-blue-500 bg-blue-500/10" : "text-red-500 bg-red-500/10"}`}
                      >
                        <i
                          className={`fa-solid ${log.type === "Entrada" ? "fa-arrow-down" : "fa-arrow-up"} mr-1`}
                        ></i>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {log.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-black ${log.type === "Entrada" ? "text-blue-500" : "text-red-500"}`}
                      >
                        {log.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                        {log.user}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
