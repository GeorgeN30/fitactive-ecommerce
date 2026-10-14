import { useCallback, useEffect, useState } from "react";
import type { OrderView } from "../services/orders";
import { createReturn, fetchReturns, returnError, returnLabels, type ReturnRequest } from "../services/returns";
export default function OrderReturns({ order }: { order: OrderView }) {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const orderId = order.id;
  const load = useCallback(async () => { try { setRequests((await fetchReturns()).filter((request) => request.orderId === orderId)); setError(""); } catch { setError("No se pudo cargar el historial de devoluciones."); } finally { setLoading(false); } }, [orderId]);
  useEffect(() => { void load(); }, [load]);
  return <section className="border rounded-2xl p-6 mb-6 space-y-4 text-gray-900 dark:text-white"><h2 className="text-xl font-bold">Devoluciones del pedido</h2>
    <p className="text-sm text-gray-500">Solicitud → revisión → recepción → reembolso confirmado. Aprobar no significa reembolsar.</p>
    <button onClick={() => void load()} className="underline text-sm">Actualizar devoluciones</button>{error && <p role="alert" className="text-red-600">{error}</p>}
    {loading ? <p>Cargando…</p> : requests.map((request) => <article key={request.id} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 space-y-2"><p className="font-bold">{returnLabels[request.status]} · S/ {request.amount.toFixed(2)}</p><p className="text-sm">{request.reason}</p><p className="text-xs">{request.items.map((item) => `${item.name} (${item.size}) ×${item.quantity}`).join(", ")}</p>{request.comment && <p className="text-sm">Comentario: {request.comment}</p>}{request.status === "RECEIVED" && <p className="text-xs">Reembolso: {request.refundStatus === "PENDING" || request.refundStatus === "PROCESSING" ? "En procesamiento" : request.refundStatus === "FAILED" ? "Pendiente de verificación" : "Pendiente"}</p>}</article>)}
    {!loading && order.estado.toLowerCase() === "delivered" && <form onSubmit={async (event) => { event.preventDefault(); if (busy) return; const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([sizeId, quantity]) => ({ sizeId, quantity })); if (!items.length) { setError("Selecciona al menos una unidad para devolver."); return; } setBusy(true); setError(""); try { const request = await createReturn(order.id, reason, items); setRequests((current) => [request, ...current]); setReason(""); setQuantities({}); } catch (err) { setError(returnError(err)); } finally { setBusy(false); } }} className="space-y-4">
      <h3 className="font-bold">Solicitar devolución</h3>{order.entries.map((entry) => {
        const used = requests.filter((request) => request.status !== "REJECTED").flatMap((request) => request.items).filter((item) => item.sizeId === entry.productoTallaId).reduce((sum, item) => sum + item.quantity, 0);
        const available = Math.max(0, entry.cantidad - used);
        return <label key={entry.productoTallaId} className="block text-sm">{entry.nombre} · {entry.talla} (disponibles para devolver: {available})<input type="number" min={0} max={available} disabled={!available} value={quantities[entry.productoTallaId] || 0} onChange={(event) => setQuantities((current) => ({ ...current, [entry.productoTallaId]: Number(event.target.value) }))} className="block w-24 border rounded-lg p-2 bg-transparent" /></label>;
      })}<label className="block text-sm">Motivo<textarea required minLength={5} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} className="block w-full border rounded-lg p-3 bg-transparent" /></label><button disabled={busy || !!error && error.includes("historial")} className="p-3 rounded-lg bg-brand-green text-black disabled:opacity-50">{busy ? "Enviando…" : "Solicitar devolución"}</button>
    </form>}
  </section>;
}
