import { useMemo, useState } from "react";

type MockReturnStatus = "PENDING" | "APPROVED" | "REJECTED";
type ReturnFilter = MockReturnStatus | "ALL";

interface MockReturnRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  requestedAt: string;
  total: number;
  reason: string;
  items: string[];
  status: MockReturnStatus;
  evidence: string | null;
  adminComment?: string;
}

const INITIAL_REQUESTS: MockReturnRequest[] = [
  {
    id: "return-001",
    orderNumber: "ORD-2026-00841",
    customerName: "Valeria Torres",
    customerEmail: "valeria.torres@example.com",
    requestedAt: "16/09/2026 09:42",
    total: 189.8,
    reason: "La talla no corresponde a la medida seleccionada.",
    items: ["AeroTech Compression Tee · Talla M · 1 unidad", "Alpha Knit Runner · Talla 39 · 1 unidad"],
    status: "PENDING",
    evidence: "Foto de referencia adjunta (mock)",
  },
  {
    id: "return-002",
    orderNumber: "ORD-2026-00836",
    customerName: "Diego Salazar",
    customerEmail: "diego.salazar@example.com",
    requestedAt: "15/09/2026 16:20",
    total: 74.9,
    reason: "El producto llegó con una costura abierta.",
    items: ["Apex Performance Shorts · Talla L · 1 unidad"],
    status: "PENDING",
    evidence: "Foto de referencia adjunta (mock)",
  },
  {
    id: "return-003",
    orderNumber: "ORD-2026-00812",
    customerName: "Sofia Montenegro",
    customerEmail: "sofia.montenegro@example.com",
    requestedAt: "12/09/2026 11:05",
    total: 129.9,
    reason: "Solicitud aprobada por cambio de talla.",
    items: ["Nova Carbon Windbreaker · Talla S · 1 unidad"],
    status: "APPROVED",
    evidence: null,
    adminComment: "Aprobada como cambio de talla.",
  },
  {
    id: "return-004",
    orderNumber: "ORD-2026-00798",
    customerName: "Alejandro Ruiz",
    customerEmail: "alejandro.ruiz@example.com",
    requestedAt: "08/09/2026 14:18",
    total: 59,
    reason: "El cliente solicitó devolver el producto sin detalle adicional.",
    items: ["Apex Performance Shorts · Talla M · 1 unidad"],
    status: "REJECTED",
    evidence: null,
    adminComment: "La solicitud fue presentada fuera del plazo definido.",
  },
];

const STATUS_LABELS: Record<ReturnFilter, string> = {
  ALL: "Todas",
  PENDING: "Pendientes",
  APPROVED: "Aprobadas",
  REJECTED: "Rechazadas",
};

const STATUS_STYLES: Record<MockReturnStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminReturnsView() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [filter, setFilter] = useState<ReturnFilter>("PENDING");
  const [comments, setComments] = useState<Record<string, string>>({});

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (request) => filter === "ALL" || request.status === filter,
      ),
    [filter, requests],
  );

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.status === "PENDING").length,
      approved: requests.filter((request) => request.status === "APPROVED").length,
      rejected: requests.filter((request) => request.status === "REJECTED").length,
    }),
    [requests],
  );

  function reviewRequest(id: string, status: Exclude<MockReturnStatus, "PENDING">) {
    const comment = comments[id]?.trim();
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              adminComment:
                comment ||
                (status === "APPROVED"
                  ? "Solicitud aprobada en el mock."
                  : "Solicitud rechazada en el mock."),
            }
          : request,
      ),
    );
    setComments((current) => ({ ...current, [id]: "" }));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10 text-gray-900 dark:text-white animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Devoluciones</h1>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300">
              Mock
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Revisa solicitudes de devolución y registra una decisión de prueba.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as ReturnFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                filter === value
                  ? "bg-[#00E87A] text-black"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
              }`}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-200">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-flask mt-0.5" aria-hidden="true" />
          <p>
            Esta vista es demostrativa: sus datos y decisiones no se guardan en la base de datos.
            Mercado Pago, reembolsos y reposición de stock se implementarán en una fase posterior.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Solicitudes", counts.total, "fa-rotate-left", "text-indigo-500"],
          ["Pendientes", counts.pending, "fa-clock", "text-amber-500"],
          ["Aprobadas", counts.approved, "fa-check", "text-emerald-500"],
          ["Rechazadas", counts.rejected, "fa-xmark", "text-red-500"],
        ].map(([label, value, icon, color]) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {label}
              </span>
              <i className={`fa-solid ${icon} ${color}`} aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-zinc-700">
            No hay solicitudes en este filtro.
          </div>
        ) : (
          filteredRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-300">
                    <i className="fa-solid fa-box-open" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{request.orderNumber}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {request.customerName} · {request.customerEmail}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">Solicitada: {request.requestedAt}</p>
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-xs uppercase tracking-wider text-gray-400">Total del pedido</p>
                  <p className="text-xl font-black text-[#00B85C] dark:text-[#00E87A]">S/ {request.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 dark:border-zinc-800 lg:grid-cols-[1fr_1fr]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Motivo</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{request.reason}</p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Productos</p>
                  <ul className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {request.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <i className="fa-solid fa-circle-check mt-1 text-[10px] text-[#00B85C] dark:text-[#00E87A]" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-zinc-950/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Evidencia</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {request.evidence || "No adjunta"}
                  </p>
                  {request.adminComment && (
                    <>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Comentario registrado</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{request.adminComment}</p>
                    </>
                  )}
                </div>
              </div>

              {request.status === "PENDING" && (
                <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800 sm:flex-row">
                  <input
                    value={comments[request.id] || ""}
                    onChange={(event) =>
                      setComments((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                    maxLength={255}
                    placeholder="Comentario opcional"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#00E87A] dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => reviewRequest(request.id, "REJECTED")}
                    className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                  >
                    <i className="fa-solid fa-xmark mr-2" aria-hidden="true" />
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewRequest(request.id, "APPROVED")}
                    className="rounded-lg bg-[#00E87A] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#00c96b]"
                  >
                    <i className="fa-solid fa-check mr-2" aria-hidden="true" />
                    Aprobar
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
