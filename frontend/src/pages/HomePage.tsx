import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
export default function HomePage() {
  const { user } = useAuth();
  const isInventoryUser = user?.role === "inventory" || user?.role === "receptionist";
  const panelPath = user?.role === "admin" ? "/admin" : isInventoryUser ? "/inventory" : null;
  const panelLabel = user?.role === "admin" ? "Volver al panel admin" : "Volver al panel de inventario";

  return (
    <AppLayout>
      <div className="w-full pb-10 bg-[#f8f9fa] dark:bg-brand-dark-bg text-gray-900 dark:text-white font-sans">
 
        <section className="relative w-full h-[500px] md:h-[600px] bg-gray-900 text-white flex items-center overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full opacity-40 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=2070&auto=format&fit=crop')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
            {panelPath && (
              <Link to={panelPath} className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 text-gray-900 text-xs font-bold rounded-xl mb-5 shadow-lg hover:bg-brand-green transition-colors">
                <i className="fa-solid fa-arrow-left" />
                {panelLabel}
              </Link>
            )}
            <span className="inline-block px-3 py-1 bg-brand-green text-black text-[10px] sm:text-xs font-bold rounded-full mb-4 tracking-wider">
              ✨ PROBADOR VIRTUAL DISPONIBLE
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight">
              Encuentra tu estilo. <br/>
              <span className="text-brand-green">Pruébalo antes de comprar.</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
              Colecciones técnicas de alto rendimiento con tecnología de probador virtual 3D y 2D integrada. El ajuste perfecto garantizado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-6 py-3 bg-brand-green text-black font-bold rounded-md hover:opacity-90 transition shadow-lg shadow-brand-green/20">
                Probar ahora
              </button>
              <Link to="/catalogo" className="px-6 py-3 bg-transparent border border-gray-400 text-white font-bold rounded-md hover:border-white transition text-center flex items-center justify-center">
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-extrabold mb-8 dark:text-white">Explora por deporte</h2>
          <div className="flex flex-wrap justify-center md:justify-between gap-6 md:gap-4">
            {[
              { name: 'Running', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=80' },
              { name: 'Gym', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdEOvdR6yAzYhKRjt4QK6_yG-WgTQyw6wMM3VCEvkJJnOj4hyZo_TT_38&s=10' },
              { name: 'Yoga', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80' },
              { name: 'CrossFit', img: 'https://www.clarin.com/2024/02/19/XKwmLCMfV_1200x0__1.jpg' },
              { name: 'Ciclismo', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&q=80' },
              { name: 'Natación', img: 'https://www.arenaperu.com/arquivos/Mujer-Entrenamiento-Natacion.jpg?v=638011786246170000' }
            ].map((sport, index) => (
              <div key={index} className="flex flex-col items-center group cursor-pointer w-24">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-200 mb-3 border-[3px] border-transparent group-hover:border-brand-green transition-all shadow-sm">
                  <img src={sport.img} alt={sport.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xs md:text-sm font-bold dark:text-gray-200">{sport.name}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="mb-6">
            <span className="text-brand-green text-[10px] font-extrabold tracking-widest uppercase">High Performance</span>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-1 gap-2">
              <h2 className="text-3xl font-extrabold dark:text-white">Productos Destacados</h2>
              <Link to="/catalogo" className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-brand-green flex items-center group">
                Ver todo el catálogo <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { cat: 'Running', name: 'AeroTech Compression Tee', price: '$59.00', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80' },
              { cat: 'Gym', name: 'Apex Performance Shorts', price: '$45.00', img: 'https://thegymking.com/cdn/shop/files/APEXPERFORMANCEVEST_APEXPERFORMANCE5-SHORT-BLACKVST-BOGF2SHR-BOFP88.jpg?v=1773331291&width=3000' },
              { cat: 'Ciclismo', name: 'Nova Carbon Windbreaker', price: '$129.00', img: 'https://i.ebayimg.com/images/g/evQAAeSwz0JqhSjp/s-l1200.webp' },
              { cat: 'CrossFit', name: 'Vortex Weightlifting Shoes', price: '$149.00', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col">
                <div className="relative bg-[#f4f5f7] dark:bg-gray-800 rounded-xl aspect-square mb-4 flex items-center justify-center overflow-hidden">
                  <button className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md text-gray-400 dark:text-gray-300 hover:text-red-500 hover:scale-110 transition-all z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                  <img src={item.img} alt={item.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal" />
                </div>
                <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{item.cat}</div>
                <h3 className="font-extrabold text-gray-900 dark:text-white leading-tight mb-2 truncate">{item.name}</h3>
                <div className="font-black text-xl mb-4 mt-auto dark:text-gray-200">{item.price}</div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition">Ver Detalle</button>
                  <button className="flex-1 py-2 bg-brand-green text-black text-xs font-bold rounded-md hover:opacity-90 transition flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Probar AR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-extrabold mb-8 dark:text-white">Recomendado para ti</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { cat: 'CrossFit', name: 'Conjunto BTS Puma', price: '$180.00', img: 'https://i.pinimg.com/736x/7b/b2/16/7bb216cc21739e5bd18c54062ce2fff9.jpg' },
              { cat: 'Yoga', name: 'Zen Ultra Breathable Crop', price: '$39.00', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkeSL4c-kkVMOsWOqCY2GluDOk_RmKqVXpsBEvyD256LVi7bC8VaDhsYHz&s=10' },
              { cat: 'Ciclismo', name: 'Velo Speed Cycle Bib', price: '$115.00', img: 'https://www.nalini.com/upload/products/B03521801100C000.10_4000_0_XSKINSPEEDBIBSHORT.webp' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-brand-card-dark rounded-2xl p-3 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer border border-gray-100 dark:border-gray-800">
                <div className="w-24 h-24 bg-[#f4f5f7] dark:bg-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={item.img} alt={item.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal" />
                </div>
                <div className="flex-1 pr-2">
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.cat}</div>
                  <h3 className="font-extrabold text-sm leading-tight mb-1 text-gray-800 dark:text-gray-200">{item.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    <span className="text-yellow-400 mr-1 text-sm">★</span> 4.8 <span className="ml-1 text-gray-400">(150)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm dark:text-white">{item.price}</span>
                    <span className="text-brand-green text-xs font-bold hover:underline flex items-center">
                      Probar AR <span className="ml-0.5">&rsaquo;</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-4 pb-12">
          <div className="bg-gradient-to-r from-brand-green/20 to-brand-green/40 dark:from-brand-green/10 dark:to-brand-green/20 rounded-3xl p-8 md:p-10 border border-brand-green/30 flex flex-col md:flex-row items-center justify-between shadow-sm">
            <div className="mb-6 md:mb-0 max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900 dark:text-white tracking-tight">30% OFF en tu primera compra</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base font-medium">
                Usa el código <span className="font-black text-black bg-white dark:bg-gray-800 dark:text-white px-2 py-0.5 rounded shadow-sm mx-1">FITLOOK30</span> al finalizar tu compra para canjear tu descuento. Válido en todo el catálogo AR.
              </p>
            </div>
            <button className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-all hover:shadow-lg w-full md:w-auto whitespace-nowrap active:scale-95">
              Obtener Descuento
            </button>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
