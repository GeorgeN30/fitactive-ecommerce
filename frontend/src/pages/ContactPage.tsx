import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export interface SupportTicket { id: string; subject: string; message: string; status: string; response: string | null; created_at: string; }
export default function ContactPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => { try { const { data } = await api.get("/support"); setTickets(data.tickets); } catch { setFeedback("No se pudo cargar tu historial de consultas."); } };
  useEffect(() => {
    let cancelled = false;
    if (userId) void api.get("/support").then(({ data }) => { if (!cancelled) setTickets(data.tickets); }).catch(() => { if (!cancelled) setFeedback("No se pudo cargar tu historial de consultas."); });
    return () => { cancelled = true; };
  }, [userId]);
  return <AppLayout><main className="max-w-3xl mx-auto px-6 py-12 min-h-[60vh] text-gray-900 dark:text-white space-y-6"><h1 className="text-3xl font-bold">Contacto y soporte</h1>
    {!user ? <p><Link to="/login" className="underline">Inicia sesión</Link> para registrar una consulta y consultar su respuesta.</p> : <>
      <p className="text-sm">Tu consulta y las respuestas quedan guardadas en esta página.</p>
      {feedback && <p role="status">{feedback}</p>}
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault(); if (busy) return; setBusy(true); setFeedback("");
        try { const { data } = await api.post("/support", { subject, message }); setTickets((current) => [data.ticket, ...current]); setSubject(""); setMessage(""); setFeedback("Consulta registrada. Puedes seguir su respuesta aquí."); }
        catch { setFeedback("No se pudo registrar la consulta. Intenta nuevamente."); } finally { setBusy(false); }
      }}><label className="block">Asunto<input required minLength={3} maxLength={150} value={subject} onChange={(event) => setSubject(event.target.value)} className="block w-full border rounded-lg p-3 bg-transparent" /></label><label className="block">Mensaje<textarea required minLength={10} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} className="block w-full border rounded-lg p-3 bg-transparent" /></label><button disabled={busy} className="p-3 rounded-lg bg-brand-green text-black disabled:opacity-50">{busy ? "Enviando…" : "Enviar consulta"}</button></form>
      <h2 className="text-xl font-bold">Mis consultas</h2><button onClick={() => void load()} className="underline text-sm">Actualizar historial</button>
      {tickets.length === 0 ? <p>No tienes consultas registradas.</p> : tickets.map((ticket) => <article key={ticket.id} className="border rounded-lg p-4 space-y-2"><h3 className="font-bold">{ticket.subject}</h3><p className="text-xs">{ticket.status === "OPEN" ? "Pendiente" : ticket.status === "ANSWERED" ? "Respondida" : "Cerrada"}</p><p>{ticket.message}</p>{ticket.response && <p className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg">Respuesta: {ticket.response}</p>}</article>)}
    </>}
  </main></AppLayout>;
}
