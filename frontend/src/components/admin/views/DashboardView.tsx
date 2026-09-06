import { useState } from "react";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
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

interface DashboardViewProps {
  goToOrders?: () => void;
}

export default function DashboardView({ goToOrders }: DashboardViewProps = {}) {
  const [timeFilter, setTimeFilter] = useState<
    "hoy" | "semana" | "mes" | "año" | "custom"
  >("mes");
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1E1E1E",
        titleColor: "#00FF66",
        bodyColor: "#FFFFFF",
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#E5E7EB", borderDash: [5, 5] }, beginAtZero: true },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0, hitRadius: 10, hoverRadius: 6 },
    },
  };

  const getMultipliers = () => {
    switch (timeFilter) {
      case "hoy":
        return {
          mult: 0.1,
          labels: [
            "00:00",
            "04:00",
            "08:00",
            "12:00",
            "16:00",
            "20:00",
            "24:00",
          ],
        };
      case "semana":
        return {
          mult: 0.4,
          labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        };
      case "año":
        return {
          mult: 12,
          labels: ["Ene", "Mar", "May", "Jul", "Sep", "Nov", "Dic"],
        };
      case "custom":
        const num = parseInt(customDate.replace(/-/g, "")) % 10;
        return {
          mult: 0.2 + num * 0.1,
          labels: [
            "00:00",
            "04:00",
            "08:00",
            "12:00",
            "16:00",
            "20:00",
            "24:00",
          ],
        };
      default:
        return { mult: 1, labels: ["01", "05", "10", "15", "20", "25", "30"] };
    }
  };

  const { mult, labels } = getMultipliers();

  const baseIngresos = [20000, 35000, 28000, 50000, 42000, 60000, 55000];
  const baseConversion = [40, 50, 45, 74, 60, 65, 70];

  const ingresosData = {
    labels: labels,
    datasets: [
      {
        label: "Ingresos",
        data: baseIngresos.map((v) => v * mult),
        borderColor: "#00FF66",
        backgroundColor: "rgba(0, 255, 102, 0.1)",
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const conversionData = {
    labels: labels,
    datasets: [
      {
        label: "Conversión %",
        data: baseConversion.map((v) =>
          Math.min(100, v * (timeFilter === "año" ? 1.1 : 1)),
        ),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const metrics = [
    {
      label: "Ingresos Totales",
      value: `S/ ${(90400 * mult).toLocaleString()}`,
      inc: "+15.3%",
    },
    {
      label: "Pedidos",
      value: Math.floor(684 * mult).toLocaleString(),
      inc: "+12.1%",
    },
    { label: "Ticket Promedio", value: "S/ 132.16", inc: "+5.7%" },
    { label: "Tasa Conversión", value: "74%", inc: "+3.2%" },
  ];

  const renderFilterButton = (
    id: "hoy" | "semana" | "mes" | "año",
    label: string,
  ) => {
    const active = timeFilter === id;
    return (
      <button
        onClick={() => setTimeFilter(id)}
        className={`px-4 py-1.5 rounded-md transition ${active ? "bg-[#00FF66] text-black font-semibold shadow" : "hover:bg-white dark:hover:bg-zinc-700"}`}
      >
        {label}
      </button>
    );
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
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 text-sm items-center">
          {renderFilterButton("hoy", "Hoy")}
          {renderFilterButton("semana", "Semana")}
          {renderFilterButton("mes", "Mes")}
          {renderFilterButton("año", "Año")}
          <div className="h-4 w-px bg-gray-300 dark:bg-zinc-600 mx-2"></div>
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setTimeFilter("custom");
            }}
            className={`bg-transparent px-2 py-1.5 rounded-md cursor-pointer outline-none transition ${timeFilter === "custom" ? "text-[#00FF66] font-bold" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-[#00FF66] transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {metric.label}
              </span>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-[#00FF66] text-xs px-2 py-0.5 rounded-full font-bold">
                {metric.inc}
              </span>
            </div>
            <span className="text-3xl font-black">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Ingresos</h3>
            <span className="text-gray-400 text-sm">
              S/ {(90400 * mult).toLocaleString()}
            </span>
          </div>
          <div className="h-64">
            <Line options={lineOptions} data={ingresosData} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Conversión (%)</h3>
          </div>
          <div className="h-40 mb-4">
            <Line options={lineOptions} data={conversionData} />
          </div>
          <div className="mt-auto space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Clientes activos
              </span>
              <span className="font-bold">
                {Math.floor(12047 * mult).toLocaleString()}{" "}
                <span className="text-green-500 text-xs ml-1">+8.4%</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Productos vendidos
              </span>
              <span className="font-bold">
                {Math.floor(3842 * mult).toLocaleString()}{" "}
                <span className="text-green-500 text-xs ml-1">+22.7%</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Devoluciones
              </span>
              <span className="font-bold">
                {Math.floor(47 * mult).toLocaleString()}{" "}
                <span className="text-red-500 text-xs ml-1">-2.1%</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold">Últimos pedidos</h3>
          <button
            onClick={goToOrders}
            className="text-xs text-[#00FF66] font-bold hover:underline"
          >
            Ver todos
          </button>
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
              {[
                {
                  id: "FIT-2024-1782",
                  client: "Pedro Vargas",
                  total: "S/ 169.90",
                  status: "pendiente",
                  time: "hace 12 min",
                },
                {
                  id: "FIT-2024-1781",
                  client: "Sandra Díaz",
                  total: "S/ 349.80",
                  status: "confirmado",
                  time: "hace 35 min",
                },
                {
                  id: "FIT-2024-1780",
                  client: "Luis Torres",
                  total: "S/ 89.90",
                  status: "preparando",
                  time: "hace 1 hora",
                },
              ].map((order, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                >
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">
                    {order.id}
                  </td>
                  <td className="px-5 py-4">{order.client}</td>
                  <td className="px-5 py-4 font-bold text-[#00FF66]">
                    {order.total}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        order.status === "pendiente"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                          : order.status === "confirmado"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {order.time}
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
