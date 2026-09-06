import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Descripción');
  const [producto, setProducto] = useState<any>(null);
  const [relacionados, setRelacionados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [rating, setRating] = useState('4.5');
  const [reviewsCount, setReviewsCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const ordenTallas: Record<string, number> = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5 };

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        setCargando(true);
        const response = await api.get('/products');
        const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const productoEncontrado = data.find((item: any) => String(item.id) === String(id)) || data[0];
        setProducto(productoEncontrado);

        const otrosProductos = data.filter((item: any) => String(item.id) !== String(id)).slice(0, 4);
        setRelacionados(otrosProductos);

        if (productoEncontrado) {
          const strId = String(productoEncontrado.id);
          let hash = 0;
          for (let i = 0; i < strId.length; i++) hash = strId.charCodeAt(i) + ((hash << 5) - hash);
          const pseudoRandomRating = (3.8 + (Math.abs(hash) % 13) * 0.1).toFixed(1);
          setRating(pseudoRandomRating);
          setReviewsCount(15 + (Math.abs(hash) % 336));

          const savedFavs = JSON.parse(localStorage.getItem('fitlook_favs') || '[]');
          setIsFavorite(savedFavs.includes(String(productoEncontrado.id)));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarProducto();
  }, [id]);

  const stockActual = selectedSize 
    ? Number(producto?.producto_tallas?.find((t: any) => t.talla === selectedSize)?.stock || 0) 
    : 0;

  useEffect(() => {
    if (stockActual > 0 && quantity > stockActual) {
      setQuantity(stockActual);
    } else if (stockActual === 0) {
      setQuantity(1);
    }
  }, [selectedSize, stockActual]);

  const toggleFavorite = () => {
    if (!producto) return;
    const currentId = String(producto.id);
    let savedFavs = JSON.parse(localStorage.getItem('fitlook_favs') || '[]');
    
    if (isFavorite) {
      savedFavs = savedFavs.filter((favId: string) => favId !== currentId);
      setIsFavorite(false);
    } else {
      savedFavs.push(currentId);
      setIsFavorite(true);
    }
    localStorage.setItem('fitlook_favs', JSON.stringify(savedFavs));
  };

  if (cargando) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center dark:bg-brand-dark-bg dark:text-white font-bold">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mr-4"></div>
          Cargando detalles...
        </div>
      </AppLayout>
    );
  }

  if (!producto) return null;

  const tallasDisponibles = (producto.producto_tallas || [])
    .filter((t: any) => Number(t.stock) > 0)
    .sort((a: any, b: any) => (ordenTallas[a.talla] || 99) - (ordenTallas[b.talla] || 99));

  const esMujer = producto?.genero?.toLowerCase() === 'mujer';
  const guiaTallas = esMujer ? [
    { t: 'S', p: '83-90', c: '67-74', ca: '91-98' },
    { t: 'M', p: '90-97', c: '74-81', ca: '98-105' },
    { t: 'L', p: '97-104', c: '81-88', ca: '105-112' },
    { t: 'XL', p: '104-114', c: '88-98', ca: '112-120' },
    { t: 'XXL', p: '114-124', c: '98-108', ca: '120-128' }
  ] : [
    { t: 'S', p: '88-96', c: '73-81', ca: '88-96' },
    { t: 'M', p: '96-104', c: '81-89', ca: '96-104' },
    { t: 'L', p: '104-112', c: '89-97', ca: '104-112' },
    { t: 'XL', p: '112-124', c: '97-109', ca: '112-120' },
    { t: 'XXL', p: '124-136', c: '109-121', ca: '120-128' }
  ];

  return (
    <AppLayout>
      <div className="bg-[#f4f7f9] dark:bg-[#0f1115] min-h-screen py-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8">
            <Link to="/" className="hover:text-brand-green">Inicio</Link>
            <span className="mx-3 opacity-50">/</span>
            <Link to="/catalogo" className="hover:text-brand-green">Catálogo</Link>
            <span className="mx-3 opacity-50">/</span>
            <span className="text-gray-900 dark:text-white truncate max-w-[200px]">{producto.nombre}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-12 mb-16">
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="w-full max-w-lg bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden aspect-[4/5]">
                <img src={producto.imagen_url || producto.img} alt={producto.nombre} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-700" />
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-black uppercase tracking-wider rounded-md">
                  IN STOCK
                </span>
                <div className="flex items-center text-xs font-bold">
                  <span className="text-yellow-400 mr-1 text-sm">★</span> 
                  <span className="text-gray-900 dark:text-white">{rating}</span> 
                  <span className="text-gray-400 ml-1">({reviewsCount} opiniones)</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">
                {producto.nombre || producto.name}
              </h1>
              <div className="text-2xl font-black text-brand-green mb-6">${producto.precio || producto.price}</div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                {producto.descripcion || 'Prenda de alto rendimiento diseñada para maximizar tu potencial.'}
              </p>

              <div className="mb-8 p-5 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Seleccionar Talla</h4>
                  <button onClick={() => setIsSizeModalOpen(true)} className="text-[10px] text-gray-400 hover:text-brand-green uppercase tracking-widest font-bold transition">
                    Guía de tallas
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {tallasDisponibles.length > 0 ? (
                    tallasDisponibles.map((t: any) => (
                      <button 
                        key={t.talla}
                        onClick={() => setSelectedSize(prev => prev === t.talla ? null : t.talla)}
                        className={`w-12 h-12 rounded-xl text-sm font-black flex items-center justify-center transition-all border-2 ${selectedSize === t.talla ? 'bg-brand-green border-brand-green text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-brand-green/50 hover:text-brand-green'}`}
                      >
                        {t.talla}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-red-500">Agotado temporalmente</span>
                  )}
                </div>
                {selectedSize && (
                  <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
                    Stock disponible: <span className="text-brand-green">{stockActual} unidades</span>
                  </p>
                )}
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/20 h-14 w-32">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="flex-1 h-full flex items-center justify-center text-lg font-medium text-gray-500 hover:text-brand-green disabled:opacity-30 transition">-</button>
                  <span className="w-8 text-center font-black text-gray-900 dark:text-white">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(stockActual, quantity + 1))} disabled={!selectedSize || quantity >= stockActual} className="flex-1 h-full flex items-center justify-center text-lg font-medium text-gray-500 hover:text-brand-green disabled:opacity-30 transition">+</button>
                </div>
                <button 
                  onClick={toggleFavorite}
                  className={`w-14 h-14 flex items-center justify-center border-2 rounded-xl transition-all ${isFavorite ? 'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-red-500 hover:text-red-500'}`}
                >
                  <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFavorite ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
              </div>

              <button className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all mb-4 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Agregar al Carrito
              </button>

              <Link to="/probador-virtual" className="w-full py-4 bg-transparent border-2 border-brand-green text-brand-green text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-green hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Probar virtualmente (AR)
              </Link>
            </div>
          </div>

          <div className="mb-16">
            <div className="flex gap-8 mb-6 border-b border-gray-200 dark:border-white/5">
              {['Descripción', 'Especificaciones'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>}
                </button>
              ))}
            </div>

            {activeTab === 'Descripción' && (
              <div className="bg-white dark:bg-white/[0.02] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium whitespace-pre-line">
                  {producto.descripcion || 'Sin descripción detallada.'}
                </p>
              </div>
            )}
            
            {activeTab === 'Especificaciones' && (
              <div className="bg-white dark:bg-white/[0.02] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoría</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{producto.categoria || 'General'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marca</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{producto.marca || 'No especificada'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Género</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{producto.genero || 'Unisex'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black dark:text-white uppercase tracking-widest">
                  Guía de Tallas
                </h3>
                <button onClick={() => setIsSizeModalOpen(false)} className="text-gray-400 hover:text-brand-green transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
                <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-[10px] font-black text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-300 tracking-widest">
                    <tr>
                      <th className="px-5 py-4">Talla</th>
                      <th className="px-5 py-4">Pecho</th>
                      <th className="px-5 py-4">Cintura</th>
                      <th className="px-5 py-4">Cadera</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {guiaTallas.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-black text-brand-green">{row.t}</td>
                        <td className="px-5 py-4">{row.p}</td>
                        <td className="px-5 py-4">{row.c}</td>
                        <td className="px-5 py-4">{row.ca}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}