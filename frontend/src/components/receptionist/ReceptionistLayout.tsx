import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { mockProducts } from "../../data/mock";

type Section =
  | "dashboard"
  | "inventory"
  | "alerts"
  | "restocking"
  | "notifications"
  | "config";

type StockState = Record<string, Record<string, number>>;

const LEVEL_CONFIG: Record<
  string,
  {
    label: string;
    cls: string;
    badge: string;
    border: string;
  }
> = {
  ok: {
    label: "En stock",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    badge: "fa-circle",
    border: "",
  },

  low: {
    label: "Stock bajo",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    badge: "fa-flag",
    border: "border-l-4 border-amber-400",
  },

  critical: {
    label: "Stock crítico",
    cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    badge: "fa-triangle-exclamation",
    border: "border-l-4 border-orange-500",
  },

  out: {
    label: "Agotado",
    cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    badge: "fa-circle-xmark",
    border: "border-l-4 border-red-500",
  },
};

const STOCK_COLORS: Record<string, string> = {
  ok: "#10b981",
  low: "#f59e0b",
  critical: "#f97316",
  out: "#ef4444",
};

const PRIORITY_CONFIG: Record<
  string,
  {
    label: string;
    cls: string;
  }
> = {
  alta: {
    label: "Alta",
    cls: "bg-red-500 text-white dark:bg-red-600 dark:text-white",
  },

  "media-alta": {
    label: "Media-alta",
    cls: "bg-orange-500 text-white dark:bg-orange-600 dark:text-white",
  },

  media: {
    label: "Media",
    cls: "bg-yellow-400 text-black dark:bg-yellow-500 dark:text-black",
  },

  baja: {
    label: "Baja",
    cls: "bg-blue-500 text-white dark:bg-blue-600 dark:text-white",
  },
};

export default function ReceptionistLayout() {
  const { user } = useAuth();

  const [section, setSection] =
    useState<Section>("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [stocks, setStocks] =
    useState<StockState>(
      Object.fromEntries(
        mockProducts.map((p) => [
          p.id,
          Object.fromEntries(
            p.sizes.map((s) => [s.size, s.stock]),
          ),
        ]),
      ),
    );

  const [restockQtys, setRestockQtys] =
    useState<Record<string, number>>({});

  const [restocked, setRestocked] =
    useState<Set<string>>(new Set());

  const [received, setReceived] =
    useState<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterStatus, setFilterStatus] =
    useState("all");

  const [configToggles, setConfigToggles] =
    useState({
      a: true,
      b: true,
      c: true,
    });

  const getStockTotal = (productId: string) =>
    Object.values(stocks[productId] || {}).reduce(
      (a, b) => a + b,
      0,
    );

  const getStockLevel = (
    productId: string,
  ): keyof typeof LEVEL_CONFIG => {
    const total = getStockTotal(productId);

    const product = mockProducts.find(
      (p) => p.id === productId,
    );

    if (total === 0) return "out";

    if (total <= 2) return "critical";

    if (
      product &&
      total <=
        Math.max(
          5,
          Math.floor(product.totalStock * 0.25),
        )
    ) {
      return "low";
    }

    return "ok";
  };

  const handleRestock = (productId: string) => {
    const qty = restockQtys[productId] || 10;

    const product = mockProducts.find(
      (p) => p.id === productId,
    );

    if (!product) return;

    const firstSize = product.sizes[0].size;

    setStocks((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [firstSize]:
          (prev[productId]?.[firstSize] || 0) + qty,
      },
    }));

    setRestocked((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  };

  const handleMarkReceived = (
    productId: string,
  ) => {
    setReceived((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  };

  const navigation = [
    {
      key: "dashboard" as Section,
      label: "Dashboard",
      icon: "fa-chart-pie",
    },
    {
      key: "inventory" as Section,
      label: "Inventario",
      icon: "fa-boxes-stacked",
    },
    {
      key: "alerts" as Section,
      label: "Alertas",
      icon: "fa-triangle-exclamation",
    },
    {
      key: "restocking" as Section,
      label: "Reabastecimiento",
      icon: "fa-truck-ramp-box",
    },
    {
      key: "notifications" as Section,
      label: "Notificaciones",
      icon: "fa-bell",
    },
    {
      key: "config" as Section,
      label: "Configuración",
      icon: "fa-gear",
    },
  ];

  const filteredProducts =
    mockProducts.filter((product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const level = getStockLevel(product.id);

      const matchesStatus =
        filterStatus === "all" ||
        level === filterStatus;

      return matchesSearch && matchesStatus;
    });

  const renderDashboard = () => {
    const totalProducts = mockProducts.length;

    const totalStock = mockProducts.reduce(
      (total, product) =>
        total + getStockTotal(product.id),
      0,
    );

    const lowStock = mockProducts.filter(
      (product) => {
        const level = getStockLevel(product.id);

        return (
          level === "low" ||
          level === "critical"
        );
      },
    ).length;

    const outOfStock = mockProducts.filter(
      (product) =>
        getStockLevel(product.id) === "out",
    ).length;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Dashboard
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Resumen general del inventario
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Productos
            </p>

            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {totalProducts}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stock total
            </p>

            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {totalStock}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stock bajo
            </p>

            <p className="text-3xl font-black text-amber-500 mt-2">
              {lowStock}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Agotados
            </p>

            <p className="text-3xl font-black text-red-500 mt-2">
              {outOfStock}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-gray-900 dark:text-white">
                Acciones rápidas
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gestiona rápidamente el inventario
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() =>
                setSection("inventory")
              }
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-transparent hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors text-left"
            >
              <i className="fa-solid fa-boxes-stacked text-amber-400" />

              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Ver inventario
              </span>
            </button>

            <button
              onClick={() =>
                setSection("alerts")
              }
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-transparent hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors text-left"
            >
              <i className="fa-solid fa-triangle-exclamation text-amber-400" />

              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Revisar alertas
              </span>
            </button>

            <button
              onClick={() =>
                setSection("restocking")
              }
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-transparent hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors text-left"
            >
              <i className="fa-solid fa-truck-ramp-box text-amber-400" />

              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Reabastecimiento
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Inventario
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Consulta el estado actual de los productos
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/10 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Buscar producto..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value)
              }
              className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none"
            >
              <option value="all">
                Todos
              </option>

              <option value="ok">
                En stock
              </option>

              <option value="low">
                Stock bajo
              </option>

              <option value="critical">
                Stock crítico
              </option>

              <option value="out">
                Agotado
              </option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#111111]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Producto
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Stock
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => {
                    const level =
                      getStockLevel(product.id);

                    const config =
                      LEVEL_CONFIG[level];

                    const total =
                      getStockTotal(product.id);

                    return (
                      <tr
                        key={product.id}
                        className={`border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                          level !== "ok"
                            ? "bg-amber-50/30 dark:bg-amber-900/10"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {product.name}
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {product.category}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-black text-gray-900 dark:text-white">
                            {total}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${config.cls}`}
                          >
                            <i
                              className={`fa-solid ${config.badge}`}
                            />

                            {config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAlerts = () => {
    const alertProducts =
      mockProducts.filter((product) => {
        const level =
          getStockLevel(product.id);

        return (
          level === "low" ||
          level === "critical" ||
          level === "out"
        );
      });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Alertas de inventario
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Productos que requieren atención
          </p>
        </div>

        <div className="space-y-3">
          {alertProducts.map((product) => {
            const level =
              getStockLevel(product.id);

            const config =
              LEVEL_CONFIG[level];

            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 border border-gray-100 dark:border-white/10 ${config.border}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white">
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Stock actual:{" "}
                      {getStockTotal(product.id)}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${config.cls}`}
                  >
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}

          {alertProducts.length === 0 && (
            <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-8 text-center">
              <i className="fa-solid fa-circle-check text-3xl text-green-500 mb-3" />

              <p className="font-bold text-gray-900 dark:text-white">
                No hay alertas pendientes
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRestocking = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Solicitudes de reabastecimiento
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registra y confirma la recepción de productos
          </p>
        </div>

        <div className="space-y-4">
          {mockProducts.map((product) => {
            const level =
              getStockLevel(product.id);

            const config =
              LEVEL_CONFIG[level];

            const isRestocked =
              restocked.has(product.id);

            const isReceived =
              received.has(product.id);

            /*
             * Prioridad visual según el nivel de stock.
             * Esto solamente define la apariencia del badge.
             */
            const priorityKey =
              level === "out"
                ? "alta"
                : level === "critical"
                  ? "alta"
                  : level === "low"
                    ? "media-alta"
                    : "baja";

            const priority =
              PRIORITY_CONFIG[priorityKey];

            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-[#1A1A1A]
                  hover:bg-gray-100 dark:hover:bg-[#242424]
                  rounded-2xl p-5
                  border border-gray-100 dark:border-white/10
                  transition-colors duration-200
                  ${
                    level !== "ok"
                      ? "border-l-4 border-amber-400"
                      : ""
                  }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* PRODUCTO */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#242424] flex items-center justify-center">
                      <i className="fa-solid fa-box text-gray-500 dark:text-gray-300" />
                    </div>

                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white">
                        {product.name}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Stock actual:{" "}
                        <span className="font-bold">
                          {getStockTotal(product.id)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ESTADO + PRIORIDAD */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${config.cls}`}
                    >
                      {config.label}
                    </span>

                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${priority.cls}`}
                    >
                      Prioridad {priority.label}
                    </span>

                    {level !== "ok" && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-black dark:bg-amber-400 dark:text-black">
                        Requiere atención
                      </span>
                    )}
                  </div>

                  {/* CANTIDAD */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Cantidad
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={
                        restockQtys[product.id] ||
                        10
                      }
                      onChange={(e) => {
                        const value =
                          Number(e.target.value);

                        setRestockQtys((prev) => ({
                          ...prev,
                          [product.id]: value,
                        }));
                      }}
                      className="w-20 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-center font-bold outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* ACCIONES */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isRestocked ? (
                      <button
                        onClick={() =>
                          handleRestock(
                            product.id,
                          )
                        }
                        className="
                          px-4 py-2
                          rounded-xl
                          font-bold
                          text-sm
                          transition-all
                          bg-[#0A0A0A]
                          dark:bg-white/10
                          text-white
                          hover:bg-gray-800
                          dark:hover:bg-white/20
                          hover:scale-105
                        "
                      >
                        Registrar
                      </button>
                    ) : isReceived ? (
                      <span
                        className="
                          px-4 py-2
                          rounded-xl
                          font-bold
                          text-sm
                          bg-green-500
                          text-white
                          dark:bg-green-500
                          dark:text-white
                          border
                          border-green-500
                          dark:border-green-500
                        "
                      >
                        ✓ Recibido
                      </span>
                    ) : (
                      <>
                        <span
                          className="
                            px-3 py-2
                            rounded-xl
                            font-bold
                            text-sm
                            bg-green-500
                            text-white
                            dark:bg-green-500
                            dark:text-white
                            border
                            border-green-500
                            dark:border-green-500
                          "
                        >
                          ✓ Listo
                        </span>

                        <button
                          onClick={() =>
                            handleMarkReceived(
                              product.id,
                            )
                          }
                          className="
                            px-4 py-2
                            rounded-xl
                            font-bold
                            text-sm
                            bg-blue-500
                            text-white
                            hover:bg-blue-600
                            dark:bg-blue-500
                            dark:text-white
                            dark:hover:bg-blue-600
                            transition-all
                            hover:scale-105
                          "
                        >
                          Marcar recibido
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Notificaciones
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revisa las novedades del inventario
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-[#3A2D14] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bell text-amber-500" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Revisión de inventario
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Hay productos que requieren revisión de stock.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-circle-check text-green-500" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Sistema operativo
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  El módulo de inventario está funcionando correctamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfig = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Configuración
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Preferencias del módulo de inventario
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/10">
            <h2 className="font-black text-gray-900 dark:text-white">
              Preferencias
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {[
              {
                key: "a" as const,
                title: "Alertas de stock bajo",
                description:
                  "Mostrar alertas cuando un producto tenga poco stock.",
              },
              {
                key: "b" as const,
                title: "Notificaciones",
                description:
                  "Recibir avisos relacionados con el inventario.",
              },
              {
                key: "c" as const,
                title: "Actualización automática",
                description:
                  "Actualizar los datos del inventario automáticamente.",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-5 p-5"
              >
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setConfigToggles((prev) => ({
                      ...prev,
                      [item.key]:
                        !prev[item.key],
                    }))
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    configToggles[item.key]
                      ? "bg-amber-400"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      configToggles[item.key]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (section) {
      case "dashboard":
        return renderDashboard();

      case "inventory":
        return renderInventory();

      case "alerts":
        return renderAlerts();

      case "restocking":
        return renderRestocking();

      case "notifications":
        return renderNotifications();

      case "config":
        return renderConfig();

      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] dark:bg-[#111111]">
      <aside
        className={`
          fixed lg:static
          inset-y-0 left-0
          z-50
          flex flex-col
          h-full
          bg-[#0A0A0A]
          text-white
          w-64
          shrink-0
          transition-transform duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="px-6 py-6 border-b border-white/10">
          <Link
            to="/"
            className="text-xl font-black tracking-tight"
          >
            FITACTIVE
          </Link>

          <p className="text-xs text-gray-500 mt-1">
            Gestión de inventario
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              section === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setSection(item.key);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  text-left
                  transition-colors
                  ${
                    isActive
                      ? "bg-amber-400 text-[#0A0A0A]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <i
                  className={`fa-solid ${item.icon} w-5 text-center`}
                />

                <span className="font-bold text-sm">
                  {item.label}
                </span>

                {item.key === "alerts" && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center font-black">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {user?.name || "Usuario"}
              </p>

              <p className="text-xs text-gray-500 truncate">
                Inventario
              </p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="
            bg-white
            dark:bg-[#0A0A0A]
            border-b
            border-gray-100
            dark:border-white/10
            px-6
            py-4
            flex
            items-center
            gap-4
            shrink-0
          "
        >
          <button
            onClick={() =>
              setSidebarOpen(true)
            }
            className="lg:hidden w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-white"
            aria-label="Abrir menú"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Panel de Inventario
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Control de productos y reabastecimiento
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setSection("notifications")
              }
              className="
                w-10
                h-10
                rounded-xl
                flex
                items-center
                justify-center
                text-gray-500
                dark:text-gray-300
                hover:bg-gray-100
                dark:hover:bg-white/5
                transition
              "
              aria-label="Notificaciones"
            >
              <i className="fa-solid fa-bell" />
            </button>

            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#0A0A0A]" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F5F5] dark:bg-[#111111] custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}