import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "../../../context/StoreSettingsContext";

export default function AdminSettingsView() {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [original, setOriginal] = useState(DEFAULT_STORE_SETTINGS);
  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/settings"); setSettings(data.settings); setOriginal(data.settings); setFailed(false); setMessage(""); }
    catch { setFailed(true); setMessage("No se pudo cargar la configuración."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const change = (key: keyof StoreSettings, value: string | boolean | number) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async () => {
    const patch = Object.fromEntries(Object.entries(settings).filter(([key, value]) => original[key as keyof StoreSettings] !== value));
    if (!Object.keys(patch).length) { setMessage("No hay cambios por guardar."); return; }
    setSaving(true); setMessage("");
    try { const { data } = await api.put("/admin/settings", patch); setSettings(data.settings); setOriginal(data.settings); window.dispatchEvent(new Event("store-settings-updated")); setMessage("Cambios guardados en la base de datos."); }
    catch (err) { const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error; setMessage(code === "STAFF_MFA_NOT_READY" ? "Todos los usuarios de staff activos deben configurar 2FA antes de exigirlo." : "No se pudo guardar. Revisa los valores e inténtalo de nuevo."); }
    finally { setSaving(false); }
  };
  const fields: { key: keyof StoreSettings; label: string; min?: number; max?: number }[] = [
    { key: "storeName", label: "Nombre de la tienda" }, { key: "email", label: "Correo de contacto" },
    { key: "tax", label: "IGV incluido en los precios (%)", min: 0, max: 30 },
    { key: "limit", label: "Sesiones del probador por IP al día", min: 1, max: 1000 },
    { key: "timeout", label: "Duración máxima de sesión (minutos)", min: 5, max: 1440 },
  ];
  return <div className="max-w-3xl space-y-6 text-gray-900 dark:text-white pb-10"><h1 className="text-2xl font-bold">Configuración del Panel</h1>
    <p className="text-sm text-gray-500">Los ajustes se persisten y se aplican a la tienda. Los precios incluyen IGV; no se añade un segundo impuesto al pagar.</p>
    {message && <p role="status" className="p-3 border rounded-lg">{message}</p>}
    {loading ? <p>Cargando…</p> : failed ? <button onClick={() => void load()} className="underline">Reintentar</button> : <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-5 bg-white dark:bg-zinc-900 rounded-2xl p-6">
      {fields.map((field) => <label key={field.key} className="block text-sm font-bold">{field.label}<input type={typeof settings[field.key] === "number" ? "number" : field.key === "email" ? "email" : "text"} min={field.min} max={field.max} step={field.key === "tax" ? "0.01" : "1"} maxLength={field.key === "storeName" ? 100 : 255} required={field.key !== "email"} value={String(settings[field.key])} onChange={(event) => change(field.key, typeof settings[field.key] === "number" ? Number(event.target.value) : event.target.value)} className="block mt-2 w-full border rounded-lg p-3 bg-transparent" /></label>)}
      <label className="block text-sm font-bold">Tolerancia del probador<select value={settings.tolerance} onChange={(event) => change("tolerance", event.target.value)} className="block mt-2 w-full border rounded-lg p-3 dark:bg-zinc-900">{["Estricto", "Moderado", "Flexible"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="flex gap-2"><input type="checkbox" checked={settings.hqRender} onChange={(event) => change("hqRender", event.target.checked)} />Renderizado 3D de alta calidad</label>
      <label className="flex gap-2"><input type="checkbox" checked={settings.twoFactor} onChange={(event) => change("twoFactor", event.target.checked)} />Exigir 2FA al personal</label>
      <p className="text-xs text-gray-500">El límite de sesión se aplica a nuevos tokens y al cierre por inactividad. Pagos: Mercado Pago · Moneda: PEN. Las credenciales se administran en el servidor.</p>
      <Link to="/configuracion" className="block text-sm underline">Seguridad de mi cuenta</Link>
      <button disabled={saving} className="px-5 py-3 bg-brand-green text-black font-bold rounded-xl disabled:opacity-50">{saving ? "Guardando…" : "Guardar cambios"}</button>
    </form>}
  </div>;
}
