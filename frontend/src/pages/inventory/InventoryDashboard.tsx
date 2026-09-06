import InventoryHomeView from "../../components/inventory/views/InventoryHomeView";
import InventoryStockView from "../../components/inventory/views/InventoryStockView";
import InventoryRestockView from "../../components/inventory/views/InventoryRestockView";
import InventoryAuditView from "../../components/inventory/views/InventoryAuditView";
import InventoryAlertsView from "../../components/inventory/views/InventoryAlertsView";
import InventoryCatalogView from "../../components/inventory/views/InventoryCatalogView";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { PRODUCTS as INITIAL_PRODUCTS } from "../../data/adminPrototype";
import InventoryDiscountsView from "../../components/inventory/views/InventoryDiscountsView";
import InventoryNotificationsView from "../../components/inventory/views/InventoryNotificationsView";

type Section =
  | "díashboard"
  | "catalog"
  | "stock"
  | "alerts"
  | "restock"
  | "audit"
  | "discounts"
  | "notifications";

export default function InventoryDashboard() {
  const [section, setSection] = useState<Section>("díashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Reabastecimiento completado",
      message:
        "La orden ORD-2023-089 (Shorts Running Aerox) ha ingresado al inventario.",
      type: "success",
      time: "Hace 5 min",
      read: false,
    },
    {
      id: 2,
      title: "Stock Crítico Detectado",
      message: "La Chaqueta Wind-Breaker ha llegado a 0 unidades.",
      type: "critical",
      time: "Hace 2 horas",
      read: false,
    },
  ]);

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!theme) setTheme("light");
  }, [theme, setTheme]);

  const navItems: {
    key: Section;
    label: string;
    icon: React.ReactNode;
    alert?: number;
  }[] = [
    {
      key: "díashboard",
      label: "Dashboard Almacén",
      icon: <i className="fa-solid fa-table-columns text-[18px]"></i>,
    },
    {
      key: "catalog",
      label: "Catálogo (CRUD)",
      icon: <i className="fa-solid fa-boxes-stacked text-[18px]"></i>,
    },
    {
      key: "stock",
      label: "Control de Stock",
      icon: <i className="fa-solid fa-box text-[18px]"></i>,
    },
    {
      key: "alerts",
      label: "Alertas de Stock",
      icon: <i className="fa-solid fa-triangle-exclamation text-[18px]"></i>,
      alert: 3,
    },
    {
      key: "restock",
      label: "Reabastecimiento",
      icon: <i className="fa-solid fa-rotate text-[18px]"></i>,
    },
    {
      key: "audit",
      label: "Entradías / Salidías",
      icon: <i className="fa-solid fa-arrow-right-arrow-left text-[18px]"></i>,
    },
    {
      key: "discounts",
      label: "Descuentos",
      icon: <i className="fa-solid fa-tag text-[18px]"></i>,
    },
    {
      key: "notifications",
      label: "Notificaciones",
      icon: <i className="fa-solid fa-bell text-[18px]"></i>,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("preAuth_token");
    window.location.href = "/";
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#111111] text-white w-64 flex-shrink-0 font-sans">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center font-black text-black">
          FL
        </div>
        <div>
          <h2 className="font-bold text-sm leading-tight tracking-wide">
            FITLOOK
          </h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Inventario
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3 flex items-start gap-3 mb-2">
          <i className="fa-solid fa-triangle-exclamation text-[16px] mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium">4 productos requieren atención</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = section === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setSection(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-[#F59E0B]/10 text-[#F59E0B] font-semibold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`${active ? "text-[#F59E0B]" : "text-gray-500"}`}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </div>
              {item.alert && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.alert}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold text-gray-400">
            Modo Oscuro
          </span>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === "dark" ? "bg-[#F59E0B]" : "bg-gray-600"}`}
          >
            <div
              className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${theme === "dark" ? "left-6" : "left-1"}`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 overflow-hidden">
              <img
                src="https://ui-avatars.com/api/?name=Gestor&background=F59E0B&color=fff"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white leading-tight">
                Marco Salazar
              </p>
              <p className="text-[10px] text-gray-400">Gestor Inventario</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-[16px]"></i>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA] dark:bg-zinc-950 font-sans">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl transform transition-transform">
            <Sidebar />
          </div>
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="fa-solid fa-xmark text-[24px]"></i>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 dark:text-gray-400 p-1"
            >
              <i className="fa-solid fa-bars text-[24px]"></i>
            </button>
            <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center font-black text-black">
              FL
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-xs font-bold text-[#F59E0B]"
          >
            Ver tienda ↗
          </button>
        </header>

        <div className="hidden lg:flex justify-end p-4 flex-shrink-0">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            Ver tienda{" "}
            <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
          </button>
        </div>

        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto px-6 pb-10 custom-scrollbar">
          {section === "díashboard" && (
            <InventoryHomeView setSection={setSection} products={products} />
          )}
          {section === "catalog" && (
            <InventoryCatalogView
              products={products}
              setProducts={setProducts}
            />
          )}
          {section === "stock" && (
            <InventoryStockView products={products} setProducts={setProducts} />
          )}
          {section === "alerts" && <InventoryAlertsView products={products} />}
          {section === "restock" && (
            <InventoryRestockView
              products={products}
              setProducts={setProducts}
            />
          )}
          {section === "audit" && <InventoryAuditView products={products} />}
          {section === "discounts" && (
            <InventoryDiscountsView products={products} />
          )}
          {section === "notifications" && (
            <InventoryNotificationsView
              notifications={notifications}
              setNotifications={setNotifications}
            />
          )}
        </main>
      </div>
    </div>
  );
}
