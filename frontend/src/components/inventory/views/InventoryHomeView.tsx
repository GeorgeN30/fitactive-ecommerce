import React from "react";

export default function InventoryHomeView({
  setSection,
  products,
}: {
  setSection: (s: any) => void;
  products: any[];
}) {
  const allProducts = products.map((p) => {
    const total = Object.values(p.stock).reduce(
      (a: any, b: any) => a + b,
      0,
    ) as number;
    const min = 15;
    const status =
      total === 0
        ? "Agotado"
        : total < min
          ? "Crítico"
          : total < min + 10
            ? "Bajo"
            : "Normal";
    const type =
      total === 0
        ? "out"
        : total < min
          ? "critical"
          : total < min + 10
            ? "low"
            : "ok";
    return { ...p, stock: total, min, status, type };
  });

  const cards = [
    {
      label: "Productos en stock",
      count: allProducts.filter((p) => p.type === "ok").length,
      type: "ok",
      icon: "fa-check",
    },
    {
      label: "Stock bajo",
      count: allProducts.filter((p) => p.type === "low").length,
      type: "low",
      icon: "fa-exclamation",
    },
    {
      label: "Stock crítico",
      count: allProducts.filter((p) => p.type === "critical").length,
      type: "critical",
      icon: "fa-triangle-exclamation",
    },
    {
      label: "Productos agotados",
      count: allProducts.filter((p) => p.type === "out").length,
      type: "out",
      icon: "fa-xmark",
    },
  ];

  const getColor = (type: string) => {
    switch (type) {
      case "ok":
        return "text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/20";
      case "low":
        return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20";
      case "critical":
        return "text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20";
      case "out":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-500 bg-gray-100 border-gray-200";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "ok":
        return "text-[#00FF66]";
      case "low":
        return "text-[#F59E0B]";
      case "critical":
        return "text-[#F97316]";
      case "out":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const attentionItems = allProducts
    .filter((p) => p.type === "out" || p.type === "critical")
    .slice(0, 2);
  const alertItems = allProducts.filter((p) => p.type !== "ok");

  return (
    <div className="space-y-8 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Almacén</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Estado operativo del inventario en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${getColor(c.type)} flex flex-col justify-between h-32 transition-transform hover:scale-105 cursor-pointer`}
            onClick={() => setSection("stock")}
          >
            <div className="flex justify-between items-start">
              <i className={`fa-solid ${c.icon} text-lg`} />
            </div>
            <div>
              <p className="text-3xl font-black">{c.count}</p>
              <p className="text-xs font-semibold opacity-80 mt-1">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-red-50/50 dark:bg-red-500/5">
          <div className="flex items-center gap-2 text-red-500">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <h3 className="font-bold text-sm">
              Requieren atención inmediata ({attentionItems.length} productos)
            </h3>
          </div>
          <button
            onClick={() => setSection("alerts")}
            className="text-xs font-bold text-red-500 hover:underline"
          >
            Ver todos &rarr;
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {attentionItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-950/50 rounded-xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {item.stock} uds. / min: {item.min}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSection("restock")}
                className="px-3 py-1.5 bg-[#F59E0B] text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Reabastecer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-sm">Alertas de Inventario</h3>
          <button
            onClick={() => setSection("alerts")}
            className="text-xs font-bold text-[#F59E0B] hover:underline"
          >
            Ver todos &rarr;
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {alertItems.map((item, i) => (
            <div
              key={i}
              className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-2 h-2 rounded-full ${getIconColor(item.type)}`}
                />
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className={`h-full rounded-full ${item.type === "out" ? "bg-red-500" : item.type === "critical" ? "bg-[#F97316]" : "bg-[#F59E0B]"}`}
                        style={{
                          width: `${Math.max(5, (item.stock / item.min) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium w-16">
                      {item.stock}/{item.min}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full ${getColor(item.type).split(" ")[0]} ${getColor(item.type).split(" ")[1]}`}
                >
                  {item.status}
                </span>
                <button
                  onClick={() => setSection("restock")}
                  className="px-3 py-1.5 bg-[#F59E0B] text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
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
