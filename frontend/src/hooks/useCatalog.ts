import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCatalogProducts, type CatalogProduct } from "../services/catalog";

export function useCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const loaded = await fetchCatalogProducts();
      if (mounted.current) { setProducts(loaded); setError(""); }
    } catch {
      if (mounted.current) setError("No se pudo actualizar el catálogo. Intenta nuevamente.");
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onFocus = () => { if (document.visibilityState !== "hidden") void refresh(); };
    const interval = window.setInterval(onFocus, 30_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);
  useEffect(() => {
    const next = products.flatMap((product) => product.tallas.flatMap((size) => [size.discountStartsAt, size.discountEndsAt]))
      .filter((date): date is string => !!date).map(Date.parse).filter((time) => time > Date.now()).sort((a, b) => a - b)[0];
    if (!next) return;
    const timer = window.setTimeout(() => {
      setProducts((current) => [...current]); // Expire the local badge immediately, even if offline.
      void refresh();
    }, Math.min(next - Date.now() + 20, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [products, refresh]);
  return { products, loading, error, refresh };
}
