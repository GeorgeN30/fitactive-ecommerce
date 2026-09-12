import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useFavorites } from "../context/FavoritesContext";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();

  const valorTotal = favorites.reduce((acc: number, curr: any) => acc + Number(curr.precio || curr.price || 0), 0);

  const limpiarFavoritos = () => {
    favorites.forEach((item: any) => removeFavorite(item.id));
  };

  return (
    <AppLayout>
      <div className="bg-[#f4f7f9] dark:bg-[#0f1115] min-h-screen py-10 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                <i className="fa-solid fa-heart text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"></i>
                Mis Favoritos
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Tus prendas seleccionadas para futuras compras.</p>
            </div>

            {favorites.length > 0 && (
              <button
                onClick={limpiarFavoritos}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <i className="fa-solid fa-trash"></i> Vaciar Lista
              </button>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center min-h-[50vh]">
              <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200 dark:border-white/10 text-gray-300 dark:text-gray-600">
                <i className="fa-regular fa-heart text-5xl"></i>
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Tu lista está vacía</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                Aún no has guardado ninguna prenda. Explora nuestro catálogo y marca el corazón en los productos que más te gusten.
              </p>
              <Link to="/catalogo" className="px-8 py-3 bg-brand-green text-black text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {favorites.map((item: any) => (
                  <div key={item.id} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col relative group">
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="absolute top-6 right-6 z-20 w-8 h-8 bg-white dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <i className="fa-solid fa-heart-crack text-sm"></i>
                    </button>

                    <div className="relative bg-[#f4f5f7] dark:bg-black/20 rounded-xl aspect-[4/5] mb-4 flex items-center justify-center overflow-hidden">
                      <Link to={`/producto/${item.id}`} className="w-full h-full">
                        <img src={item.imagen_url || item.img} alt={item.nombre || item.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                    </div>

                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mb-1">{item.categoria || item.cat}</div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-2 truncate">
                      <Link to={`/producto/${item.id}`}>{item.nombre || item.name}</Link>
                    </h3>
                    <div className="font-black text-lg mb-4 mt-auto text-brand-green">${Number(item.precio || item.price || 0).toFixed(2)}</div>

                    <Link to={`/producto/${item.id}`} className="w-full py-2.5 bg-gray-100 dark:bg-white/5 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 rounded-lg hover:bg-brand-green hover:text-black transition-colors text-center">
                      Ver Producto
                    </Link>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4 xl:col-span-3">
                <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-white/5 sticky top-28">
                  <h3 className="font-black text-sm dark:text-white mb-6 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 pb-4">
                    Resumen de Wishlist
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prendas guardadas</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">{favorites.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Estimado</span>
                      <span className="text-sm font-black text-brand-green">${valorTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-4 mb-6">
                    <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest leading-relaxed text-center">
                      Recuerda que los productos en favoritos no reservan stock. ¡Asegúralos agregándolos al carrito!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}