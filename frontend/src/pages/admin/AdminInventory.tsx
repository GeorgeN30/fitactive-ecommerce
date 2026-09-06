import { useState, useMemo } from "react";
import type { Product, MovementType } from "../../data/types";
import { mockProducts, mockMovements } from "../../data/mock";

export default function AdminInventory() {
  const [products] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<Record<string, number>>({});

  const stockTotal = products.reduce((sum, p) => sum + p.totalStock, 0);
  const stockBajo = products.filter(
    (p) => p.totalStock > 0 && p.totalStock <= 10,
  ).length;
  const sinStock = products.filter((p) => p.totalStock === 0).length;
  const stockValue = products.reduce(
    (sum, p) => sum + p.totalStock * p.price,
    0,
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || p.category === filterCategory;
      let matchStock = true;
      if (filterStock === "InStock") matchStock = p.totalStock > 10;
      else if (filterStock === "LowStock")
        matchStock = p.totalStock > 0 && p.totalStock <= 10;
      else if (filterStock === "OutOfStock") matchStock = p.totalStock === 0;
      return matchSearch && matchCategory && matchStock;
    });
  }, [products, search, filterCategory, filterStock]);

  function getStockStatus(stock: number): { label: string; style: string } {
    if (stock === 0)
      return { label: "Sin Stock", style: "bg-red-100 text-red-700" };
    if (stock <= 10)
      return { label: "Bajo Stock", style: "bg-amber-100 text-amber-700" };
    return { label: "Con Stock", style: "bg-emerald-100 text-emerald-700" };
  }

  function formatMovementType(type: MovementType, note?: string): string {
    if (type === "Exit" && note) return `Salida (${note})`;
    if (type === "Entry" && note) return `Entrada (${note})`;
    return type === "Exit" ? "Salida" : "Entrada";
  }

  function formatQuantity(qty: number): string {
    return qty >= 0 ? `+${qty}` : String(qty);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return "Ahora";
    if (diffH < 24) return `${diffH}h atrás`;
    return d.toLocaleDateString("es-CL", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Control de Inventario
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Control de stock, alertas de bajo stock y auditoría de movimientos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all">
            Actualizar Stock
          </button>
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all">
            <i className="fa-solid fa-download text-xs" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {stockBajo > 0 && (
        <div className="bg-amber-500/10 border border-amber-400/60 rounded-2xl p-4 flex items-center justify-between text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-triangle-exclamation text-amber-600" />
            <span>
              {stockBajo} productos con bajo stock requieren atención inmediata.
            </span>
          </div>
          <button
            onClick={() => setFilterStock("LowStock")}
            className="text-amber-700 hover:underline text-xs font-extrabold"
          >
            Ver productos
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Stock Total
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {stockTotal.toLocaleString()}{" "}
            <span className="text-sm font-semibold text-slate-500">
              unidades
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            unidades en bodega
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Bajo Stock
          </span>
          <h3 className="text-2xl font-black text-amber-500 mt-1">
            {stockBajo}{" "}
            <span className="text-sm font-semibold text-amber-600">
              productos
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">bajo umbral</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Sin Stock
          </span>
          <h3 className="text-2xl font-black text-red-500 mt-1">
            {sinStock}{" "}
            <span className="text-sm font-semibold text-red-600">
              productos
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            con inventario cero
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Valor del Inventario
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            ${stockValue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            valor comercial estimado
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, nombre, etc..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-green text-xs rounded-xl focus:outline-none font-semibold"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">Nivel de Stock: Todos</option>
            <option value="InStock">Con Stock</option>
            <option value="LowStock">Bajo Stock</option>
            <option value="OutOfStock">Sin Stock</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">Categoría: Todas</option>
            <option value="Clothing">Ropa</option>
            <option value="Footwear">Calzado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Imagen</th>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-6">SKU</th>
                <th className="py-3.5 px-6">Talles</th>
                <th className="py-3.5 px-6">Stock Total</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filtered.map((p) => {
                const status = getStockStatus(p.totalStock);
                return (
                  <Fragment key={p.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900">
                          {p.name}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {p.sport}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {p.sku}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {p.sizes
                            .filter((s) =>
                              ["S", "M", "L", "XL"].includes(s.size),
                            )
                            .map((s) => (
                              <span
                                key={s.size}
                                className={`px-2 py-1 rounded text-[10px] font-bold ${s.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                              >
                                {s.size}: {s.stock}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        {p.totalStock}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold ${status.style}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setExpandedRow(expandedRow === p.id ? null : p.id);
                            if (!tempStock[p.id])
                              setTempStock((t) => ({
                                ...t,
                                [p.id]:
                                  p.sizes.find((s) => s.size === "M")?.stock ||
                                  0,
                              }));
                          }}
                          className="text-brand-green hover:text-brand-green-hover text-xs font-bold transition-colors"
                        >
                          Modificar
                        </button>
                      </td>
                    </tr>
                    {expandedRow === p.id && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50 px-6 py-4">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-700">
                              Modificar stock para M:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setTempStock((t) => ({
                                    ...t,
                                    [p.id]: Math.max(0, (t[p.id] || 0) - 1),
                                  }))
                                }
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                              >
                                <i className="fa-solid fa-minus text-xs" />
                              </button>
                              <span className="w-12 text-center font-extrabold text-sm">
                                {tempStock[p.id] || 0}
                              </span>
                              <button
                                onClick={() =>
                                  setTempStock((t) => ({
                                    ...t,
                                    [p.id]: (t[p.id] || 0) + 1,
                                  }))
                                }
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                              >
                                <i className="fa-solid fa-plus text-xs" />
                              </button>
                            </div>
                            <button className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-black text-xs font-bold rounded-xl transition-all">
                              Guardar Cambios
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Historial de Movimientos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Fecha / Hora</th>
                <th className="py-3.5 px-6">Producto</th>
                <th className="py-3.5 px-6">Tipo</th>
                <th className="py-3.5 px-6">Cantidad</th>
                <th className="py-3.5 px-6">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {mockMovements.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-4 px-6 text-slate-400">
                    {formatDate(m.datetime)}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {m.productName}
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {formatMovementType(m.type, m.note)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`font-extrabold ${m.quantity >= 0 ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {formatQuantity(m.quantity)} unidades
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">{m.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
