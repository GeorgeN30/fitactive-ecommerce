import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import DashboardView, {
  type DashboardMetric,
  type DashboardSales,
  type DashboardRecentOrder,
} from "../../components/admin/views/DashboardView";
import AdminOrdersView from "../../components/admin/views/AdminOrdersView";
import AdminCustomersView from "../../components/admin/views/AdminCustomersView";
import AdminNotificationsView from "../../components/admin/views/AdminNotificationsView";
import AdminSettingsView from "../../components/admin/views/AdminSettingsView";
import VirtualTryOnMetrics from "../../components/admin/views/VirtualTryOnMetrics";
import AdminDiscountRequestsView from "../../components/admin/views/AdminDiscountRequestsView";
import AdminRolesAccessView from "../../components/admin/views/AdminRolesAccessView";
import AdminReturnsView from "../../components/admin/views/AdminReturnsView";
import AdminFinanceView from "../../components/admin/views/AdminFinanceView";
import ModalPortal from "../../components/ModalPortal";
import NotificationToast from "../../components/NotificationToast";
import { clearStoredSession } from "../../utils/session";

import {
  fetchOrders,
  fetchProducts,
  fetchCustomers,
  fetchDashboardStats,
  fetchSalesData,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus as updateOrderStatusApi,
  updateCustomerStatus as updateCustomerStatusApi,
  updateCustomerRole as updateCustomerRoleApi,
  fetchUsers,
} from "../../services/admin";
import type { ProductInput } from "../../services/admin";
import {
  connectAdminSocket,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  mapLiveEventToAdminNotification,
} from "../../services/notifications";
import type { AdminNotification } from "../../services/notifications";
import type { DashboardStats, SalesDataPoint } from "../../data/types";
import type { Order, Product, User } from "../../data/adminPrototypeTypes";

interface IconProps {
  size?: number;
  className?: string;
}

function AdminIcon({
  name,
  size = 18,
  className = "",
}: IconProps & { name: string }) {
  return (
    <i className={`fa-solid ${name} ${className}`} style={{ fontSize: size }} />
  );
}

const LayoutDashboard = (props: IconProps) => (
  <AdminIcon name="fa-chart-line" {...props} />
);
const Package = (props: IconProps) => <AdminIcon name="fa-box" {...props} />;
const ShoppingCart = (props: IconProps) => (
  <AdminIcon name="fa-cart-shopping" {...props} />
);
const Users = (props: IconProps) => <AdminIcon name="fa-users" {...props} />;
const BarChart2 = (props: IconProps) => (
  <AdminIcon name="fa-chart-bar" {...props} />
);
const Bell = (props: IconProps) => <AdminIcon name="fa-bell" {...props} />;
const Settings = (props: IconProps) => <AdminIcon name="fa-gear" {...props} />;
const Wallet = (props: IconProps) => <AdminIcon name="fa-wallet" {...props} />;
const TrendingUp = (props: IconProps) => (
  <AdminIcon name="fa-arrow-trend-up" {...props} />
);
const LogOut = (props: IconProps) => (
  <AdminIcon name="fa-right-from-bracket" {...props} />
);
const Dumbbell = (props: IconProps) => (
  <AdminIcon name="fa-dumbbell" {...props} />
);
const Menu = (props: IconProps) => <AdminIcon name="fa-bars" {...props} />;
const X = (props: IconProps) => <AdminIcon name="fa-xmark" {...props} />;
const Edit = (props: IconProps) => <AdminIcon name="fa-pen" {...props} />;
const Trash2 = (props: IconProps) => <AdminIcon name="fa-trash" {...props} />;
const Plus = (props: IconProps) => <AdminIcon name="fa-plus" {...props} />;
const Search = (props: IconProps) => (
  <AdminIcon name="fa-magnifying-glass" {...props} />
);
const Eye = (props: IconProps) => <AdminIcon name="fa-eye" {...props} />;

type Section =
  | "dashboard"
  | "orders"
  | "clients"
  | "roles"
  | "metrics"
  | "finance"
  | "notifications"
  | "config"
  | "discounts"
  | "returns";

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  sport: string;
  price: string;
  sizes: string[];
  stock: string;
  gender: Product["gender"];
  isPublished: boolean;
}

const EMPTY_PRODUCT_FORM: ProductFormData = {
  name: "",
  description: "",
  category: "Clothing",
  sport: "Running",
  price: "",
  sizes: ["M"],
  stock: "",
  gender: "unisex",
  isPublished: true,
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-gray-100 text-gray-600" },
  confirmed: { label: "Confirmado", cls: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparando", cls: "bg-amber-100 text-amber-700" },
  shipped: { label: "Enviado", cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "Entregado", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-600" },
  return: { label: "Devolución", cls: "bg-orange-100 text-orange-700" },
};

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Oct",
  "Nov",
  "Dic",
];

function timeAgo(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "hace poco";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t transition-all hover:opacity-80"
            style={{ height: `${(v / max) * 88}px`, backgroundColor: color }}
          />
          <span className="text-[8px] text-gray-400">{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const logout = () => {
    clearStoredSession();
    window.location.href = "/";
  };
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    kind: "info" | "critical" | "success";
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<SalesDataPoint[]>([]);

  const navigate = (view: "home") => {
    if (view === "home") window.location.href = "/";
  };

  const isAuthError = (error: unknown): boolean =>
    (error as { response?: { status?: number } })?.response?.status === 401;

  const handleUnauthorized = () => {
    window.location.href = "/login";
  };

  const refreshOrders = async () => {
    try {
      setOrders(await fetchOrders());
    } catch (error) {
      if (isAuthError(error)) handleUnauthorized();
    }
  };

  const handleCustomerStatus = async (client: User): Promise<User> => {
    try {
      const updated = await updateCustomerStatusApi(client.id, !client.blocked);
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === updated.id ? updated : customer,
        ),
      );
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
      return updated;
    } catch (error) {
      if (isAuthError(error)) {
        handleUnauthorized();
      }
      throw error;
    }
  };

  const handleRoleChange = async (
    user: User,
    role: User["role"],
  ): Promise<User> => {
    const backendRole = role === "client" ? "customer" : role;
    try {
      const updated = await updateCustomerRoleApi(user.id, backendRole);
      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === updated.id ? updated : currentUser,
        ),
      );
      setCustomers((current) => {
        if (updated.role !== "client") {
          return current.filter((customer) => customer.id !== updated.id);
        }
        const exists = current.some((customer) => customer.id === updated.id);
        return exists
          ? current.map((customer) =>
              customer.id === updated.id ? updated : customer,
            )
          : [updated, ...current];
      });
      return updated;
    } catch (error) {
      if (isAuthError(error)) {
        handleUnauthorized();
      }
      throw error;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      try {
        const [
          loadedOrders,
          loadedProducts,
          loadedCustomers,
          loadedUsers,
          loadedStats,
          loadedSales,
        ] =
          await Promise.all([
            fetchOrders(),
            fetchProducts(),
            fetchCustomers(),
            fetchUsers(),
            fetchDashboardStats(),
            fetchSalesData(),
          ]);
        if (!cancelled) {
          setOrders(loadedOrders);
          setProducts(loadedProducts);
          setCustomers(loadedCustomers);
          setUsers(loadedUsers);
          setStats(loadedStats);
          setSales(loadedSales);
        }
      } catch (error) {
        if (isAuthError(error)) handleUnauthorized();
      }
    };
    void loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchNotifications()
      .then((loadedNotifications) => {
        if (!cancelled) {
          setNotifications((current) => {
            const loadedIds = new Set(loadedNotifications.map((item) => item.id));
            return [
              ...loadedNotifications,
              ...current.filter((item) => !loadedIds.has(item.id)),
            ];
          });
        }
      })
      .catch((error: unknown) => {
        if (isAuthError(error)) handleUnauthorized();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const disconnect = connectAdminSocket((event) => {
      const notification = mapLiveEventToAdminNotification(event);
      setNotifications((prev) => [notification, ...prev]);
      setToast({
        title: notification.title,
        message: notification.message,
        kind: notification.priority === "high" ? "critical" : "info",
      });
      if (event.type === "NEW_ORDER" || event.type === "ORDER_STATUS") {
        void refreshOrders();
      }
    });
    return disconnect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleMarkNotificationRead = async (notification: AdminNotification) => {
    try {
      await markNotificationRead(notification.id);
    } catch (error) {
      if (isAuthError(error)) handleUnauthorized();
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      if (isAuthError(error)) handleUnauthorized();
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
  ) => {
    try {
      await updateOrderStatusApi(orderId, status);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch (error) {
      if (isAuthError(error)) {
        handleUnauthorized();
        return;
      }
      window.alert("No se pudo actualizar el estado del pedido.");
    }
  };

  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    ...EMPTY_PRODUCT_FORM,
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null,
  );
  const [productSvg, setProductSvg] = useState<File | null>(null);

  const unread = notifications.filter((n) => !n.read).length;
  const allOrders = orders;
  const clients = customers;

  const dashboardMetrics: DashboardMetric[] | undefined = stats
    ? [
        {
          label: "Ingresos Totales",
          value: `S/ ${stats.totalSales.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`,
        },
        { label: "Pedidos", value: stats.totalOrders.toLocaleString("es-PE") },
        {
          label: "Ticket Promedio",
          value:
            stats.totalOrders > 0
              ? `S/ ${(stats.totalSales / stats.totalOrders).toFixed(2)}`
              : "S/ 0.00",
        },
        {
          label: "Productos en catálogo",
          value: String(stats.productsSold),
        },
      ]
    : undefined;

  const dashboardSales: DashboardSales | undefined =
    sales.length > 0
      ? {
          labels: sales.map((point) => point.label),
          values: sales.map((point) => point.value),
        }
      : undefined;

  const dashboardRecentOrders: DashboardRecentOrder[] | undefined =
    orders.length > 0
      ? orders.slice(0, 5).map((order) => ({
          id: order.orderNumber || order.id,
          client: order.customer.name,
          total: `S/ ${order.total.toFixed(2)}`,
          status: order.status,
          time: timeAgo(order.date),
        }))
      : undefined;

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductForm({ ...EMPTY_PRODUCT_FORM });
    setProductImage(null);
    setProductImagePreview(null);
    setProductSvg(null);
    setProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      sport: product.sport,
      price: String(product.price),
      sizes: [...product.sizes],
      stock: String(
        Object.values(product.stock).reduce((sum, amount) => sum + amount, 0),
      ),
      gender: product.gender,
      isPublished: true,
    });
    setProductImage(null);
    setProductImagePreview(product.image);
    setProductSvg(null);
    setProductModalOpen(true);
  };

  const handleProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProductImage(file);
    setProductImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const toggleProductSize = (size: string) => {
    setProductForm((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((currentSize) => currentSize !== size)
        : [...current.sizes, size],
    }));
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sizes = productForm.sizes.length > 0 ? productForm.sizes : ["M"];
    const totalStock = Math.max(0, Number(productForm.stock) || 0);
    const stockPerSize = Math.floor(totalStock / sizes.length);
    const image =
      productImagePreview ||
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=700&fit=crop";
    const input: ProductInput = {
      nombre: productForm.name.trim() || "Producto sin nombre",
      categoria: productForm.category,
      genero: productForm.gender,
      precio: Number(productForm.price) || 0,
      descripcion: productForm.description.trim(),
      imagenUrl: image,
      tallas: sizes.map((size) => ({ talla: size, stock: stockPerSize })),
    };

    try {
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, input);
        setProducts((current) =>
          current.map((product) =>
            product.id === editingProductId ? updated : product,
          ),
        );
      } else {
        const created = await createProduct(input);
        setProducts((current) => [...current, created]);
      }
      setProductModalOpen(false);
    } catch (error) {
      if (isAuthError(error)) {
        handleUnauthorized();
        return;
      }
      window.alert("No se pudo guardar el producto.");
    }
  };

  const handleProductDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts((current) =>
        current.filter((product) => product.id !== productId),
      );
    } catch (error) {
      if (isAuthError(error)) {
        handleUnauthorized();
        return;
      }
      window.alert("No se pudo eliminar el producto.");
    }
  };

  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    { key: "orders", label: "Pedidos", icon: <ShoppingCart size={18} /> },
    { key: "clients", label: "Clientes", icon: <Users size={18} /> },
    {
      key: "roles",
      label: "Roles y accesos",
      icon: <AdminIcon name="fa-user-shield" size={18} />,
    },
    { key: "metrics", label: "Métricas", icon: <BarChart2 size={18} /> },
    { key: "finance", label: "Finanzas", icon: <Wallet size={18} /> },
    {
      key: "discounts",
      label: "Descuentos",
      icon: <AdminIcon name="fa-tag" size={18} />,
    },
    {
      key: "returns",
      label: "Devoluciones",
      icon: <AdminIcon name="fa-rotate-left" size={18} />,
    },
    { key: "notifications", label: "Notificaciones", icon: <Bell size={18} /> },
    { key: "config", label: "Configuración", icon: <Settings size={18} /> },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white w-64 flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00E87A] rounded-lg flex items-center justify-center">
            <Dumbbell size={15} className="text-[#0A0A0A]" />
          </div>
          <div>
            <div
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-black text-base tracking-widest uppercase"
            >
              FITLOOK
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              Admin Panel
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setSection(item.key);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${section === item.key ? "bg-[#00E87A] text-[#0A0A0A]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            {item.icon}
            {item.label}
            {item.key === "notifications" && unread > 0 && (
              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <AdminIcon name="fa-store" size={16} /> Vista tienda
        </Link>
        <div className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <AdminIcon name="fa-moon" size={16} />
            ) : (
              <AdminIcon name="fa-sun" size={16} />
            )}
            <span>Modo {theme === "dark" ? "Claro" : "Oscuro"}</span>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-10 h-5 rounded-full relative transition-colors ${theme === "dark" ? "bg-[#00E87A]" : "bg-gray-600"}`}
          >
            <div
              className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
        <div className="w-full flex items-center justify-between px-4 py-2 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
              <img
                src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
                alt="Admin"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">Administrador</div>
              <div className="text-[10px] text-gray-400">Admin Panel</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("home");
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex h-screen min-h-screen overflow-hidden bg-[#F5F5F5] dark:bg-zinc-950 dark:text-white">
      <NotificationToast
        notification={toast}
        onClose={() => setToast(null)}
        onOpen={() => {
          setToast(null);
          setSection("notifications");
        }}
      />
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 dark:text-gray-300"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 dark:text-white capitalize">
              {navItems.find((n) => n.key === section)?.label}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-400">
              Panel de administración · FITLOOK
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSection("notifications")}
              className="relative"
            >
              <Bell size={20} className="text-gray-500 dark:text-gray-300" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E87A] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-6 bg-[#F5F5F5] dark:bg-zinc-950">
          {section === "dashboard" && (
            <DashboardView
              goToOrders={() => setSection("orders")}
              metrics={dashboardMetrics}
              salesData={dashboardSales}
              recentOrders={dashboardRecentOrders}
              summary={
                stats
                  ? {
                      activeCustomers: stats.activeCustomers,
                      productsSold: stats.productsSold,
                      totalReturns: stats.totalReturns,
                    }
                  : undefined
              }
            />
          )}

          {section === "orders" && (
            <AdminOrdersView
              orders={allOrders}
              updateOrderStatus={updateOrderStatus}
            />
          )}

          {section === "clients" && (
            <AdminCustomersView
              clients={clients}
              onToggleBlock={handleCustomerStatus}
            />
          )}

          {section === "roles" && (
            <AdminRolesAccessView
              users={users}
              onRoleChange={handleRoleChange}
            />
          )}

          {section === "metrics" && <VirtualTryOnMetrics />}

          {section === "finance" && <AdminFinanceView />}

          {section === "notifications" && (
            <AdminNotificationsView
              notifications={notifications}
              setNotifications={setNotifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onNotificationAction={(notification) => {
                if (notification.type === "discount") setSection("discounts");
                else if (notification.type === "order") setSection("orders");
                else if (notification.type === "return") setSection("returns");
              }}
            />
          )}
          {section === "discounts" && <AdminDiscountRequestsView />}

          {section === "returns" && <AdminReturnsView />}

          {section === "config" && <AdminSettingsView />}
        </main>
      </div>

      {productModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:py-6">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setProductModalOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-modal-title"
              className="relative z-10 bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col"
            >
            <div className="flex items-center justify-between p-6 mb-0 flex-shrink-0">
              <div>
                <h2
                  id="product-modal-title"
                  className="text-xl font-bold text-gray-900"
                >
                  {editingProductId ? "Editar producto" : "Agregar producto"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Completa la información del catálogo y del probador virtual.
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal"
                onClick={() => setProductModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 space-y-5 custom-scrollbar">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Nombre del producto
                  </span>
                  <input
                    required
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E87A]"
                    placeholder="Ej. Leggings Pro Run"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Categoría
                  </span>
                  <select
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#00E87A]"
                  >
                    {[
                      "Clothing",
                      "Footwear",
                      "Accessories",
                      "Leggings",
                      "Top",
                      "Casaca",
                      "Short",
                      "Conjunto",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Deporte
                  </span>
                  <select
                    value={productForm.sport}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        sport: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#00E87A]"
                  >
                    {[
                      "Running",
                      "Training",
                      "Gym",
                      "Cycling",
                      "CrossFit",
                      "Yoga",
                      "Basketball",
                      "Football",
                    ].map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Precio (S/)
                  </span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E87A]"
                    placeholder="129.00"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Stock total
                  </span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={productForm.stock}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        stock: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E87A]"
                    placeholder="24"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">
                    Público
                  </span>
                  <select
                    value={productForm.gender}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        gender: event.target.value as Product["gender"],
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#00E87A]"
                  >
                    <option value="female">Mujer</option>
                    <option value="male">Hombre</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </label>
              </div>

              <div>
                <span className="block text-xs font-bold text-gray-600 mb-2">
                  Tallas disponibles
                </span>
                <div className="flex flex-wrap gap-2">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleProductSize(size)}
                      className={`min-w-10 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${productForm.sizes.includes(size) ? "bg-[#00E87A] border-[#00E87A] text-[#0A0A0A]" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="block text-xs font-bold text-gray-600 mb-1.5">
                  Descripción
                </span>
                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#00E87A]"
                  placeholder="Describe el material, ajuste y uso recomendado."
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block border border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#00E87A] transition-colors cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <i className="fa-solid fa-image text-[#00C566]" />{" "}
                    Fotografías del producto
                  </span>
                  <span className="block text-[11px] text-gray-400 mt-1">
                    JPG, PNG o WEBP · imagen principal
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProductImageChange}
                    className="mt-3 w-full text-xs text-gray-500"
                  />
                  {productImage && (
                    <span className="block text-[11px] text-green-600 mt-2 truncate">
                      {productImage.name}
                    </span>
                  )}
                  {productImagePreview && (
                    <img
                      src={productImagePreview}
                      alt="Vista previa del producto"
                      className="mt-3 w-20 h-20 rounded-xl object-cover"
                    />
                  )}
                </label>
                <label className="block border border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#00E87A] transition-colors cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <i className="fa-solid fa-file-code text-[#00C566]" />{" "}
                    Archivo SVG para probador virtual
                  </span>
                  <span className="block text-[11px] text-gray-400 mt-1">
                    Archivo de la prenda para superposición AR
                  </span>
                  <input
                    type="file"
                    accept="image/svg+xml,.svg"
                    onChange={(event) =>
                      setProductSvg(event.target.files?.[0] || null)
                    }
                    className="mt-3 w-full text-xs text-gray-500"
                  />
                  {productSvg && (
                    <span className="block text-[11px] text-green-600 mt-2 truncate">
                      {productSvg.name}
                    </span>
                  )}
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={productForm.isPublished}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      isPublished: event.target.checked,
                    }))
                  }
                  className="accent-[#00E87A]"
                />
                Mostrar producto en la tienda
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-bold hover:bg-gray-800"
                >
                  {editingProductId ? "Guardar cambios" : "Agregar producto"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Cliente</p>
                  <p className="font-semibold">{selectedOrder.customer.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="font-bold">S/ {selectedOrder.total}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Dirección</p>
                <p className="font-medium">
                  {selectedOrder.address}, {selectedOrder.district}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estado:</span>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_CONFIG[selectedOrder.status]?.cls}`}
                >
                  {STATUS_CONFIG[selectedOrder.status]?.label}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Productos del pedido
                </p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => {
                    const product = products.find(
                      (candidate) => candidate.id === item.productId,
                    );
                    return (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-2"
                      >
                        {product ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {product?.name || item.name || item.productId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Talla {item.size} · Cantidad {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          S/ {(product?.price || 0) * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedClient(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Perfil del cliente</h2>
              <button onClick={() => setSelectedClient(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <img
                src={selectedClient.avatar}
                alt={selectedClient.name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedClient.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedClient.email}</p>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedClient.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {selectedClient.role}
                </span>
              </div>
            </div>
            {selectedClient.measurements && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Medidas registradas
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Altura", `${selectedClient.measurements.height} cm`],
                    ["Pecho", `${selectedClient.measurements.chest} cm`],
                    ["Cintura", `${selectedClient.measurements.waist} cm`],
                    ["Cadera", `${selectedClient.measurements.hips} cm`],
                    ["Piernas", `${selectedClient.measurements.inseam} cm`],
                    ["Complexión", selectedClient.measurements.build],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">{k}</p>
                      <p className="font-bold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Actualizado: {selectedClient.measurements.updatedAt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
