import { useMemo, useState } from "react";
import type { InventoryMovement } from "../../../data/types";
import type { Product } from "../../../data/adminPrototypeTypes";

interface InventoryAuditViewProps {
  products: Product[];
  movements: InventoryMovement[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function movementLabel(type: InventoryMovement["type"]): string {
  if (type === "Entry") return "Entrada";
  if (type === "Exit") return "Salida";
  return "Ajuste";
}

export default function InventoryAuditView({
  products,
  movements,
}: InventoryAuditViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Todos");

  const productByName = useMemo(
    () => new Map(products.map((product) => [product.name, product])),
    [products],
  );
  const filteredMovements = movements.filter((movement) => {
    const label = movementLabel(movement.type);
    const query = searchTerm.toLowerCase();
    return (
      (filter === "Todos" || label === filter) &&
      [movement.productName, movement.id, movement.note || ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Fecha", "Producto", "Tipo", "Motivo", "Cantidad", "Usuario"];
    const rows = filteredMovements.map((movement) => [
      movement.id,
      movement.datetime,
      movement.productName,
      movementLabel(movement.type),
      movement.note || "",
      movement.quantity.toString(),
      movement.responsible,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8" }));
    link.href = url;
    link.download = `auditoria_inventario_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Auditoría de entradas y salidas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Historial real de movimientos de inventario
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <i className="fa-solid fa-download" /> Exportar CSV
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, ID o motivo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="flex gap-2">
            {["Todos", "Entrada", "Salida", "Ajuste"].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === value ? "bg-[#111111] dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-zinc-800 text-gray-500"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Fecha / ID</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Motivo</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filteredMovements.map((movement) => {
                const product = productByName.get(movement.productName);
                const label = movementLabel(movement.type);
                return (
                  <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold">{formatDate(movement.datetime)}</p>
                      <p className="text-xs text-gray-500 font-mono">{movement.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold">{movement.productName}</p>
                      <p className="text-[10px] text-gray-500">{product ? `FIT-001-${product.id}` : ""}</p>
                      <p className="text-[10px] text-gray-500">Talla {movement.size || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${label === "Entrada" ? "text-blue-500 bg-blue-500/10" : label === "Salida" ? "text-red-500 bg-red-500/10" : "text-amber-600 bg-amber-500/10"}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{movement.note || "-"}</td>
                    <td className="px-4 py-3 text-sm font-black">{movement.quantity}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">{movement.responsible || "Sistema"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMovements.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">No hay movimientos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
