import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, USERS, DEMO_ORDERS, DEMO_NOTIFICATIONS } from "../../data/adminPrototype";
import type { Order, Product } from "../../data/adminPrototypeTypes";

interface IconProps {
  size?: number;
  className?: string;
}

function AdminIcon({ name, size = 18, className = "" }: IconProps & { name: string }) {
  return <i className={`fa-solid ${name} ${className}`} style={{ fontSize: size }} />;
}

const LayoutDashboard = (props: IconProps) => <AdminIcon name="fa-chart-line" {...props} />;
const Package = (props: IconProps) => <AdminIcon name="fa-box" {...props} />;
const ShoppingCart = (props: IconProps) => <AdminIcon name="fa-cart-shopping" {...props} />;
const Users = (props: IconProps) => <AdminIcon name="fa-users" {...props} />;
const BarChart2 = (props: IconProps) => <AdminIcon name="fa-chart-bar" {...props} />;
const Bell = (props: IconProps) => <AdminIcon name="fa-bell" {...props} />;
const Settings = (props: IconProps) => <AdminIcon name="fa-gear" {...props} />;
const TrendingUp = (props: IconProps) => <AdminIcon name="fa-arrow-trend-up" {...props} />;
const LogOut = (props: IconProps) => <AdminIcon name="fa-right-from-bracket" {...props} />;
const Dumbbell = (props: IconProps) => <AdminIcon name="fa-dumbbell" {...props} />;
const Menu = (props: IconProps) => <AdminIcon name="fa-bars" {...props} />;
const X = (props: IconProps) => <AdminIcon name="fa-xmark" {...props} />;
const Edit = (props: IconProps) => <AdminIcon name="fa-pen" {...props} />;
const Trash2 = (props: IconProps) => <AdminIcon name="fa-trash" {...props} />;
const Plus = (props: IconProps) => <AdminIcon name="fa-plus" {...props} />;
const Search = (props: IconProps) => <AdminIcon name="fa-magnifying-glass" {...props} />;
const Eye = (props: IconProps) => <AdminIcon name="fa-eye" {...props} />;

type Section = 'dashboard' | 'products' | 'orders' | 'clients' | 'metrics' | 'notifications' | 'config' | 'returns';

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
  pending: { label: 'Pendiente', cls: 'bg-gray-100 text-gray-600' },
  confirmed: { label: 'Confirmado', cls: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparando', cls: 'bg-amber-100 text-amber-700' },
  shipped: { label: 'Enviado', cls: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-600' },
  return: { label: 'Devolución', cls: 'bg-orange-100 text-orange-700' },
};

const METRICS_SALES = [65, 78, 82, 70, 91, 95, 88, 102, 115, 98, 120, 108];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-t transition-all hover:opacity-80" style={{ height: `${(v / max) * 88}px`, backgroundColor: color }} />
          <span className="text-[8px] text-gray-400">{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("preAuth_token");
    window.location.href = "/";
  };
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [products, setProducts] = useState(PRODUCTS);
  const navigate = (view: "home") => {
    if (view === "home") window.location.href = "/";
  };
  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
  };
  const addNotification = (notification: (typeof DEMO_NOTIFICATIONS)[number]) => {
    setNotifications((current) => [notification, ...current]);
  };
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<typeof USERS[0] | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({ ...EMPTY_PRODUCT_FORM });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [productSvg, setProductSvg] = useState<File | null>(null);

  const unread = notifications.filter(n => !n.read).length;
  const allOrders = [...orders, ...DEMO_ORDERS.filter(o => !orders.find(x => x.id === o.id))];
  const clients = USERS.filter(u => u.role === 'client');

  const totalRevenue = allOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalOrders = allOrders.length;
  const totalClients = clients.length;
  const totalProducts = products.length;

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
      stock: String(Object.values(product.stock).reduce((sum, amount) => sum + amount, 0)),
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

  const handleProductSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sizes = productForm.sizes.length > 0 ? productForm.sizes : ["M"];
    const totalStock = Math.max(0, Number(productForm.stock) || 0);
    const stockPerSize = Math.floor(totalStock / sizes.length);
    const image = productImagePreview || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=700&fit=crop";
    const baseProduct: Omit<Product, "id"> = {
      name: productForm.name.trim() || "Producto sin nombre",
      category: productForm.category,
      sport: productForm.sport,
      price: Number(productForm.price) || 0,
      image,
      images: [image],
      sizes,
      availableColors: [{ name: "Negro", hex: "#1a1a1a" }],
      description: productForm.description.trim(),
      stock: Object.fromEntries(sizes.map((size) => [size, stockPerSize])),
      gender: productForm.gender,
      measurements: { chest: [80, 110], waist: [60, 100], hips: [80, 115] },
      featured: false,
      minStock: 3,
    };

    setProducts((current) => {
      if (editingProductId) {
        return current.map((product) => product.id === editingProductId ? { ...product, ...baseProduct } : product);
      }
      return [...current, { id: `p-${Date.now()}`, ...baseProduct }];
    });
    setProductModalOpen(false);
  };

  const handleProductDelete = (productId: string) => {
    setProducts((current) => current.filter((product) => product.id !== productId));
  };

  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'products', label: 'Productos', icon: <Package size={18} /> },
    { key: 'orders', label: 'Pedidos', icon: <ShoppingCart size={18} /> },
    { key: 'clients', label: 'Clientes', icon: <Users size={18} /> },
    { key: 'metrics', label: 'Métricas', icon: <BarChart2 size={18} /> },
    { key: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
    { key: 'config', label: 'Configuración', icon: <Settings size={18} /> },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white w-64 flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00E87A] rounded-lg flex items-center justify-center">
            <Dumbbell size={15} className="text-[#0A0A0A]" />
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-base tracking-widest uppercase">FITLOOK</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.key} onClick={() => { setSection(item.key); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${section === item.key ? 'bg-[#00E87A] text-[#0A0A0A]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {item.icon}
            {item.label}
            {item.key === 'notifications' && unread > 0 && (
              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <AdminIcon name="fa-store" size={16} /> Vista tienda
        </Link>
        <button onClick={() => { logout(); navigate('home'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <LogOut size={16} /> Salir
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex h-screen min-h-screen overflow-hidden bg-[#F5F5F5]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 capitalize">{navItems.find(n => n.key === section)?.label}</h2>
            <p className="text-xs text-gray-400">Panel de administración · FITLOOK</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSection('notifications')} className="relative">
              <Bell size={20} className="text-gray-500" />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E87A] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-6 bg-[#F5F5F5]">
          {section === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Ventas totales', value: `S/ ${totalRevenue.toLocaleString()}`, change: '+12%', icon: <TrendingUp size={20} />, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Pedidos', value: totalOrders, change: '+8%', icon: <ShoppingCart size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Clientes', value: totalClients, change: '+15%', icon: <Users size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Productos', value: totalProducts, change: '0%', icon: <Package size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{kpi.change}</span>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-gray-900">{kpi.value}</div>
                    <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales chart */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Ventas mensuales 2026</h3>
                    <span className="text-xs text-gray-400">Últimos 12 meses</span>
                  </div>
                  <BarChart data={METRICS_SALES} color="#00E87A" />
                </div>

                {/* Top products */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Productos más vendidos</h3>
                  <div className="space-y-3">
                    {products.filter(p => p.featured).slice(0, 5).map((p, i) => {
                      const sold = [48, 36, 29, 24, 19][i];
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-[#00E87A] rounded-full" style={{ width: `${(sold / 48) * 100}%` }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-700">{sold}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Categories chart + Fitter stats */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Categorías populares</h3>
                  <div className="space-y-3">
                    {[{ name:'Running', pct:38, color:'#00E87A' },{ name:'Training', pct:28, color:'#3b82f6' },{ name:'Gym', pct:18, color:'#f97316' },{ name:'Yoga', pct:10, color:'#7c3aed' },{ name:'Otros', pct:6, color:'#e5e7eb' }].map(c => (
                      <div key={c.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700 font-medium">{c.name}</span>
                          <span className="font-bold">{c.pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Probador virtual</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Prendas probadas', value: '1,248', icon: 'fa-shirt' },
                      { label: 'Compraron después', value: '72%', icon: 'fa-cart-shopping' },
                      { label: 'Talla más usada', value: 'M / L', icon: 'fa-ruler-combined' },
                      { label: 'Mayor compat.', value: 'Leggings Pro', icon: '✓' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                        <i className={`fa-solid ${s.icon} text-lg`} />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{s.label}</p>
                          <p className="text-sm font-bold text-gray-900">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Pedidos recientes</h3>
                  <div className="space-y-2">
                    {allOrders.slice(0, 4).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{order.id}</p>
                          <p className="text-[10px] text-gray-500">{order.customer.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">S/ {order.total}</p>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[order.status]?.cls}`}>
                            {STATUS_CONFIG[order.status]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900">{products.length} productos</h2>
                <button onClick={openAddProductModal} className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all">
                  <Plus size={16} /> Agregar producto
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Buscar producto..." className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-[#00E87A]" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 text-left">
                      {['Producto', 'Categoría', 'Deporte', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map(p => {
                        const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0);
                        return (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                                  <p className="text-xs text-gray-400">{p.gender === 'female' ? 'Mujer' : 'Hombre'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{p.sport}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">S/ {p.price}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold ${totalStock === 0 ? 'text-red-600' : totalStock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>{totalStock}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${totalStock === 0 ? 'bg-red-100 text-red-600' : totalStock <= p.minStock ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                {totalStock === 0 ? 'Agotado' : totalStock <= p.minStock ? 'Stock bajo' : 'En stock'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Eye size={14} className="text-gray-500" /></button>
                                <button aria-label={`Editar ${p.name}`} onClick={() => openEditProductModal(p)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} className="text-blue-500" /></button>
                                <button aria-label={`Eliminar ${p.name}`} onClick={() => handleProductDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900">{allOrders.length} pedidos</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      {['ID Pedido', 'Cliente', 'Fecha', 'Total', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono font-bold text-gray-800">{order.id}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                            <p className="text-xs text-gray-400">{order.customer.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.date}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">S/ {order.total}</td>
                          <td className="px-4 py-3">
                            <select value={order.status} onChange={e => { updateOrderStatus(order.id, e.target.value as Order['status']); addNotification({ id: `n-${Date.now()}`, type: 'order', title: 'Estado actualizado', message: `Pedido ${order.id}: ${STATUS_CONFIG[e.target.value]?.label}`, date: new Date().toLocaleString(), read: false }); }}
                              className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_CONFIG[order.status]?.cls}`}>
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={14} className="text-gray-500" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'clients' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900">{USERS.length} usuarios</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      {['Usuario', 'Correo', 'Teléfono', 'Registro', 'Rol', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {USERS.map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover" />
                              <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{u.registeredAt}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : u.role === 'inventory' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'inventory' ? 'Inventario' : 'Cliente'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {u.blocked ? 'Bloqueado' : 'Activo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedClient(u)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={14} className="text-gray-500" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Ingresos totales', value: `S/ ${totalRevenue.toLocaleString()}`, icon: 'fa-sack-dollar' },
                  { label: 'Conversión probador', value: '72%', icon: 'fa-flask' },
                  { label: 'Ticket promedio', value: `S/ ${Math.round(totalRevenue / totalOrders)}`, icon: 'fa-cart-shopping' },
                  { label: 'Satisfacción', value: '4.8★', icon: 'fa-star' },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl mb-2">{m.icon}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-gray-900">{m.value}</div>
                    <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Ventas mensuales 2026</h3>
                <BarChart data={METRICS_SALES} color="#00E87A" />
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Métricas del probador virtual</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Prendas más probadas', value: 'Leggings Pro Run' },
                      { label: 'Talla más seleccionada', value: 'M (38%)' },
                      { label: 'Compras post-prueba', value: '72%' },
                      { label: 'Rechazos por incompatib.', value: '28%' },
                      { label: 'Mayor compatibilidad', value: 'Leggings Pro Run' },
                      { label: 'Menor compatibilidad', value: 'Casaca Sport M' },
                    ].map(m => (
                      <div key={m.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600">{m.label}</span>
                        <span className="text-sm font-bold text-gray-900">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Tallas más vendidas</h3>
                  <BarChart data={[42, 68, 85, 72, 38, 15]} color="#3b82f6" />
                  <div className="flex justify-around mt-1 text-xs text-gray-400">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <span key={s}>{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="space-y-3 max-w-2xl">
              {notifications.map(n => (
                <div key={n.id} className={`bg-white rounded-2xl p-4 border ${!n.read ? 'border-l-4 border-l-[#00E87A] border-gray-100' : 'border-gray-100 opacity-70'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                      <i className={`fa-solid ${n.type === "payment" ? "fa-credit-card" : n.type === "delivery" ? "fa-truck" : n.type === "order" ? "fa-box" : n.type === "stock" ? "fa-triangle-exclamation" : "fa-star"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.date}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-[#00E87A] rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'config' && (
            <div className="max-w-2xl space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Gestión de roles</h3>
                <div className="space-y-3">
                  {USERS.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : u.role === 'inventory' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'inventory' ? 'Inventario' : 'Cliente'}
                        </span>
                        <button className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${u.blocked ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {u.blocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProductModalOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="relative bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 id="product-modal-title" className="text-xl font-bold text-gray-900">
                  {editingProductId ? "Editar producto" : "Agregar producto"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Completa la información del catálogo y del probador virtual.</p>
              </div>
              <button type="button" aria-label="Cerrar modal" onClick={() => setProductModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">Nombre del producto</span>
                  <input required value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E87A]" placeholder="Ej. Leggings Pro Run" />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">Categoría</span>
                  <select value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#00E87A]">
                    {['Clothing', 'Footwear', 'Accessories', 'Leggings', 'Top', 'Casaca', 'Short', 'Conjunto'].map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">Deporte</span>
                  <select value={productForm.sport} onChange={(event) => setProductForm((current) => ({ ...current, sport: event.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#00E87A]">
                    {['Running', 'Training', 'Gym', 'Cycling', 'CrossFit', 'Yoga', 'Basketball', 'Football'].map((sport) => <option key={sport} value={sport}>{sport}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">Precio (S/)</span>
                  <input required min="0" step="0.01" type="number" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E87A]" placeholder="129.00" />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">Stock total</span>
                  <input required min="0" type="number" value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E87A]" placeholder="24" />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-gray-600 mb-1.5">Público</span>
                  <select value={productForm.gender} onChange={(event) => setProductForm((current) => ({ ...current, gender: event.target.value as Product["gender"] }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#00E87A]">
                    <option value="female">Mujer</option>
                    <option value="male">Hombre</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </label>
              </div>

              <div>
                <span className="block text-xs font-bold text-gray-600 mb-2">Tallas disponibles</span>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button key={size} type="button" onClick={() => toggleProductSize(size)} className={`min-w-10 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${productForm.sizes.includes(size) ? "bg-[#00E87A] border-[#00E87A] text-[#0A0A0A]" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="block text-xs font-bold text-gray-600 mb-1.5">Descripción</span>
                <textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#00E87A]" placeholder="Describe el material, ajuste y uso recomendado." />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block border border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#00E87A] transition-colors cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-700"><i className="fa-solid fa-image text-[#00C566]" /> Fotografías del producto</span>
                  <span className="block text-[11px] text-gray-400 mt-1">JPG, PNG o WEBP · imagen principal</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProductImageChange} className="mt-3 w-full text-xs text-gray-500" />
                  {productImage && <span className="block text-[11px] text-green-600 mt-2 truncate">{productImage.name}</span>}
                  {productImagePreview && <img src={productImagePreview} alt="Vista previa del producto" className="mt-3 w-20 h-20 rounded-xl object-cover" />}
                </label>
                <label className="block border border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#00E87A] transition-colors cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-700"><i className="fa-solid fa-file-code text-[#00C566]" /> Archivo SVG para probador virtual</span>
                  <span className="block text-[11px] text-gray-400 mt-1">Archivo de la prenda para superposición AR</span>
                  <input type="file" accept="image/svg+xml,.svg" onChange={(event) => setProductSvg(event.target.files?.[0] || null)} className="mt-3 w-full text-xs text-gray-500" />
                  {productSvg && <span className="block text-[11px] text-green-600 mt-2 truncate">{productSvg.name}</span>}
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <input type="checkbox" checked={productForm.isPublished} onChange={(event) => setProductForm((current) => ({ ...current, isPublished: event.target.checked }))} className="accent-[#00E87A]" />
                Mostrar producto en la tienda
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setProductModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-bold hover:bg-gray-800">{editingProductId ? "Guardar cambios" : "Agregar producto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)}><X size={20} className="text-gray-400" /></button>
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
                <p className="font-medium">{selectedOrder.address}, {selectedOrder.district}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_CONFIG[selectedOrder.status]?.cls}`}>{STATUS_CONFIG[selectedOrder.status]?.label}</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Productos del pedido</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => {
                    const product = PRODUCTS.find((candidate) => candidate.id === item.productId);
                    return (
                      <div key={`${item.productId}-${index}`} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2">
                        {product ? <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product?.name || item.productId}</p>
                          <p className="text-xs text-gray-500">Talla {item.size} · Cantidad {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">S/ {(product?.price || 0) * item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client detail modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedClient(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Perfil del cliente</h2>
              <button onClick={() => setSelectedClient(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <img src={selectedClient.avatar} alt={selectedClient.name} className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h3 className="font-bold text-gray-900">{selectedClient.name}</h3>
                <p className="text-sm text-gray-500">{selectedClient.email}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedClient.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {selectedClient.role}
                </span>
              </div>
            </div>
            {selectedClient.measurements && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Medidas registradas</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Altura', `${selectedClient.measurements.height} cm`],
                    ['Pecho', `${selectedClient.measurements.chest} cm`],
                    ['Cintura', `${selectedClient.measurements.waist} cm`],
                    ['Cadera', `${selectedClient.measurements.hips} cm`],
                    ['Piernas', `${selectedClient.measurements.inseam} cm`],
                    ['Complexión', selectedClient.measurements.build],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">{k}</p>
                      <p className="font-bold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Actualizado: {selectedClient.measurements.updatedAt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
