import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "../services/api";

export const DEFAULT_STORE_SETTINGS = { storeName: "FITLOOK Perú", email: "", tax: 18, tolerance: "Moderado", hqRender: false, limit: 50, twoFactor: false, timeout: 30 };
export type StoreSettings = typeof DEFAULT_STORE_SETTINGS;
const Context = createContext(DEFAULT_STORE_SETTINGS);
export function useStoreSettings() { return useContext(Context); }
export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS);
  useEffect(() => {
    let mounted = true;
    const load = () => void api.get("/store-settings").then(({ data }) => { if (mounted) setSettings({ ...DEFAULT_STORE_SETTINGS, ...data.settings }); }).catch(() => undefined);
    load(); window.addEventListener("store-settings-updated", load);
    const timer = window.setInterval(load, 60_000);
    return () => { mounted = false; window.removeEventListener("store-settings-updated", load); window.clearInterval(timer); };
  }, []);
  return <Context.Provider value={settings}>{children}</Context.Provider>;
}
