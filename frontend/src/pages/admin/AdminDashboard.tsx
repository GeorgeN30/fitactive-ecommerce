import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend } from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import KPICard from "../../components/admin/KPICard";
import StatusBadge from "../../components/admin/StatusBadge";
import { fetchDashboardStats, fetchSalesData, fetchTopProducts, fetchCategories } from "../../services/admin";
import { mockOrders } from "../../data/mock";
import type { DashboardStats, TopProduct, CategoryData, SalesDataPoint } from "../../data/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Ahora";
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString("es-CL", { month: "short", day: "numeric" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [horizon, setHorizon] = useState("30d");

  useEffect(() => {
    fetchDashboardStats().then(setStats);
    fetchSalesData().then(setSalesData);
    fetchTopProducts().then(setTopProducts);
    fetchCategories().then(setCategories);
  }, []);

  const salesChartData = {
    labels: salesData.map((d) => d.label),
    datasets: [
      {
        label: "Ventas",
        data: salesData.map((d) => d.value),
        borderColor: "#00E676",
        backgroundColor: "rgba(0, 230, 118, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#00E676",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: string | number) => `$${(Number(v) / 1000).toFixed(0)}k`, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  const categoryChartData = {
    labels: categories.map((c) => c.name),
    datasets: [
      {
        data: categories.map((c) => c.percentage),
        backgroundColor: categories.map((c) => c.color),
        borderWidth: 0,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: { legend: { display: false } },
  };

  if (!stats) return <div className="text-slate-500 text-sm">Cargando...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Panel de Control</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Bienvenido de nuevo, <strong className="text-slate-900 font-bold">George</strong>. Aquí están las estadísticas de hoy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2.5 transition-all">
            <i className="fa-solid fa-calendar text-slate-500 text-xs" />
            <span>Últimos 30 días</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Ventas Totales" value={`$${stats.totalSales.toLocaleString()}`} growth={stats.salesGrowth} icon="fa-solid fa-dollar-sign" />
        <KPICard title="Pedidos Totales" value={String(stats.totalOrders)} growth={stats.ordersGrowth} icon="fa-solid fa-cart-shopping" />
        <KPICard title="Clientes" value={stats.activeCustomers.toLocaleString()} growth={stats.customersGrowth} icon="fa-solid fa-users" />
        <KPICard title="Productos" value={stats.productsSold.toLocaleString()} growth={stats.productsGrowth} icon="fa-solid fa-box" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ventas Mensuales</h2>
            <p className="text-xs font-medium text-slate-400">Tendencia histórica de facturación</p>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500">
            {["7d", "30d", "90d", "1y"].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg transition-all ${horizon === h ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-72 relative">
          <Line data={salesChartData} options={salesChartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Top Productos</h2>
            <p className="text-xs font-medium text-slate-400">Volumen de ventas del mes</p>
          </div>
          <div className="space-y-4">
            {topProducts.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800 font-bold">{p.name}</span>
                  <span className="text-slate-900 font-extrabold">
                    {p.unitsSold} <span className="text-slate-400 font-normal">unidades</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full" style={{ width: `${p.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Categorías Populares</h2>
            <p className="text-xs font-medium text-slate-400">Distribución de ventas por deporte</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto pt-4">
            <div className="relative w-44 h-44 flex-shrink-0">
              <Doughnut data={categoryChartData} options={categoryChartOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">100%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deportes</span>
              </div>
            </div>
            <div className="space-y-2.5 text-xs font-semibold w-full sm:w-auto">
              {categories.map((c) => (
                <div key={c.name} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-600">{c.name}</span>
                  <span className="text-slate-900 font-extrabold ml-auto">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Últimas Ventas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">ID Pedido</th>
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-6">Fecha</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {mockOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">#{order.orderNumber}</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{order.clientName}</td>
                  <td className="py-4 px-6 text-slate-400">{formatDate(order.date)}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">${order.total.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={order.status} />
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
