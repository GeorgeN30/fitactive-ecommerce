import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "../../../data/adminPrototypeTypes";
import {
  createDiscountRequest,
  fetchMyDiscountRequests,
  type DiscountRequest,
} from "../../../services/discounts";

interface InventoryDiscountsViewProps {
  products?: Product[];
}

const statusLabel: Record<DiscountRequest["status"], string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  REVERTED: "Revertida",
};

function errorMessage(error: unknown): string {
  const code = (error as { response?: { data?: { error?: string } } })?.response
    ?.data?.error;
  const messages: Record<string, string> = {
    DISCOUNT_REQUEST_ALREADY_PENDING: "Ya existe una solicitud pendiente para esa talla.",
    DISCOUNT_ALREADY_ACTIVE: "Esa talla ya tiene un descuento activo.",
    SIZE_NOT_FOUND: "Una de las tallas ya no está disponible.",
  };
  return messages[code || ""] || "No se pudo registrar la solicitud. Intenta nuevamente.";
}

export default function InventoryDiscountsView({
  products = [],
}: InventoryDiscountsViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState(30);
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<DiscountRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedProductId);

  const loadRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      setRequests(await fetchMyDiscountRequests());
    } catch {
      setFeedback("No se pudo cargar el historial de solicitudes.");
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const availableSizes = useMemo(
    () =>
      (selectedProduct?.sizes || []).filter(
        (size) => (selectedProduct?.stock[size] || 0) > 0,
      ),
    [selectedProduct],
  );

  const requestBySize = useMemo(() => {
    const map = new Map<string, DiscountRequest>();
    for (const request of requests) {
      if (!map.has(request.product.sizeId)) map.set(request.product.sizeId, request);
    }
    return map;
  }, [requests]);

  const totalStock = selectedProduct
    ? Object.values(selectedProduct.stock).reduce((sum, stock) => sum + stock, 0)
    : 0;
  const previewPrice = selectedProduct
    ? (selectedProduct.price * (1 - discountPercent / 100)).toFixed(2)
    : "0.00";

  const toggleSize = (size: string) => {
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size],
    );
  };

  const handleSubmit = async () => {
    if (!selectedProduct || selectedSizes.length === 0 || !reason.trim()) {
      setFeedback("Selecciona al menos una talla e indica el motivo.");
      return;
    }

    const tallaIds = selectedSizes
      .map((size) => selectedProduct.tallaIds?.[size])
      .filter((id): id is string => Boolean(id));
    if (tallaIds.length !== selectedSizes.length) {
      setFeedback("No se encontraron los identificadores de las tallas. Recarga el inventario.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await createDiscountRequest(tallaIds, discountPercent, reason);
      setRequests((current) => [...created, ...current]);
      setSelectedProductId(null);
      setSelectedSizes([]);
      setReason("");
      setFeedback("Solicitud enviada al administrador. Recibirás una notificación con la decisión.");
    } catch (error) {
      setFeedback(errorMessage(error));
      await loadRequests();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in text-gray-900 dark:text-white pb-10 max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-2 gap-8">
      {feedback && (
        <div className="fixed top-5 right-5 z-[60] max-w-sm bg-[#4F46E5] text-white px-5 py-3 rounded-xl font-bold shadow-2xl text-sm">
          {feedback}
          <button className="ml-3 opacity-70 hover:opacity-100" onClick={() => setFeedback("")}>×</button>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Producto</label>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {products.map((product) => {
              const stock = Object.values(product.stock).reduce((sum, value) => sum + value, 0);
              const selected = product.id === selectedProductId;
              return (
                <button type="button" key={product.id} onClick={() => { setSelectedProductId(product.id); setSelectedSizes([]); }} className={`w-full flex items-center gap-4 p-3 rounded-2xl border text-left cursor-pointer transition-all ${selected ? "border-[#4F46E5] bg-[#4F46E5]/5" : "border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700"}`}>
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover bg-white" />
                  <span><span className="text-sm font-bold block">{product.name}</span><span className="text-xs text-gray-500">Stock: {stock} uds. · S/ {product.price.toFixed(2)}</span></span>
                </button>
              );
            })}
            {products.length === 0 && <p className="text-sm text-gray-500">No hay productos cargados.</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Tallas disponibles para solicitar</label>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const tallaId = selectedProduct?.tallaIds?.[size];
              const existing = tallaId ? requestBySize.get(tallaId) : undefined;
              const active = selectedProduct?.discounts?.[size]?.percent;
              const blocked = Boolean(active || existing?.status === "PENDING");
              return (
                <button type="button" key={size} disabled={blocked} onClick={() => toggleSize(size)} title={active ? "Descuento activo" : existing?.status === "PENDING" ? "Solicitud pendiente" : undefined} className={`min-w-12 h-10 px-3 rounded-xl font-bold text-sm transition-colors border ${blocked ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : selectedSizes.includes(size) ? "border-[#4F46E5] bg-[#4F46E5] text-white" : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"}`}>
                  {size}{active ? ` -${active}%` : existing?.status === "PENDING" ? " · …" : ""}
                </button>
              );
            })}
            {!selectedProduct && <span className="text-sm text-gray-400">Selecciona un producto primero.</span>}
            {selectedProduct && availableSizes.length === 0 && <span className="text-sm text-red-500">No hay stock disponible.</span>}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Porcentaje</label>
          <div className="flex flex-wrap gap-2">
            {[10, 15, 20, 25, 30, 40, 50].map((percent) => (
              <button type="button" key={percent} onClick={() => setDiscountPercent(percent)} className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${discountPercent === percent ? "bg-[#4F46E5] text-white shadow-md" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>-{percent}%</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Motivo de la solicitud</label>
          <input type="text" maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej.: baja rotación o fin de temporada" className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#4F46E5] text-sm" />
        </div>

        <div className="bg-[#4F46E5]/5 border border-[#4F46E5]/20 rounded-2xl p-5">
          <p className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider mb-2">Vista previa</p>
          <p className="font-bold">{selectedProduct ? selectedProduct.name : "Selecciona un producto"}</p>
          <p className="text-xs text-gray-500 mt-1">Stock total: {totalStock} uds. · Se solicitará aprobación, no se aplicará todavía.</p>
          <div className="flex items-center gap-2 mt-2"><span className="text-sm text-gray-500 line-through">S/ {selectedProduct?.price.toFixed(2) || "0.00"}</span><span className="text-sm text-gray-400">→</span><span className="text-sm font-bold text-[#4F46E5]">S/ {previewPrice}</span></div>
        </div>

        <button type="button" onClick={() => void handleSubmit()} disabled={submitting || !selectedProduct || selectedSizes.length === 0 || !reason.trim()} className="w-full py-4 rounded-xl bg-[#4F46E5] disabled:bg-[#4F46E5]/50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg hover:bg-[#4338ca]">
          {submitting ? "Enviando solicitud…" : `Solicitar aprobación del ${discountPercent}% (${selectedSizes.length} talla(s))`}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 min-h-[320px]">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-bold">Mis solicitudes</h2><p className="text-xs text-gray-500 mt-1">El estado se actualiza por BaaS y queda registrado en la base de datos.</p></div><button type="button" onClick={() => void loadRequests()} className="text-xs font-bold text-[#4F46E5] hover:underline">Actualizar</button></div>
          {loadingRequests ? <p className="text-sm text-gray-400 py-10 text-center">Cargando historial…</p> : requests.length === 0 ? <p className="text-sm text-gray-400 py-10 text-center">Aún no tienes solicitudes.</p> : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto">
              {requests.map((request) => <div key={request.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800"><div className="flex justify-between gap-3 items-start"><div><p className="font-bold text-sm">{request.product.name} · Talla {request.product.size}</p><p className="text-xs text-gray-500 mt-1">-{request.percent}% · {request.reason}</p></div><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${request.status === "APPROVED" ? "bg-green-100 text-green-700" : request.status === "REJECTED" ? "bg-red-100 text-red-700" : request.status === "REVERTED" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"}`}>{statusLabel[request.status]}</span></div>{request.status === "REVERTED" && <p className="text-xs text-slate-500 mt-2">El administrador retiró el descuento activo.</p>}{request.reviewComment && <p className="text-xs text-gray-500 mt-2">Comentario: {request.reviewComment}</p>}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
