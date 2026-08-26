import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend } from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import KPICard from "../../components/admin/KPICard";
import { fetchArMetrics } from "../../services/admin";
import { mockProducts, mockArTopProducts, mockArOutfits, mockConversionByCategory, mockConversionFunnel } from "../../data/mock";
import type { ArMetrics } from "../../data/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const dailyTestData = {
  labels: ["Oct 1", "Oct 5", "Oct 10", "Oct 15", "Oct 20", "Oct 25"],
  datasets: [
    {
      label: "AR Tests",
      data: [280, 460, 220, 720, 580, 710],
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

const sizePrefData = {
  labels: ["M", "L", "S", "XL", "XS", "XXL"],
  datasets: [
    {
      data: [32, 28, 18, 12, 6, 4],
      backgroundColor: ["#00E676", "#0088ff", "#a855f7", "#ff9900", "#ff4d4d", "#6b7280"],
      borderWidth: 0,
    },
  ],
};

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState<ArMetrics | null>(null);
  const [horizon, setHorizon] = useState("30d");

  useEffect(() => {
    fetchArMetrics().then(setMetrics);
  }, []);

  if (!metrics) return <div className="text-slate-500 text-sm">Cargando...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Metricas del Probador Virtual</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Analiza la actividad AR, los outfits y su impacto en la conversion.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer">
            <option>Ultimos 30 dias</option>
            <option>Ultimos 7 dias</option>
            <option>Ultimos 90 dias</option>
          </select>
          <button className="bg-brand-green hover:bg-brand-green-hover text-black text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all">
            Generar Reporte
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <KPICard title="Pruebas Realizadas" value={metrics.totalTests.toLocaleString()} growth={metrics.testsGrowth} icon="fa-solid fa-vr-cardboard" />
        <KPICard title="Prendas Probadas" value={metrics.garmentsTried.toLocaleString()} growth={metrics.garmentsGrowth} icon="fa-solid fa-shirt" />
        <KPICard title="Tasa de Conversion" value={`${metrics.conversionRate}%`} growth={metrics.conversionGrowth} icon="fa-solid fa-arrow-right-arrow-left" />
        <KPICard title="Outfits Creados" value={metrics.outfitsCreated.toLocaleString()} growth={metrics.outfitsGrowth} icon="fa-solid fa-wand-magic-sparkles" />
        <KPICard title="Tiempo Promedio" value={`${metrics.avgTimeMinutes} min`} growth={metrics.avgTimeGrowth} icon="fa-solid fa-clock" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pruebas AR Diarias</h2>
              <p className="text-xs font-medium text-slate-400">Tendencia de uso</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500">
              {["7d", "30d", "90d", "1y"].map((h) => (
                <button key={h} onClick={() => setHorizon(h)} className={`px-3 py-1.5 rounded-lg transition-all ${horizon === h ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <Line data={dailyTestData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } }, x: { grid: { display: false } } } }} />
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:order-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Preferencia de Talla</h2>
            <p className="text-xs font-medium text-slate-400">Distribucion de tallas probadas</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-52 h-52">
              <Doughnut data={sizePrefData} options={{ responsive: true, maintainAspectRatio: false, cutout: "65%", plugins: { legend: { display: false } } }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">100%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tallas</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {sizePrefData.labels.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sizePrefData.datasets[0].backgroundColor[i] as string }} />
                <span className="text-slate-600">{label}</span>
                <span className="text-slate-900 font-extrabold">{sizePrefData.datasets[0].data[i]}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:order-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Prendas Mas Probadas</h2>
          </div>
          <div className="space-y-4">
            {mockArTopProducts.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800 font-bold">{p.name}</span>
                  <span className="text-slate-900 font-extrabold">
                    {p.tryOns.toLocaleString()} <span className="text-slate-400 font-normal">pruebas</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full" style={{ width: `${(p.tryOns / mockArTopProducts[0].tryOns) * 100}%` }} />
                </div>
                <span className="text-[10px] text-brand-green font-bold">{p.conversionRate}% Conv.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Outfits Mas Utilizados</h2>
          </div>
          <div className="space-y-3">
            {mockArOutfits.map((o, i) => {
              const product = mockProducts[i % mockProducts.length];
              return (
              <div key={o.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <img src={product.imageUrl} alt={o.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 block truncate">{o.name}</span>
                  <span className="block text-[10px] text-slate-400">{o.garmentCount} prendas</span>
                </div>
                <span className="text-xs font-extrabold text-slate-900">{o.uses} usos</span>
              </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Conversion por Categoria</h2>
            <p className="text-xs font-medium text-slate-400">Pruebas AR y compras por categoria</p>
          </div>
          <div className="space-y-4">
            {mockConversionByCategory.map((category) => {
              const chartScale = 16000;
              return (
                <div key={category.name}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800">{category.name}</span>
                    <span className="font-extrabold text-brand-green">{category.conversionRate}% conv.</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${(category.tests / chartScale) * 100}%` }} /></div>
                    <span className="font-mono text-xs font-semibold text-slate-400 w-12 text-right tabular-nums">{category.tests.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-green rounded-full transition-all" style={{ width: `${(category.purchases / chartScale) * 100}%` }} /></div>
                    <span className="font-mono text-xs font-semibold text-slate-400 w-12 text-right tabular-nums">{category.purchases.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Embudo de Conversion</h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Mide el exito desde la visita del producto hasta la compra final usando el Probador AR.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {mockConversionFunnel.map((step, i) => {
            const funnelLabels = ["VISITARON", "PROBARON", "CARRITO", "COMPRARON"];
            return (
              <div key={step.step} className="contents">
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100/90 flex-1 flex flex-col justify-between space-y-3 transition-all hover:bg-slate-50 hover:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-500">{i + 1}. {funnelLabels[i]}</span>
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full tracking-tight">{step.percentage}%</span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{step.count.toLocaleString()}</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">{step.description}</p>
                  </div>
                </div>
                {i < mockConversionFunnel.length - 1 && <div className="hidden lg:flex items-center justify-center text-brand-green px-0.5 self-center"><i className="fa-solid fa-arrow-right w-5 text-center" /></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
