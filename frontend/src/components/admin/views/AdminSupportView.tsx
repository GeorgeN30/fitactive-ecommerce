import { useEffect, useState } from "react";
import api from "../../../services/api";
import type { SupportTicket } from "../../../pages/ContactPage";
export default function AdminSupportView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => { try { const { data } = await api.get("/admin/support"); setTickets(data.tickets); setError(""); } catch { setError("No se pudieron cargar las consultas."); } };
  useEffect(() => { void load(); }, []);
  return <div className="max-w-4xl space-y-5 text-gray-900 dark:text-white"><h1 className="text-2xl font-bold">Consultas de soporte</h1><button onClick={() => void load()} className="underline">Actualizar</button>{error && <p role="alert">{error}</p>}
    {!tickets.length && <p>No hay consultas.</p>}{tickets.map((ticket) => <article key={ticket.id} className="p-5 border rounded-xl space-y-3"><h2 className="font-bold">{ticket.subject}</h2><p className="text-xs">Referencia: {ticket.id} · {ticket.status}</p><p>{ticket.message}</p>{ticket.response && <p>Respuesta: {ticket.response}</p>}
      <form onSubmit={async (event) => { event.preventDefault(); if (busy) return; setBusy(true); try { await api.put(`/admin/support/${ticket.id}`, { response: responses[ticket.id], status: "ANSWERED" }); await load(); } catch { setError("No se pudo guardar la respuesta."); } finally { setBusy(false); } }}><textarea aria-label={`Respuesta a ${ticket.subject}`} required maxLength={2000} value={responses[ticket.id] || ""} onChange={(event) => setResponses((current) => ({ ...current, [ticket.id]: event.target.value }))} className="w-full border rounded-lg p-3 bg-transparent" /><button disabled={busy} className="p-3 rounded-lg bg-brand-green text-black">Guardar respuesta</button></form>
    </article>)}
  </div>;
}
