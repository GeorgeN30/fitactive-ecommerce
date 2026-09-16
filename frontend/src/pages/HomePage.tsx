import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { fetchCatalogProducts, getCatalogPrice, type CatalogProduct } from "../services/catalog";
import { formatSoles } from "../utils/money";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=700&fit=crop&auto=format";

export default function HomePage() {
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isInventoryUser = user?.role === "inventory" || user?.role === "receptionist";
  const panelPath = user?.role === "admin" ? "/admin" : isInventoryUser ? "/inventory" : null;
  const panelLabel = user?.role === "admin" ? "Volver al panel admin" : "Volver al panel de inventario";

  useEffect(() => {
    let cancelled = false;
    void fetchCatalogProducts()
      .then((loaded) => {
        if (!cancelled) setProducts(loaded.filter((product) => product.totalStock > 0));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const featured = products.slice(0, 4);
  const recommended = products.slice(4, 7);

  return (
    <AppLayout>
      <div className="w-full pb-10 bg-[#f8f9fa] dark:bg-brand-dark-bg text-gray-900 dark:text-white font-sans">
        <section className="relative w-full h-[500px] md:h-[600px] bg-gray-900 text-white flex items-center overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=2070&auto=format&fit=crop')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
            {panelPath && <Link to={panelPath} className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 text-gray-900 text-xs font-bold rounded-xl mb-5 shadow-lg hover:bg-brand-green transition-colors"><i className="fa-solid fa-arrow-left" />{panelLabel}</Link>}
            <span className="inline-block px-3 py-1 bg-brand-green text-black text-xs font-bold rounded-full mb-4 tracking-wider">PROBADOR VIRTUAL DISPONIBLE</span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight">Encuentra tu estilo. <br /><span className="text-brand-green">Pruébalo antes de comprar.</span></h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-lg mb-8 leading-tight">Descubre prendas deportivas y consulta sus tallas, disponibilidad y precios actualizados.</p>
            <Link to="/catalogo" className="inline-block px-6 py-3 bg-brand-green text-black font-bold rounded-md hover:opacity-90 transition">Explorar productos</Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-8">
            <div><p className="text-brand-green text-xs font-extrabold tracking-widest uppercase">Catálogo actualizado</p><h2 className="text-3xl font-extrabold">Productos destacados</h2></div>
            <Link to="/catalogo" className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-brand-green">Ver todo el catálogo <i className="fa-solid fa-arrow-right ml-1" /></Link>
          </div>
          {loading && <p className="py-10 text-gray-500">Cargando productos…</p>}
          {error && <p className="py-10 text-red-500">No se pudo cargar el catálogo. Intenta nuevamente.</p>}
          {!loading && !error && featured.length === 0 && <p className="py-10 text-gray-500">Aún no hay productos disponibles.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => {
              const pricing = getCatalogPrice(product);
              const image = product.imagenUrl || FALLBACK_IMAGE;
              return <article key={product.id} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl aspect-square mb-4 overflow-hidden">
                  <Link to={`/producto/${product.id}`}><img src={image} alt={product.nombre} className="object-contain p-3 w-full h-full" /></Link>
                  <button type="button" aria-label={isFavorite(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"} onClick={() => toggleFavorite({ id: product.id, cat: product.categoria || "General", name: product.nombre, price: pricing.price, img: image })} className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md"><i className={`fa-solid fa-heart ${isFavorite(product.id) ? "text-red-500" : "text-gray-400"}`} /></button>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{product.categoria || "General"}</p>
                <h3 className="font-extrabold mb-2 truncate"><Link to={`/producto/${product.id}`}>{product.nombre}</Link></h3>
                <div className="font-black text-xl mb-4 mt-auto">{pricing.discount > 0 && <span className="text-sm text-gray-400 line-through mr-2">{formatSoles(product.precio)}</span>}{formatSoles(pricing.price)}</div>
                <div className="flex gap-2"><Link to={`/producto/${product.id}`} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-center rounded-md">Ver detalle</Link><Link to={`/probador-virtual?producto=${product.id}`} className="flex-1 py-2 bg-brand-green text-black text-xs font-bold text-center rounded-md">Probar AR</Link></div>
              </article>;
            })}
          </div>
        </section>

        {recommended.length > 0 && <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8"><h2 className="text-2xl font-extrabold mb-8">Más productos</h2><div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{recommended.map((product) => <Link key={product.id} to={`/producto/${product.id}`} className="bg-white dark:bg-brand-card-dark rounded-2xl p-3 shadow-sm flex items-center gap-4 border border-gray-100 dark:border-gray-800"><img src={product.imagenUrl || FALLBACK_IMAGE} alt={product.nombre} className="w-24 h-24 rounded-xl object-contain p-2" /><div><p className="text-xs text-gray-500 font-bold uppercase">{product.categoria || "General"}</p><h3 className="font-extrabold text-sm">{product.nombre}</h3><p className="font-black text-sm mt-2">{formatSoles(getCatalogPrice(product).price)}</p></div></Link>)}</div></section>}

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-4 pb-12"><div className="bg-brand-green/20 rounded-3xl p-8 border border-brand-green/30 flex flex-col md:flex-row items-center justify-between gap-5"><div><h2 className="text-3xl font-black mb-2">Descuentos autorizados</h2><p className="text-sm text-gray-700 dark:text-gray-300">Consulta las ofertas vigentes y el precio final de cada talla en el catálogo.</p></div><Link to="/catalogo" className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl whitespace-nowrap">Ver ofertas</Link></div></section>
      </div>
    </AppLayout>
  );
}
