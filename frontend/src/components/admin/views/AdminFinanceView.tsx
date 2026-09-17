import { useMemo, useState } from "react";

type FinancePeriod = "week" | "month" | "quarter" | "year";

interface FinancePeriodData {
  label: string;
  revenue: number[];
  expenses: number[];
}

interface FinanceCategory {
  name: string;
  percent: number;
  amount: number;
  color: string;
}

const PERIOD_LABELS: Record<FinancePeriod, string> = {
  week: "Semana",
  month: "Mes",
  quarter: "Trimestre",
  year: "Año",
};

const PERIOD_DATA: Record<FinancePeriod, FinancePeriodData> = {
  week: {
    label: "Últimos 7 días",
    revenue: [5600, 6800, 7200, 6350, 8240, 9320, 11000],
    expenses: [2300, 3100, 2950, 2780, 3400, 3860, 4200],
  },
  month: {
    label: "Enero — Septiembre 2026",
    revenue: [24500, 26800, 29100, 31400, 33800, 35200, 37400, 39600, 41200],
    expenses: [14400, 15100, 16200, 17100, 18000, 18900, 20100, 21400, 22300],
  },
  quarter: {
    label: "Resumen por trimestre 2026",
    revenue: [74200, 89100, 105600, 123800],
    expenses: [45700, 54100, 61300, 67900],
  },
  year: {
    label: "Comparativo anual",
    revenue: [256000, 312500, 388700, 421300],
    expenses: [161000, 194300, 237400, 254800],
  },
};

const PERIOD_AXIS_LABELS: Record<FinancePeriod, string[]> = {
  week: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  month: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep"],
  quarter: ["T1", "T2", "T3", "T4"],
  year: ["2023", "2024", "2025", "2026"],
};

const CATEGORY_DATA: FinanceCategory[] = [
  { name: "Tops", percent: 38, amount: 32140, color: "#00E87A" },
  { name: "Bottoms", percent: 27, amount: 22815, color: "#38BDF8" },
  { name: "Outerwear", percent: 20, amount: 16900, color: "#A78BFA" },
  { name: "Accesorios", percent: 15, amount: 12675, color: "#F59E0B" },
];

const PAYMENT_DATA = [
  { name: "Tarjeta de débito", percent: 36, amount: 30420, color: "#00E87A" },
  { name: "Mercado Pago", percent: 29, amount: 24505, color: "#38BDF8" },
  { name: "Tarjeta de crédito", percent: 22, amount: 18590, color: "#A78BFA" },
  { name: "Yape / Plin", percent: 13, amount: 10965, color: "#F59E0B" },
];

const RECENT_TRANSACTIONS = [
  { reference: "ORD-2026-00841", description: "Venta online", date: "16 Sep 2026", amount: 189.8, type: "Ingreso" },
  { reference: "OP-2026-00318", description: "Reposición de inventario", date: "15 Sep 2026", amount: -1240, type: "Gasto" },
  { reference: "ORD-2026-00836", description: "Venta online", date: "15 Sep 2026", amount: 74.9, type: "Ingreso" },
  { reference: "OP-2026-00312", description: "Servicio de delivery", date: "14 Sep 2026", amount: -380, type: "Gasto" },
];

function money(value: number): string {
  return `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TrendChart({ data, labels }: { data: FinancePeriodData; labels: string[] }) {
  const width = 720;
  const height = 250;
  const paddingX = 34;
  const paddingTop = 20;
  const paddingBottom = 32;
  const maxValue = Math.max(...data.revenue, ...data.expenses) * 1.12;
  const x = (index: number) =>
    paddingX + (index * (width - paddingX * 2)) / Math.max(labels.length - 1, 1);
  const y = (value: number) =>
    paddingTop + ((maxValue - value) * (height - paddingTop - paddingBottom)) / maxValue;
  const revenuePoints = data.revenue.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const expensePoints = data.expenses.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const areaPoints = `${paddingX},${height - paddingBottom} ${revenuePoints} ${x(labels.length - 1)},${height - paddingBottom}`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible" role="img" aria-label="Ingresos y gastos simulados">
        {[0, 1, 2, 3].map((line) => {
          const lineY = paddingTop + (line * (height - paddingTop - paddingBottom)) / 3;
          return <line key={line} x1={paddingX} x2={width - paddingX} y1={lineY} y2={lineY} stroke="currentColor" className="text-gray-100 dark:text-zinc-800" strokeDasharray="4 6" />;
        })}
        <polygon points={areaPoints} fill="rgba(0, 232, 122, 0.10)" />
        <polyline points={revenuePoints} fill="none" stroke="#00E87A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={expensePoints} fill="none" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.revenue.map((value, index) => (
          <circle key={`revenue-${index}`} cx={x(index)} cy={y(value)} r="4" fill="#00E87A" stroke="white" strokeWidth="2" />
        ))}
        {data.expenses.map((value, index) => (
          <circle key={`expense-${index}`} cx={x(index)} cy={y(value)} r="4" fill="#A78BFA" stroke="white" strokeWidth="2" />
        ))}
        {labels.map((label, index) => (
          <text key={label} x={x(index)} y={height - 8} textAnchor="middle" className="fill-gray-400 text-[11px]">{label}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#00E87A]" />Ingresos</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#A78BFA]" />Gastos</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
      <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{value}</p>
      <p className="mt-2 text-xs text-emerald-600 dark:text-[#00E87A]">{detail}</p>
    </div>
  );
}

export default function AdminFinanceView() {
  const [period, setPeriod] = useState<FinancePeriod>("month");
  const selectedData = PERIOD_DATA[period];
  const labels = PERIOD_AXIS_LABELS[period];

  const summary = useMemo(() => {
    const revenue = selectedData.revenue.reduce((total, value) => total + value, 0);
    const expenses = selectedData.expenses.reduce((total, value) => total + value, 0);
    const profit = revenue - expenses;
    return {
      revenue,
      expenses,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    };
  }, [selectedData]);

  const pieGradient = useMemo(() => {
    let start = 0;
    return CATEGORY_DATA.map((category) => {
      const end = start + category.percent;
      const segment = `${category.color} ${start}% ${end}%`;
      start = end;
      return segment;
    }).join(", ");
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-gray-900 dark:text-white animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">Finanzas</h1>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300">Mock</span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Resumen financiero para tomar decisiones sobre FITLOOK.</p>
        </div>
        <div className="flex flex-wrap rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {(Object.keys(PERIOD_LABELS) as FinancePeriod[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${period === value ? "bg-[#00E87A] text-[#0A0A0A] shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"}`}
            >
              {PERIOD_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300">
        Datos simulados para validar la experiencia visual. Mercado Pago y los reportes reales todavía no están conectados.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingresos" value={money(summary.revenue)} detail="↑ 12.8% vs. periodo anterior" accent="bg-[#00E87A]" />
        <MetricCard label="Gastos" value={money(summary.expenses)} detail="Operación e inventario" accent="bg-[#A78BFA]" />
        <MetricCard label="Ganancia neta" value={money(summary.profit)} detail="Resultado estimado" accent="bg-[#38BDF8]" />
        <MetricCard label="Margen" value={`${summary.margin.toFixed(1)}%`} detail="Margen sobre ingresos" accent="bg-[#F59E0B]" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Ingresos vs. gastos</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedData.label}</p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Balance {money(summary.profit)}</span>
          </div>
          <TrendChart data={selectedData} labels={labels} />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="font-bold">Ventas por categoría</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Distribución simulada del periodo</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-44 w-44 rounded-full" style={{ background: `conic-gradient(${pieGradient})` }}>
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white dark:bg-zinc-900">
                <span className="text-xl font-black">100%</span>
                <span className="text-[10px] text-gray-400">ventas</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {CATEGORY_DATA.map((category) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</span>
                <span className="font-bold">{category.percent}% <span className="ml-1 text-xs font-normal text-gray-400">{money(category.amount)}</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Ganancia por periodo</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Comparativo {PERIOD_LABELS[period].toLowerCase()}</p>
            </div>
            <i className="fa-solid fa-chart-column text-gray-300 dark:text-zinc-600" />
          </div>
          <div className="flex h-48 items-end gap-3 border-b border-gray-100 px-2 dark:border-zinc-800">
            {selectedData.revenue.map((revenue, index) => {
              const profit = revenue - selectedData.expenses[index];
              const maxProfit = Math.max(...selectedData.revenue.map((item, itemIndex) => item - selectedData.expenses[itemIndex]));
              return (
                <div key={labels[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{money(profit)}</span>
                  <div className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-[#00B863] to-[#00E87A] transition-all duration-300 hover:brightness-110" style={{ height: `${Math.max((profit / maxProfit) * 72, 12)}%` }} />
                  <span className="pb-2 text-[10px] text-gray-400">{labels[index]}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="font-bold">Métodos de pago</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Participación de cobros simulada</p>
          </div>
          <div className="space-y-5">
            {PAYMENT_DATA.map((payment) => (
              <div key={payment.name}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: payment.color }} />{payment.name}</span>
                  <span className="font-bold">{payment.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${payment.percent}%`, backgroundColor: payment.color }} />
                </div>
                <p className="mt-1 text-right text-[11px] text-gray-400">{money(payment.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 dark:border-zinc-800">
          <div>
            <h2 className="font-bold">Últimos movimientos</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Actividad financiera de muestra</p>
          </div>
          <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 dark:bg-zinc-800 dark:text-gray-300">Solo lectura</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-zinc-950/40 dark:text-gray-400">
              <tr><th className="px-5 py-3 font-medium">Referencia</th><th className="px-5 py-3 font-medium">Descripción</th><th className="px-5 py-3 font-medium">Fecha</th><th className="px-5 py-3 text-right font-medium">Monto</th><th className="px-5 py-3 text-right font-medium">Tipo</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {RECENT_TRANSACTIONS.map((transaction) => (
                <tr key={transaction.reference} className="transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-4 font-bold">{transaction.reference}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{transaction.description}</td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{transaction.date}</td>
                  <td className={`px-5 py-4 text-right font-bold ${transaction.amount > 0 ? "text-emerald-600 dark:text-[#00E87A]" : "text-red-500"}`}>{transaction.amount > 0 ? "+" : "−"}{money(Math.abs(transaction.amount))}</td>
                  <td className="px-5 py-4 text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${transaction.type === "Ingreso" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300"}`}>{transaction.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
