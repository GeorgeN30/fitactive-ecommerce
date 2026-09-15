import { useCallback, useEffect, useState } from "react";
import {
  fetchDiscountRequests,
  reviewDiscountRequest,
  revertDiscountRequest,
  type DiscountRequest,
} from "../../../services/discounts";

const statusLabel: Record<DiscountRequest["status"] | "ALL", string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  REVERTED: "Revertida",
  ALL: "Todas",
} as const;

export default function AdminDiscountRequestsView() {
  const [requests, setRequests] = useState<DiscountRequest[]>([]);
  const [filter, setFilter] = useState<DiscountRequest["status"] | "ALL">("PENDING");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setRequests(await fetchDiscountRequests(filter === "ALL" ? undefined : filter));
    } catch {
      setError("No se pudieron cargar las solicitudes de descuento.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (request: DiscountRequest, decision: "APPROVED" | "REJECTED") => {
    try {
      setProcessing(request.id);
      const updated = await reviewDiscountRequest(request.id, decision, comments[request.id]);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      const code = (requestError as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(code === "DISCOUNT_REQUEST_ALREADY_RESOLVED" ? "Otro administrador ya resolvió esta solicitud." : "No se pudo resolver la solicitud.");
      await load();
    } finally {
      setProcessing(null);
    }
  };

  const revert = async (request: DiscountRequest) => {
    try {
      setProcessing(request.id);
      const updated = await revertDiscountRequest(request.id);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      const code = (requestError as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(code === "DISCOUNT_NOT_ACTIVE" ? "El descuento ya no está activo o fue revertido por otro administrador." : "No se pudo revertir el descuento.");
      await load();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Solicitudes de descuentos</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisa, autoriza y, si hace falta, revierte descuentos activos.</p></div>
        <div className="flex gap-2">{(["PENDING", "APPROVED", "REJECTED", "REVERTED", "ALL"] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filter === value ? "bg-[#00E87A] text-black" : "bg-gray-100 dark:bg-zinc-800 text-gray-500"}`}>{statusLabel[value]}</button>)}</div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
      <div className="space-y-4">
        {loading ? <div className="p-10 text-center text-gray-400">Cargando solicitudes…</div> : requests.length === 0 ? <div className="p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-400">No hay solicitudes en este filtro.</div> : requests.map((request) => (
          <article key={request.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex gap-4"><div className="w-14 h-14 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black">-{request.percent}%</div><div><h2 className="font-bold">{request.product.name} · Talla {request.product.size}</h2><p className="text-sm text-gray-500 mt-1">Solicita: {request.requester.name || request.requester.email}</p><p className="text-sm mt-2">{request.reason}</p><p className="text-xs text-gray-400 mt-2">Precio base: S/ {request.product.basePrice.toFixed(2)} → solicitado: S/ {(request.product.basePrice * (1 - request.percent / 100)).toFixed(2)} · actual: S/ {request.product.salePrice.toFixed(2)}{request.product.currentDiscountPercent > 0 ? ` (-${request.product.currentDiscountPercent}%)` : " (sin descuento activo)"}</p></div></div>
              <span className={`self-start text-xs font-bold px-3 py-1.5 rounded-full ${request.status === "APPROVED" ? "bg-green-100 text-green-700" : request.status === "REJECTED" ? "bg-red-100 text-red-700" : request.status === "REVERTED" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"}`}>{statusLabel[request.status]}</span>
            </div>
            {request.status === "PENDING" ? <div className="mt-5 flex flex-col sm:flex-row gap-3"><input maxLength={255} value={comments[request.id] || ""} onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Comentario opcional" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent text-sm" /><button type="button" disabled={processing === request.id} onClick={() => void decide(request, "REJECTED")} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-bold text-sm disabled:opacity-50">Rechazar</button><button type="button" disabled={processing === request.id} onClick={() => void decide(request, "APPROVED")} className="px-4 py-2 rounded-lg bg-[#00E87A] text-black font-bold text-sm disabled:opacity-50">Aprobar</button></div> : <div className="mt-4 flex flex-wrap items-center gap-3">{request.status === "APPROVED" && request.product.currentDiscountPercent > 0 && <button type="button" disabled={processing === request.id} onClick={() => void revert(request)} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-bold text-sm disabled:opacity-50"><i className="fa-solid fa-rotate-left mr-2" />Revertir descuento</button>}{request.status === "REVERTED" && <span className="text-sm font-bold text-slate-500">El descuento ya fue revertido.</span>}{request.status === "APPROVED" && request.product.currentDiscountPercent === 0 && <span className="text-sm font-bold text-slate-500">No hay descuento activo.</span>}{request.reviewComment && <p className="text-sm text-gray-500">Comentario del administrador: {request.reviewComment}</p>}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
