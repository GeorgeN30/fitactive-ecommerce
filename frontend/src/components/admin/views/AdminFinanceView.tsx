import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFinanceExpense, fetchFinanceData, type FinanceData, type FinancePeriod } from "../../../services/finance";

function money(value: number | null): string {
  if (value === null) return "—";
  return `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TrendChart({ data }: { data: FinanceData["monthlyRevenue"] }) {
  const width = 720;
  const height = 250;
  const paddingX = 34;
  const paddingTop = 20;
  const paddingBottom = 32;
  const hasRevenue = data.some((point) => point.value > 0);
  const maxValue = Math.max(...data.map((point) => point.value), 1) * 1.12;
  const x = (index: number) =>
    paddingX + (index * (width - paddingX * 2)) / Math.max(data.length - 1, 1);
  const y = (value: number) =>
    paddingTop + ((maxValue - value) * (height - paddingTop - paddingBottom)) / maxValue;
  const revenuePoints = data.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const areaPoints = data.length
    ? `${paddingX},${height - paddingBottom} ${revenuePoints} ${x(data.length - 1)},${height - paddingBottom}`
    : "";

  if (!hasRevenue) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-zinc-800">
        Aún no hay ventas registradas en la base de datos.
      </div>
    );
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible" role="img" aria-label="Ingresos registrados">
        {[0, 1, 2, 3].map((line) => {
          const lineY = paddingTop + (line * (height - paddingTop - paddingBottom)) / 3;
          return <line key={line} x1={paddingX} x2={width - paddingX} y1={lineY} y2={lineY} stroke="currentColor" className="text-gray-100 dark:text-zinc-800" strokeDasharray="4 6" />;
        })}
        <polygon points={areaPoints} fill="rgba(0, 232, 122, 0.10)" />
        <polyline points={revenuePoints} fill="none" stroke="#00E87A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((point, index) => (
          <circle key={`${point.label}-${index}`} cx={x(index)} cy={y(point.value)} r="4" fill="#00E87A" stroke="white" strokeWidth="2" />
        ))}
        {data.map((point, index) => (
          <text key={`label-${point.label}-${index}`} x={x(index)} y={height - 8} textAnchor="middle" className="fill-gray-400 text-[11px]">{point.label}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#00E87A]" />Ingresos reales</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, accent, muted = false }: { label: string; value: string; detail: string; accent: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
      <p className={`text-2xl font-black tracking-tight ${muted ? "text-gray-400 dark:text-zinc-600" : "text-gray-900 dark:text-white"}`}>{value}</p>
      <p className={`mt-2 text-xs ${muted ? "text-gray-400 dark:text-zinc-600" : "text-gray-500 dark:text-gray-400"}`}>{detail}</p>
    </div>
  );
}

function EmptyFinancePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 px-5 text-center text-xs text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
      {children}
    </div>
  );
}

export default function AdminFinanceView() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [period, setPeriod] = useState<FinancePeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: "Operaciones", description: "", amount: "", spentAt: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    let cancelled = false;
    void fetchFinanceData(period)
      .then((finance) => {
        if (!cancelled) setData(finance);
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
  }, [period]);

  const summary = useMemo(() => ({
    revenue: data?.revenue ?? 0,
    orders: data?.ordersCount ?? 0,
    returns: data?.returnsCount ?? 0,
  }), [data]);

  const periodOptions: { value: FinancePeriod; label: string }[] = [
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Año" },
  ];
  const handleCreateExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingExpense) return;
    setSavingExpense(true); setExpenseError("");
    try {
      await createFinanceExpense({ category: expenseForm.category, description: expenseForm.description, amount: Number(expenseForm.amount), spentAt: expenseForm.spentAt });
      setExpenseForm((current) => ({ ...current, description: "", amount: "" }));
      const latest = await fetchFinanceData(period); setData(latest);
    } catch (saveError) {
      const code = (saveError as { response?: { data?: { error?: string } } }).response?.data?.error;
      setExpenseError(code === "INVALID_EXPENSE_DATE" ? "El gasto no puede tener fecha futura." : "No se pudo guardar el egreso. Revisa los datos.");
    } finally { setSavingExpense(false); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-gray-900 dark:text-white animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finanzas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Resumen financiero construido con los pedidos reales de FITLOOK.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/50" aria-label="Periodo financiero">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (period === option.value) return;
                setLoading(true);
                setError(false);
                setPeriod(option.value);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${period === option.value ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-100 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"}`} role="status">
        {loading
          ? "Consultando ingresos y movimientos reales..."
          : error
            ? "No se pudo consultar Finanzas. Revisa la conexión y vuelve a entrar al módulo."
            : "Ventas, gastos ingresados y reembolsos provienen de registros persistidos. Los métodos de pago se contabilizan desde pedidos confirmados por Mercado Pago."}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Flujo neto" value={loading ? "..." : money(summary.revenue)} detail={`${summary.orders} pedidos, gastos y reembolsos del periodo`} accent="bg-[#00E87A]" />
        <MetricCard label="Pedidos" value={loading ? "..." : String(summary.orders)} detail={data?.periodLabel || "Periodo seleccionado"} accent="bg-[#38BDF8]" />
        <MetricCard label="Devoluciones" value={loading ? "..." : String(summary.returns)} detail="Pedidos marcados como devolución" accent="bg-[#F59E0B]" />
        <MetricCard label="Gastos" value={loading ? "..." : money(data?.expenseTotal || 0)} detail={`${data?.expenses.length || 0} egresos en el periodo`} accent="bg-[#A78BFA]" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Ingresos registrados</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{data?.periodLabel || "Periodo seleccionado"} consultados en la base de datos</p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Total {loading ? "..." : money(summary.revenue)}</span>
          </div>
          <TrendChart data={data?.monthlyRevenue || []} />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="font-bold">Ventas por categoría</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Distribución de ventas del periodo seleccionado</p>
          </div>
          {data?.categories.length ? (
            <div className="space-y-4">
              {data.categories.slice(0, 6).map((category) => (
                <div key={category.name}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{category.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{category.percentage}% · {money(category.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#00B863] to-[#00E87A] transition-all duration-500" style={{ width: `${Math.max(category.percentage, 2)}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">{category.units} unidades</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyFinancePanel>No hay ventas por categoría en este periodo.</EmptyFinancePanel>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Flujo neto por periodo</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ventas agrupadas por {period === "week" ? "día" : period === "month" ? "mes" : period === "quarter" ? "trimestre" : "año"}</p>
            </div>
            <i className="fa-solid fa-chart-column text-gray-300 dark:text-zinc-600" />
          </div>
          {data?.monthlyRevenue.some((point) => point.value > 0) ? (
            <div className="flex h-48 items-end gap-3 border-b border-gray-100 px-2 dark:border-zinc-800">
              {data.monthlyRevenue.map((point) => {
                const maxRevenue = Math.max(...data.monthlyRevenue.map((item) => item.value), 1);
                return (
                  <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{money(point.value)}</span>
                    <div className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-[#00B863] to-[#00E87A] transition-all duration-300 hover:brightness-110" style={{ height: `${Math.max((point.value / maxRevenue) * 72, 4)}%` }} />
                    <span className="pb-2 text-[10px] text-gray-400">{point.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyFinancePanel>Aún no hay ingresos suficientes para graficar.</EmptyFinancePanel>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-5">
            <h2 className="font-bold">Métodos de pago</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Transacciones confirmadas en el periodo seleccionado</p>
          </div>
          {data?.paymentMethods.length ? <div className="space-y-4">{data.paymentMethods.map((method) => <div key={method.name} className="rounded-xl border p-4"><div className="flex justify-between font-bold"><span>{method.name}</span><span>{money(method.amount)}</span></div><p className="mt-2 text-xs text-gray-500">{method.transactions} pagos aprobados · {method.percentage}% de ingresos brutos</p></div>)}</div> : <EmptyFinancePanel>No hay pagos confirmados en este periodo.</EmptyFinancePanel>}
        </section>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form onSubmit={(event) => void handleCreateExpense(event)} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div><h2 className="font-bold">Registrar egreso</h2><p className="mt-1 text-xs text-gray-500">Los egresos se guardan con responsable y fecha para el historial financiero.</p></div>
          {expenseError && <p role="alert" className="text-sm text-red-600">{expenseError}</p>}
          <label className="block text-sm">Categoría<input required minLength={2} maxLength={100} value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })} className="mt-1 block w-full rounded-lg border p-2 bg-transparent" /></label>
          <label className="block text-sm">Descripción<input required minLength={3} maxLength={255} value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} className="mt-1 block w-full rounded-lg border p-2 bg-transparent" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Importe (S/)<input required type="number" min="0.01" max="99999999" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} className="mt-1 block w-full rounded-lg border p-2 bg-transparent" /></label><label className="block text-sm">Fecha<input required type="date" max={new Date().toISOString().slice(0, 10)} value={expenseForm.spentAt} onChange={(event) => setExpenseForm({ ...expenseForm, spentAt: event.target.value })} className="mt-1 block w-full rounded-lg border p-2 bg-transparent" /></label></div>
          <button disabled={savingExpense} className="rounded-lg bg-brand-green px-4 py-2 font-bold text-black disabled:opacity-50">{savingExpense ? "Guardando…" : "Registrar egreso"}</button>
        </form>
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="p-5"><h2 className="font-bold">Egresos registrados</h2><p className="mt-1 text-xs text-gray-500">{data?.periodLabel || "Periodo seleccionado"}</p></div>{!data?.expenses.length ? <EmptyFinancePanel>No hay egresos registrados en este periodo.</EmptyFinancePanel> : <div className="divide-y dark:divide-zinc-800">{data.expenses.map((expense) => <div key={expense.id} className="flex justify-between gap-3 px-5 py-3 text-sm"><span><strong className="block">{expense.description}</strong><span className="text-xs text-gray-500">{expense.category} · {new Date(expense.spentAt).toLocaleDateString("es-PE")}</span></span><strong className="text-red-600">−{money(expense.amount)}</strong></div>)}</div>}</section>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 dark:border-zinc-800">
          <div>
            <h2 className="font-bold">Últimos movimientos</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pedidos reales registrados</p>
          </div>
          <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 dark:bg-zinc-800 dark:text-gray-300">Solo lectura</span>
        </div>
        {data?.transactions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-zinc-950/40 dark:text-gray-400">
                <tr><th className="px-5 py-3 font-medium">Referencia</th><th className="px-5 py-3 font-medium">Descripción</th><th className="px-5 py-3 font-medium">Fecha</th><th className="px-5 py-3 text-right font-medium">Monto</th><th className="px-5 py-3 text-right font-medium">Tipo</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {data.transactions.map((transaction) => (
                  <tr key={transaction.reference} className="transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-4 font-bold">{transaction.reference}</td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{transaction.description}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{transaction.date}</td>
                      <td className={`px-5 py-4 text-right font-bold ${transaction.type === "Ingreso" ? "text-emerald-600 dark:text-[#00E87A]" : transaction.type === "Gasto" ? "text-red-600" : "text-amber-600 dark:text-amber-300"}`}>{transaction.amount >= 0 ? "+" : "−"}{money(Math.abs(transaction.amount))}</td>
                    <td className="px-5 py-4 text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${transaction.type === "Ingreso" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : transaction.type === "Gasto" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"}`}>{transaction.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-gray-400">No hay movimientos financieros registrados todavía.</div>
        )}
      </section>
    </div>
  );
}
