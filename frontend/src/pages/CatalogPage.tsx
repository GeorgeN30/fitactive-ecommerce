import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function CatalogPage() {
  const [selectedGender, setSelectedGender] = useState('Hombre');
  const [selectedSize, setSelectedSize] = useState('M');
  const [inStock, setInStock] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <AppLayout>
      <div className="bg-[#f8f9fa] dark:bg-brand-dark-bg min-h-screen py-8 font-sans text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Catálogo Deportivo
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg dark:text-white">Filtros</h3>
                  <button className="text-[10px] font-bold text-brand-green uppercase tracking-wider hover:underline">
                    Limpiar
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Género</h4>
                  <div className="space-y-2">
                    {['Hombre', 'Mujer', 'Unisex'].map(gender => (
                      <label key={gender} className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedGender(gender)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGender === gender ? 'bg-brand-green border-brand-green' : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-green'}`}>
                          {selectedGender === gender && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium dark:text-gray-300">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Deporte</h4>
                  <div className="space-y-2">
                    {['Running', 'Gym', 'Yoga', 'CrossFit'].map(sport => (
                      <label key={sport} className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 group-hover:border-brand-green transition-colors flex items-center justify-center"></div>
                        <span className="text-sm font-medium dark:text-gray-300">{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>


                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Talla</h4>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center transition-all ${selectedSize === size ? 'bg-brand-green text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Rango de Precio</h4>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 mb-2 relative">
                    <div className="absolute left-1/4 right-1/4 h-full bg-brand-green rounded-full"></div>
                    <div className="absolute left-1/4 -mt-1.5 w-4 h-4 bg-white border-2 border-brand-green rounded-full shadow cursor-pointer"></div>
                    <div className="absolute right-1/4 -mt-1.5 w-4 h-4 bg-white border-2 border-brand-green rounded-full shadow cursor-pointer"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>$20.00</span>
                    <span>$250.00</span>
                  </div>
                </div>

  
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-widest">Solo en Stock</h4>
                  <button 
                    onClick={() => setInStock(!inStock)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${inStock ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${inStock ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>

              </div>
            </aside>

            <div className="flex-1">
            
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-brand-card-dark rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
                  Mostrando <span className="font-bold text-black dark:text-white">6</span> de 48 productos
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ordenar por:</span>
                  <select className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer dark:text-white">
                    <option>Más destacados</option>
                    <option>Precio: Menor a Mayor</option>
                    <option>Precio: Mayor a Menor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { cat: 'Running', name: 'AeroTech Compression Tee', price: '$59.00', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80', stock: 'HIGH STOCK' },
                  { cat: 'Gym', name: 'Apex Performance Shorts', price: '$45.00', img: 'https://thegymking.com/cdn/shop/files/APEXPERFORMANCEVEST_APEXPERFORMANCE5-SHORT-BLACKVST-BOGF2SHR-BOFP88.jpg?v=1773331291&width=3000', stock: 'LOW STOCK', low: true },
                  { cat: 'Ciclismo', name: 'Nova Carbon Windbreaker', price: '$129.00', img: 'https://i.ebayimg.com/images/g/evQAAeSwz0JqhSjp/s-l1200.webp', stock: 'IN STOCK' },
                  { cat: 'CrossFit', name: 'Vortex Weightlifting Shoes', price: '$149.00', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', stock: 'LIMITED' },
                  { cat: 'Yoga', name: 'Zen Ultra Breathable Crop', price: '$39.00', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkeSL4c-kkVMOsWOqCY2GluDOk_RmKqVXpsBEvyD256LVi7bC8VaDhsYHz&s=10', stock: 'IN STOCK' },
                  { cat: 'Ciclismo', name: 'Velo Speed Cycle Bib', price: '$115.00', img: 'https://www.nalini.com/upload/products/B03521801100C000.10_4000_0_XSKINSPEEDBIBSHORT.webp', stock: 'IN STOCK' },
                  { cat: 'CrossFit', name: 'Conjunto Deportivo BTS', price: '$180.00', img: 'https://i.pinimg.com/736x/7b/b2/16/7bb216cc21739e5bd18c54062ce2fff9.jpg', stock: 'HIGH STOCK' },
                  { cat: 'Running', name: 'Breeze Lightweight Jacket', price: '$75.00', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqxQzty-yBDBt2_pX5K-oGapjkhMFQEzXOMKh0PFlKNg&s', stock: 'IN STOCK' },
                  { cat: 'Yoga', name: 'Lotus Flex Leggings', price: '$49.00', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80', stock: 'LOW STOCK', low: true },
                  { cat: 'Running', name: 'Pulse Elite Running Shoes', price: '$120.00', img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80', stock: 'IN STOCK' },
                  { cat: 'Gym', name: 'PowerLift Compression Pants', price: '$55.00', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80', stock: 'HIGH STOCK' },
                  { cat: 'Ciclismo', name: 'Aero Sprint Jersey', price: '$85.00', img: 'https://images.unsplash.com/photo-1521503862198-2ae9a997bbc9?w=400&q=80', stock: 'LIMITED' }
                ].map((item, index) => (
                  <div key={index} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="relative bg-[#f4f5f7] dark:bg-gray-800 rounded-xl aspect-[4/5] mb-4 flex items-center justify-center overflow-hidden">
                      <span className={`absolute top-3 left-3 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white rounded shadow-sm z-10 ${item.low ? 'bg-red-500' : 'bg-gray-900/70 dark:bg-black/50'}`}>
                        {item.stock}
                      </span>
                      <button className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md text-gray-400 dark:text-gray-300 hover:text-red-500 hover:scale-110 transition-all z-10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                      <Link to="/producto/1" className="w-full h-full">
                        <img src={item.img} alt={item.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-500" />
                      </Link>
                    </div>
                    <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{item.cat}</div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-2 truncate">
                      <Link to="/producto/1">{item.name}</Link>
                    </h3>
                    <div className="font-black text-lg mb-3 dark:text-gray-200">{item.price}</div>

                    <div className="flex gap-1 mb-4 mt-auto">
                      {['S', 'M', 'L', 'XL'].map(sz => (
                        <span key={sz} className="w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold text-gray-600 dark:text-gray-300">{sz}</span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Link to="/producto/1" className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition text-center flex items-center justify-center">
                        Ver Detalle
                      </Link>
                      <button className="flex-1 py-2 bg-white border border-brand-green text-brand-green text-xs font-bold rounded-md hover:bg-brand-green hover:text-black transition flex items-center justify-center shadow-sm">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Probar AR
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-10 gap-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 transition shadow-sm"
                >&lsaquo;</button>
                
                {[1, 2, 3].map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md shadow-sm transition font-medium ${currentPage === page ? 'bg-brand-green text-black font-bold' : 'bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 transition shadow-sm"
                >&rsaquo;</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
