import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import ProfileLayout from "../components/ProfileLayout";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { formatSoles } from "../utils/money";
import { useCatalog } from "../hooks/useCatalog";
import ProductOffer from "../components/ProductOffer";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, removeFavorite } = useFavorites();
  const { products, loading, error, refresh } = useCatalog();

  const content = (
    <div className="bg-[#f8f9fa] dark:bg-brand-dark-bg min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Mis Favoritos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {favorites.length} producto{favorites.length !== 1 ? "s" : ""}{" "}
              guardado{favorites.length !== 1 ? "s" : ""}
            </p>
          </div>

          {!user && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-amber-500"></i>
              <span>Guardado en este navegador. <Link to="/login" className="underline font-bold hover:text-black dark:hover:text-white">Inicia sesión</Link> para sincronizar tus pedidos.</span>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-red-600 mb-4 text-sm font-semibold">
            {error}{" "}
            <button onClick={() => void refresh()} className="underline cursor-pointer">
              Reintentar
            </button>
          </p>
        )}

        {favorites.length === 0 ? (
          <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fa-regular fa-heart"></i>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Aún no tienes favoritos
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Guarda las prendas deportivas que más te gusten para encontrarlas y probarlas fácilmente.
            </p>

            <Link
              to="/catalogo"
              className="inline-flex px-6 py-3 bg-brand-green text-black font-extrabold rounded-xl hover:opacity-90 transition shadow-sm"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favorites.map((item) => {
              const matchedProd = products.find((product) => String(product.id) === String(item.id));
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-brand-card-dark rounded-3xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative bg-[#f4f5f7] dark:bg-gray-800/60 rounded-2xl aspect-[4/5] mb-4 overflow-hidden group">
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md text-red-500 hover:scale-110 transition-all z-10 cursor-pointer"
                        title="Quitar de favoritos"
                        aria-label="Quitar de favoritos"
                      >
                        <i className="fa-solid fa-heart text-sm"></i>
                      </button>

                      <Link
                        to={`/producto/${item.id}`}
                        className="block w-full h-full p-3"
                      >
                        <img
                          src={item.img || "https://placehold.co/400x500"}
                          alt={item.name}
                          className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>

                    <div className="text-[10px] text-gray-400 dark:text-gray-400 font-black uppercase tracking-wider mb-1">
                      {item.cat}
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                      <Link to={`/producto/${item.id}`} className="hover:text-brand-green transition-colors">
                        {item.name}
                      </Link>
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-gray-50 dark:border-gray-800">
                    <div className="font-black text-lg dark:text-gray-200">
                      {matchedProd ? (
                        <ProductOffer product={matchedProd} />
                      ) : (
                        <span className="text-xs text-gray-500">
                          {loading ? "Actualizando precio…" : formatSoles(item.price)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Link
                        to={`/producto/${item.id}`}
                        className="py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 rounded-xl transition text-center flex items-center justify-center"
                      >
                        Ver Detalle
                      </Link>
                      <Link
                        to={`/probador-virtual?producto=${item.id}`}
                        className="py-2 bg-brand-green/20 hover:bg-brand-green text-black text-xs font-black rounded-xl transition text-center flex items-center justify-center gap-1"
                      >
                        <span>Probar 3D</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (user) {
    return <ProfileLayout>{content}</ProfileLayout>;
  }

  return <AppLayout>{content}</AppLayout>;
}
