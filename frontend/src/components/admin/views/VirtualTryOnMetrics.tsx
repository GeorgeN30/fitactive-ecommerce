import { useEffect, useState, type ReactNode } from "react";
import { Bar, Pie, Radar } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { fetchArMetrics } from "../../../services/admin";
import type {
  VirtualTryOnPeriod,
  VirtualTryOnSummary,
} from "../../../services/virtualTryOn";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
);

const periodOptions: { id: VirtualTryOnPeriod; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "year", label: "Año" },
];

function growthLabel(value: number): string {
  if (value === 0) return "Sin variación";
  return `${value > 0 ? "+" : ""}${value}% vs. periodo anterior`;
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 text-2xl">{icon}</div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-[11px] text-gray-400 dark:text-zinc-500">{detail}</p>
    </div>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 px-6 text-center text-sm text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
      {children}
    </div>
  );
}

export default function VirtualTryOnMetrics() {
  const [period, setPeriod] = useState<VirtualTryOnPeriod>("month");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<VirtualTryOnSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void fetchArMetrics(period, period === "custom" ? customDate : undefined)
      .then((summary) => {
        if (!cancelled) setData(summary);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customDate, period]);

  const hasEvents = Boolean(data?.totalTests);
  const topProducts = data?.topProducts || [];
  const genderUsage = data?.genderUsage || [];
  const categoryConversion = data?.categoryConversion || [];
  const sizeUsage = data?.sizeUsage || [];
  const funnel = data?.funnel || [];

  const barData = {
    labels: topProducts.map((product) => product.name),
    datasets: [
      {
        label: "Pruebas",
        data: topProducts.map((product) => product.tryOns),
        backgroundColor: "#00FF66",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: "Compras asociadas",
        data: topProducts.map((product) => product.purchases),
        backgroundColor: "#4F46E5",
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const pieData = {
    labels: genderUsage.length ? genderUsage.map((item) => item.name) : ["Sin datos"],
    datasets: [{
      data: genderUsage.length ? genderUsage.map((item) => item.count) : [1],
      backgroundColor: genderUsage.length ? ["#00FF66", "#4F46E5", "#F59E0B", "#94A3B8"] : ["#CBD5E1"],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const radarData = {
    labels: categoryConversion.length ? categoryConversion.map((item) => item.name) : ["Sin datos"],
    datasets: [{
      label: "Conversión",
      data: categoryConversion.length ? categoryConversion.map((item) => item.conversionRate) : [0],
      backgroundColor: "rgba(0, 255, 102, 0.2)",
      borderColor: "#00FF66",
      pointBackgroundColor: "#00FF66",
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { labels: { color: "#9CA3AF" } },
      tooltip: { backgroundColor: "#1E1E1E", titleColor: "#00FF66", bodyColor: "#FFFFFF" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9CA3AF" } },
      y: { grid: { display: false }, ticks: { color: "#9CA3AF" } },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { usePointStyle: true, boxWidth: 8, padding: 20, color: "#9CA3AF" } },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        angleLines: { color: "rgba(156, 163, 175, 0.2)" },
        grid: { color: "rgba(156, 163, 175, 0.2)" },
        pointLabels: { color: "#9CA3AF", font: { size: 11 } },
        ticks: { display: false },
      },
    },
  };

  return (
    <div className="space-y-6 pb-10 text-gray-900 animate-fade-in dark:text-white">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold">Métricas del Probador Virtual</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Eventos reales registrados en el probador 2D/3D.</p>
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1 text-sm dark:bg-zinc-800">
          {periodOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              className={`whitespace-nowrap rounded-md px-4 py-1.5 transition ${period === option.id ? "bg-[#00FF66] font-semibold text-black shadow" : "hover:bg-white dark:hover:bg-zinc-700"}`}
            >
              {option.label}
            </button>
          ))}
          <div className="mx-2 h-4 w-px bg-gray-300 dark:bg-zinc-600" />
          <input
            type="date"
            aria-label="Fecha personalizada de métricas"
            value={customDate}
            onChange={(event) => {
              setCustomDate(event.target.value);
              setPeriod("custom");
            }}
            className={`cursor-pointer rounded-md bg-transparent px-2 py-1.5 outline-none transition ${period === "custom" ? "font-bold text-[#00FF66]" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
          />
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"}`} role="status">
        {loading
          ? "Consultando eventos reales del probador..."
          : error
            ? "No se pudieron consultar las métricas. Revisa la conexión y vuelve a entrar al módulo."
            : hasEvents
              ? `${data?.totalTests} pruebas registradas en ${data?.periodLabel?.toLowerCase()}.`
              : `No hay eventos del probador registrados en ${data?.periodLabel?.toLowerCase() || "este periodo"}.`}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Pruebas realizadas" value={loading ? "..." : String(data?.totalTests || 0)} detail={growthLabel(data?.testsGrowth || 0)} icon="👕" color="text-[#00FF66]" />
        <MetricCard label="Prendas probadas" value={loading ? "..." : String(data?.garmentsTried || 0)} detail={growthLabel(data?.garmentsGrowth || 0)} icon="🧥" color="text-blue-500" />
        <MetricCard label="Tasa de conversión" value={loading ? "..." : `${data?.conversionRate || 0}%`} detail={growthLabel(data?.conversionGrowth || 0)} icon="📈" color="text-[#00FF66]" />
        <MetricCard label="Outfits creados" value={loading ? "..." : String(data?.outfitsCreated || 0)} detail={growthLabel(data?.outfitsGrowth || 0)} icon="🛍️" color="text-orange-500" />
        <MetricCard label="Tiempo promedio" value={loading ? "..." : `${data?.avgTimeMinutes || 0} min`} detail={growthLabel(data?.avgTimeGrowth || 0)} icon="⏱️" color="text-violet-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h3 className="mb-6 font-bold">Pruebas y compras asociadas</h3>
          {hasEvents ? <div className="h-72"><Bar data={barData} options={barOptions} /></div> : <EmptyPanel>Las pruebas aparecerán aquí cuando los usuarios utilicen el probador.</EmptyPanel>}
        </div>
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-6 font-bold">Uso por género</h3>
          {hasEvents ? <div className="h-64 flex-1"><Pie data={pieData} options={pieOptions} /></div> : <EmptyPanel>Aún no hay género registrado en eventos del probador.</EmptyPanel>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-6 font-bold">Tallas más seleccionadas</h3>
          {sizeUsage.length ? (
            <div className="space-y-4">
              {sizeUsage.map((item) => (
                <div key={item.size} className="flex items-center gap-4">
                  <span className="w-8 text-sm font-bold">{item.size}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-[#00FF66]" style={{ width: `${item.percentage}%` }} /></div>
                  <span className="w-14 text-right text-sm font-bold text-[#00FF66]">{item.percentage}%</span>
                </div>
              ))}
            </div>
          ) : <EmptyPanel>Aún no hay tallas seleccionadas.</EmptyPanel>}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-6 font-bold">Conversión por categoría</h3>
          {categoryConversion.length ? <div className="h-64"><Radar data={radarData} options={radarOptions} /></div> : <EmptyPanel>Aún no hay categorías con pruebas registradas.</EmptyPanel>}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-5 font-bold">Embudo del probador</h3>
        {funnel.length && hasEvents ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {funnel.map((item) => (
              <div key={item.step} className="rounded-xl bg-gray-50 p-4 dark:bg-zinc-950/50">
                <p className="text-[10px] font-black tracking-widest text-gray-400">{item.step}</p>
                <p className="mt-2 text-2xl font-black">{item.count}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.percentage}% · {item.description}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">El embudo aparecerá cuando existan eventos de sesión y pruebas.</p>}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-100 p-6 dark:border-zinc-800"><h3 className="font-bold">Productos con mayor conversión</h3></div>
        {topProducts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap text-left text-sm">
              <thead className="bg-gray-50 font-medium text-gray-500 dark:bg-zinc-950/50 dark:text-gray-400"><tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Pruebas</th><th className="px-6 py-4">Compras</th><th className="px-6 py-4">Conversión</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {topProducts.map((product) => <tr key={product.name} className="transition hover:bg-gray-50 dark:hover:bg-zinc-800/50"><td className="px-6 py-4 font-bold">{product.name}</td><td className="px-6 py-4 text-gray-500">{product.tryOns}</td><td className="px-6 py-4 font-bold text-[#00FF66]">{product.purchases}</td><td className="px-6 py-4"><span className="rounded-full border border-[#00FF66]/20 bg-[#00FF66]/10 px-3 py-1 text-xs font-bold text-[#00FF66]">{product.conversionRate}%</span></td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <p className="p-10 text-center text-sm text-gray-400">Aún no hay productos probados en este periodo.</p>}
      </div>
    </div>
  );
}
