import { useEffect, useState } from "react";
import { fetchReturns, updateReturn, returnLabels, returnError, type ReturnRequest } from "../../../services/returns";
export default function AdminReturnsView() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => { try { setRequests(await fetchReturns(true)); setError(""); } catch { setError("No se pudieron cargar las devoluciones."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const act = async (request: ReturnRequest, action: "review" | "receive" | "refund", decision?: "APPROVED" | "REJECTED") => {
    if (busy) return;
    if (action === "refund" && !window.confirm(`Procesar o verificar el reembolso de S/ ${request.amount.toFixed(2)} en Mercado Pago para ${request.orderNumber}?`)) return;
    setBusy(true); setError("");
    try { const updated = await updateReturn(request.id, action, { decision, comment: comments[request.id] }); setRequests((current) => current.map((row) => row.id === updated.id ? updated : row)); }
    catch (err) { setError(returnError(err)); } finally { setBusy(false); }
  };
  const visible = requests.filter((request) => filter === "ALL" || request.status === filter);
  return <div className="max-w-5xl space-y-5 text-gray-900 dark:text-white pb-10"><h1 className="text-2xl font-bold">Devoluciones</h1><p className="text-sm text-gray-500">La recepción repone stock una sola vez. El reembolso usa el importe realmente pagado y solo se confirma con Mercado Pago.</p>
    <div className="flex gap-2 flex-wrap"><button onClick={() => void load()} className="underline">Actualizar</button><select aria-label="Filtrar devoluciones" value={filter} onChange={(event) => setFilter(event.target.value)} className="border rounded-lg p-2 dark:bg-zinc-900"><option value="ALL">Todas</option>{Object.entries(returnLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}{loading ? <p>Cargando…</p> : !visible.length ? <p>No hay devoluciones en este filtro.</p> : visible.map((request) => <article key={request.id} className="bg-white dark:bg-zinc-900 p-5 border rounded-2xl space-y-3"><h2 className="font-bold">{request.orderNumber} · {request.customer.name || request.customer.email}</h2><p>{returnLabels[request.status]} · S/ {request.amount.toFixed(2)}</p><p>{request.reason}</p><ul className="text-sm">{request.items.map((item) => <li key={item.sizeId}>{item.name} · Talla {item.size} · {item.quantity} unidad(es)</li>)}</ul>{request.comment && <p className="text-sm">Comentario: {request.comment}</p>}
      {request.status === "PENDING" && <div className="flex gap-3 flex-wrap"><input aria-label={`Comentario para ${request.orderNumber}`} value={comments[request.id] || ""} onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={1000} placeholder="Comentario opcional" className="border rounded-lg p-2 bg-transparent" /><button disabled={busy} onClick={() => void act(request, "review", "REJECTED")} className="p-2 rounded-lg bg-red-100 text-red-700">Rechazar</button><button disabled={busy} onClick={() => void act(request, "review", "APPROVED")} className="p-2 rounded-lg bg-brand-green text-black">Aprobar devolución</button></div>}
      {request.status === "APPROVED" && <button disabled={busy} onClick={() => void act(request, "receive")} className="p-3 rounded-lg bg-brand-green text-black">Confirmar recepción y reponer stock</button>}
      {request.status === "RECEIVED" && <><p className="text-sm">Reembolso: {request.refundStatus}</p><button disabled={busy} onClick={() => void act(request, "refund")} className="p-3 rounded-lg bg-brand-green text-black">{request.refundStatus === "PENDING" ? "Verificar reembolso" : "Procesar reembolso"}</button></>}
      {request.status === "REFUNDED" && <p className="text-sm font-bold text-emerald-700">Reembolso confirmado{request.refundedAt && ` · ${new Date(request.refundedAt).toLocaleString("es-PE")}`}</p>}
    </article>)}
  </div>;
}
