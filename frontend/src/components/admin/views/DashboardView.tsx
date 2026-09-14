import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export interface DashboardMetric {
  label: string;
  value: string;
  inc?: string;
}

export interface DashboardSales {
  labels: string[];
  values: number[];
}

export interface DashboardRecentOrder {
  id: string;
  client: string;
  total: string;
  status: string;
  time: string;
}

export interface DashboardSummary {
  activeCustomers: number;
  productsSold: number;
  totalReturns: number;
}

interface DashboardViewProps {
  goToOrders?: () => void;
  metrics?: DashboardMetric[];
  salesData?: DashboardSales;
  recentOrders?: DashboardRecentOrder[];
  summary?: DashboardSummary;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  return: "Devolución",
};

function statusClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-600";
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "preparing":
      return "bg-amber-100 text-amber-700";
    case "shipped":
      return "bg-purple-100 text-purple-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-600";
    default:
      return "bg-orange-100 text-orange-700";
  }
}

export default function DashboardView({
  goToOrders,
  metrics = [],
  salesData = { labels: [], values: [] },
  recentOrders = [],
  summary = { activeCustomers: 0, productsSold: 0, totalReturns: 0 },
}: DashboardViewProps = {}) {
  const totalSales = salesData.values.reduce((sum, value) => sum + value, 0);
  const chartData = {
    labels: salesData.labels,
    datasets: [
      {
        label: "Ingresos",
        data: salesData.values,
        borderColor: "#00FF66",
        backgroundColor: "rgba(0, 255, 102, 0.1)",
        fill: true,
        borderWidth: 2,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#1E1E1E", titleColor: "#00FF66" },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#E5E7EB", borderDash: [5, 5] }, beginAtZero: true },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vista estratégica del negocio - FITLOOK
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Datos de los últimos 12 meses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {metric.label}
              </span>
              {metric.inc && (
                <span className="text-xs text-green-600 dark:text-[#00FF66]">
                  {metric.inc}
                </span>
              )}
            </div>
            <span className="text-3xl font-black">{metric.value}</span>
          </div>
        ))}
        {metrics.length === 0 && (
          <div className="md:col-span-4 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No hay estadísticas disponibles.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Ingresos</h3>
            <span className="text-gray-400 text-sm">
              S/ {totalSales.toLocaleString("es-PE", { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-64">
            {salesData.values.length > 0 ? (
              <Line options={chartOptions} data={chartData} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No hay ventas registradas.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-bold mb-5">Indicadores operativos</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Clientes activos</span>
              <span className="font-bold">{summary.activeCustomers.toLocaleString("es-PE")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Unidades vendidas</span>
              <span className="font-bold">{summary.productsSold.toLocaleString("es-PE")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Devoluciones</span>
              <span className="font-bold">{summary.totalReturns.toLocaleString("es-PE")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold">Últimos pedidos</h3>
          {goToOrders && (
            <button onClick={goToOrders} className="text-xs text-[#00FF66] font-bold hover:underline">
              Ver todos
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-5 py-3">Pedido</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-5 py-4 font-medium">{order.id}</td>
                  <td className="px-5 py-4">{order.client}</td>
                  <td className="px-5 py-4 font-bold text-[#00FF66]">{order.total}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(order.status)}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">No hay pedidos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
