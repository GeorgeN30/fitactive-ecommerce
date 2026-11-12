import { useCallback, useEffect, useState } from "react";
import { fetchDiscountRequests, reviewDiscountRequest, revertDiscountRequest, type DiscountRequest } from "../../../services/discounts";

const labels = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada", REVERTED: "Retirada", ACTIVE: "Activa", SCHEDULED: "Programada", EXPIRED: "Vencida", ALL: "Todas" };
export default function AdminDiscountRequestsView() {
  const [requests, setRequests] = useState<DiscountRequest[]>([]);
  const [filter, setFilter] = useState<keyof typeof labels>("PENDING");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setRequests(await fetchDiscountRequests()); setError(""); }
    catch { setError("No se pudieron cargar las solicitudes. Vuelve a intentarlo."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 30_000); return () => window.clearInterval(timer); }, [load]);
  const decide = async (request: DiscountRequest, decision: "APPROVED" | "REJECTED" | "REVERTED") => {
    if (processing) return;
    setProcessing(true); setError("");
    try {
      const updated = decision === "REVERTED" ? await revertDiscountRequest(request.id) : await reviewDiscountRequest(request.id, decision, comments[request.id]);
      setRequests((current) => current.map((row) => row.id === updated.id ? updated : row));
    } catch (err) {
      const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(code === "INVALID_DISCOUNT_WINDOW" ? "La vigencia solicitada ya venció. Rechaza la solicitud y solicita nuevas fechas." : "No se pudo guardar la decisión. Actualiza para consultar el estado actual.");
    } finally { setProcessing(false); }
  };
  const visible = requests.filter((request) => filter === "ALL" || request.status === filter || request.offerStatus === filter);
  return <div className="space-y-6 text-gray-900 dark:text-white pb-10 max-w-6xl mx-auto">
    <h1 className="text-2xl font-bold">Solicitudes de descuentos</h1>
    <p className="text-sm text-gray-500">La oferta se publica al aprobarla. Las duraciones rápidas empiezan en ese momento.</p>
    <div className="flex flex-wrap gap-2">{(Object.keys(labels) as (keyof typeof labels)[]).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filter === value ? "bg-brand-green text-black" : "bg-gray-100 dark:bg-zinc-800"}`}>{labels[value]}</button>)}<button type="button" onClick={() => void load()} className="px-3 py-2 text-sm underline">Actualizar</button></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {loading ? <p>Cargando solicitudes…</p> : visible.length === 0 ? <p>No hay solicitudes en este filtro.</p> : visible.map((request) => <article key={request.id} className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-3">
      <h2 className="font-bold">{request.product.name} · Talla {request.product.size} · -{request.percent}%</h2>
      <p className="text-sm">{labels[request.offerStatus || request.status]} · Solicita: {request.requester.name || request.requester.email}</p><p className="text-sm">{request.reason}</p>
      <p className="text-sm">Base: S/ {request.product.basePrice.toFixed(2)} · Actual: S/ {request.product.salePrice.toFixed(2)}</p>
      <p className="text-xs text-gray-500">{request.durationHours && request.status === "PENDING" ? `${request.durationHours} horas desde la aprobación` : request.endsAt ? `Vigencia: ${request.startsAt ? new Date(request.startsAt).toLocaleString("es-PE") : "Al aprobar"} — ${new Date(request.endsAt).toLocaleString("es-PE")}` : "Sin fecha de fin (descuento anterior)"}</p>
      {request.reviewComment && <p className="text-sm">Comentario: {request.reviewComment}</p>}
      {request.status === "PENDING" && <div className="flex flex-wrap gap-3"><input aria-label={`Comentario para ${request.product.name} ${request.product.size}`} maxLength={255} value={comments[request.id] || ""} onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Comentario opcional" className="border rounded-lg p-2 dark:bg-zinc-900" /><button disabled={processing} onClick={() => void decide(request, "REJECTED")} className="p-2 rounded-lg bg-red-100 text-red-700 disabled:opacity-50">Rechazar</button><button disabled={processing} onClick={() => void decide(request, "APPROVED")} className="p-2 rounded-lg bg-brand-green text-black disabled:opacity-50">Aprobar</button></div>}
      {request.canRevert && <button disabled={processing} onClick={() => void decide(request, "REVERTED")} className="p-2 rounded-lg bg-red-100 text-red-700 disabled:opacity-50">Retirar descuento</button>}
    </article>)}
  </div>;
}
