import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useFavorites } from "../context/FavoritesContext";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <AppLayout>
      <div className="bg-[#f8f9fa] dark:bg-brand-dark-bg min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Mis Favoritos
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {favorites.length} producto{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-800">
              <div className="text-5xl mb-4">♡</div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Aún no tienes favoritos
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Guarda los productos que más te gusten para encontrarlos fácilmente.
              </p>

              <Link
                to="/catalogo"
                className="inline-flex px-6 py-3 bg-brand-green text-black font-bold rounded-xl hover:opacity-90 transition"
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800"
                >

                  <div className="relative bg-[#f4f5f7] dark:bg-gray-800 rounded-xl aspect-[4/5] mb-4 overflow-hidden">

                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md text-red-500 hover:scale-110 transition-all z-10"
                      title="Quitar de favoritos"
                    >
                      ♥
                    </button>

                    <Link
                      to={`/producto/${item.id}`}
                      className="block w-full h-full"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  </div>

                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    {item.cat}
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2">
                    <Link to={`/producto/${item.id}`}>
                      {item.name}
                    </Link>
                  </h3>

                  <div className="font-black text-lg dark:text-gray-200">
                    ${item.price.toFixed(2)}
                  </div>

                  <Link
                    to={`/producto/${item.id}`}
                    className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition text-center flex items-center justify-center"
                  >
                    Ver Detalle
                  </Link>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}