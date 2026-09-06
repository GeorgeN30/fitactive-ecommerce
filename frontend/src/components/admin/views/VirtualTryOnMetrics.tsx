import React, { useState } from "react";
import { Doughnut, Bar, Radar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
);

export default function VirtualTryOnMetrics() {
  const [timeFilter, setTimeFilter] = useState<
    "hoy" | "semana" | "mes" | "año" | "custom"
  >("mes");
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const getMult = () => {
    switch (timeFilter) {
      case "hoy":
        return 0.1;
      case "semana":
        return 0.25;
      case "año":
        return 12;
      case "custom":
        return 0.2 + (parseInt(customDate.replace(/-/g, "")) % 10) * 0.1;
      default:
        return 1;
    }
  };
  const m = getMult();

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

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1E1E1E",
        titleColor: "#00FF66",
        bodyColor: "#FFFFFF",
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9CA3AF" } },
      y: { grid: { display: false }, ticks: { color: "#9CA3AF" } },
    },
    elements: {
      bar: { borderRadius: 4 },
    },
  };

  const barData = {
    labels: [
      "Polo Dry-Fit",
      "Leggings Pro",
      "Sudadera Tech",
      "Sports Bra",
      "Short Ultra",
    ],
    datasets: [
      {
        label: "Compradías",
        data: [155, 170, 60, 145, 110].map((v) => Math.floor(v * m)),
        backgroundColor: "#00FF66",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: "Probadías",
        data: [342, 298, 150, 260, 210].map((v) => Math.floor(v * m)),
        backgroundColor: "#F3F4F6",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 20,
          color: "#9CA3AF",
        },
      },
    },
  };

  const pieData = {
    labels: ["Mujer", "Hombre", "Unisex"],
    datasets: [
      {
        data: [58, 38, 4],
        backgroundColor: ["#00FF66", "#4F46E5", "#F59E0B"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        angleLines: { color: "rgba(156, 163, 175, 0.2)" },
        grid: { color: "rgba(156, 163, 175, 0.2)" },
        pointLabels: { color: "#9CA3AF", font: { size: 11 } },
        ticks: { display: false },
      },
    },
  };

  const radarData = {
    labels: ["Gym", "Running", "Yoga", "Ciclismo", "Outdoor", "Streetwear"],
    datasets: [
      {
        label: "Compatibilidad",
        data: [85, 75, 90, 60, 70, 80],
        backgroundColor: "rgba(0, 255, 102, 0.2)",
        borderColor: "#00FF66",
        pointBackgroundColor: "#00FF66",
        pointHoverBorderColor: "#00FF66",
        pointHoverBackgroundColor: "#fff",
      },
    ],
  };

  const sizes = [
    { size: "XS", pct: 12 },
    { size: "S", pct: 18 },
    { size: "M", pct: 32 },
    { size: "L", pct: 25 },
    { size: "XL", pct: 10 },
    { size: "XXL", pct: 3 },
  ];

  const tableData = [
    { prod: "Polo Dry-Fit", prob: 342, comp: 187, conv: 55, compat: 84 },
    { prod: "Leggings Pro", prob: 298, comp: 201, conv: 67, compat: 92 },
    { prod: "Sudadera Tech", prob: 150, comp: 52, conv: 35, compat: 71 },
    { prod: "Sports Bra", prob: 260, comp: 140, conv: 54, compat: 88 },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Métricas del Probador Virtual</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Comportamiento del usuario en el probador 2D/3D
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
        {[
          {
            label: "Prendías probadías",
            value: Math.floor(1397 * m),
            icon: "👕",
            color: "text-[#00FF66]",
          },
          {
            label: "Compras post-prueba",
            value: Math.floor(805 * m),
            icon: "🛍️",
            color: "text-blue-500",
          },
          {
            label: "Tasa de conversión",
            value: "58%",
            icon: "📈",
            color: "text-[#00FF66]",
          },
          {
            label: "Rechazo incompatibilidad",
            value: Math.floor(312 * m),
            icon: "⚠️",
            color: "text-orange-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-bold mb-6">Probadías vs. Compradías</h3>
          <div className="h-72">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col">
          <h3 className="font-bold mb-6">Uso por género</h3>
          <div className="h-64 flex-1">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-bold mb-6">Tallas más seleccionadías</h3>
          <div className="space-y-4">
            {sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 font-bold text-sm">{s.size}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00FF66] rounded-full transition-all duration-1000"
                    style={{ width: `${s.pct}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right text-sm font-bold text-[#00FF66]">
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-bold mb-6">Compatibilidad por deporte</h3>
          <div className="h-64">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold">Productos con mayor conversión</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Probadías</th>
                <th className="px-6 py-4">Compradías</th>
                <th className="px-6 py-4">Conversión</th>
                <th className="px-6 py-4">Compatibilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {tableData.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                >
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-200">
                    {row.prod}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {Math.floor(row.prob * m)}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#00FF66]">
                    {Math.floor(row.comp * m)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00FF66] rounded-full"
                          style={{ width: `${row.conv}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-[#00FF66]">
                        {row.conv}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#00FF66]/10 text-[#00FF66] px-3 py-1 rounded-full text-xs font-bold border border-[#00FF66]/20">
                      {row.compat}%
                    </span>
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
