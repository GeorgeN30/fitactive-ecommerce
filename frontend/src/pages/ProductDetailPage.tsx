import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useCart } from '../context/CartContext';
import { useFavorites } from "../context/FavoritesContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('black');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Descripción');

  const products = [
    {
      id: "1",
      cat: "Running",
      name: "AeroTech Compression Tee",
      price: 59,
      img: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80",
    },
    {
      id: "2",
      cat: "Gym",
      name: "Apex Performance Shorts",
      price: 45,
      img: "https://thegymking.com/cdn/shop/files/APEXPERFORMANCEVEST_APEXPERFORMANCE5-SHORT-BLACKVST-BOGF2SHR-BOFP88.jpg?v=1773331291&width=3000",
    },
    {
      id: "3",
      cat: "Ciclismo",
      name: "Nova Carbon Windbreaker",
      price: 129,
      img: "https://i.ebayimg.com/images/g/evQAAeSwz0JqhSjp/s-l1200.webp",
    },
    {
      id: "4",
      cat: "CrossFit",
      name: "Vortex Weightlifting Shoes",
      price: 149,
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    },
    {
      id: "5",
      cat: "Yoga",
      name: "Zen Ultra Breathable Crop",
      price: 39,
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkeSL4c-kkVMOsWOqCY2GluDOk_RmKqVXpsBEvyD256LVi7bC8VaDhsYHz&s=10",
    },
    {
      id: "6",
      cat: "Ciclismo",
      name: "Velo Speed Cycle Bib",
      price: 115,
      img: "https://www.nalini.com/upload/products/B03521801100C000.10_4000_0_XSKINSPEEDBIBSHORT.webp",
    },
    {
      id: "7",
      cat: "CrossFit",
      name: "Conjunto Deportivo BTS",
      price: 180,
      img: "https://i.pinimg.com/736x/7b/b2/16/7bb216cc21739e5bd18c54062ce2fff9.jpg",
    },
    {
      id: "8",
      cat: "Running",
      name: "Breeze Lightweight Jacket",
      price: 75,
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqxQzty-yBDBt2_pX5K-oGapjkhMFQEzXOMKh0PFlKNg&s",
    },
    {
      id: "9",
      cat: "Yoga",
      name: "Lotus Flex Leggings",
      price: 49,
      img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    },
    {
      id: "10",
      cat: "Running",
      name: "Pulse Elite Running Shoes",
      price: 120,
      img: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
    },
    {
      id: "11",
      cat: "Gym",
      name: "PowerLift Compression Pants",
      price: 55,
      img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    },
    {
      id: "12",
      cat: "Ciclismo",
      name: "Aero Sprint Jersey",
      price: 85,
      img: "https://images.unsplash.com/photo-1521503862198-2ae9a997bbc9?w=800&q=80",
    },
  ];
  const product = products.find((item) => item.id === id);
  if (!product) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">
            Producto no encontrado
          </h1>

          <Link
            to="/catalogo"
            className="inline-block mt-4 text-brand-green font-bold"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="bg-white dark:bg-brand-dark-bg min-h-screen py-8 font-sans text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <nav className="flex text-xs font-medium text-gray-500 mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="hover:text-black dark:hover:text-white">Inicio</Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <Link to="/catalogo" className="hover:text-black dark:hover:text-white">Catálogo</Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-900 dark:text-white font-bold">{product.name}</span>
                </div>
              </li>
            </ol>
          </nav>
          <div className="flex flex-col lg:flex-row gap-12 mb-16">

            <div className="w-full lg:w-3/5 flex flex-col-reverse sm:flex-row gap-4">

              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
                {[1, 2, 3, 4].map(idx => (
                  <button key={idx} className={`w-16 h-20 rounded-lg bg-[#f4f5f7] dark:bg-gray-800 flex items-center justify-center border-2 transition-all flex-shrink-0 overflow-hidden ${idx === 1 ? 'border-brand-green' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={`https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=100&q=80&sig=${idx}`} alt="Thumb" className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal" />
                  </button>
                ))}
              </div>

              <div className="flex-1 bg-[#f4f5f7] dark:bg-gray-800 rounded-2xl flex items-center justify-center p-8 overflow-hidden aspect-[4/5] sm:aspect-auto sm:min-h-[600px]">
                <img src={product.img} alt={product.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-700" />
              </div>
            </div>

            <div className="w-full lg:w-2/5 flex flex-col">

              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-brand-green/20 text-brand-green text-[10px] font-black uppercase tracking-wider rounded">
                  IN STOCK
                </span>
                <div className="flex items-center text-xs font-medium">
                  <span className="text-yellow-400 mr-1 text-sm">★</span>
                  <span className="font-bold">4.8</span>
                  <span className="text-gray-400 ml-1 underline cursor-pointer">(124 opiniones)</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">
                {product.name}
              </h1>
              <div className="text-2xl font-black text-gray-900 dark:text-gray-200 mb-6">${product.price.toFixed(2)}</div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Tee de compresión ergonómica diseñada para atletas de alta resistencia. Desarrollada con hilos inteligentes de microfibra que regulan la temperatura corporal en situaciones de alto esfuerzo.
              </p>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Seleccionar Talla</h4>
                  <a href="#" className="text-xs text-gray-500 underline hover:text-black dark:hover:text-white transition">Guía de tallas</a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-10 rounded-md text-sm font-bold flex items-center justify-center transition-all border ${selectedSize === size ? 'bg-brand-green border-brand-green text-black' : 'bg-white dark:bg-brand-card-dark border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-900 dark:hover:border-white'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Color</h4>
                <div className="flex gap-3">
                  {[
                    { id: 'black', color: 'bg-black' },
                    { id: 'gray', color: 'bg-gray-600' },
                    { id: 'light', color: 'bg-gray-300' },
                    { id: 'green', color: 'bg-brand-green' },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === c.id ? 'border-gray-900 dark:border-white p-0.5' : 'border-transparent hover:scale-110'}`}
                    >
                      <span className={`w-full h-full rounded-full ${c.color} border border-gray-200 dark:border-gray-700`}></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-12 flex items-center justify-center text-lg font-medium hover:text-brand-green transition">-</button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-12 flex items-center justify-center text-lg font-medium hover:text-brand-green transition">+</button>
                </div>
                <button
                  onClick={() => {
                    toggleFavorite(product);
                  }}
                  className="w-12 h-12 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-900 dark:hover:border-white transition"
                  title={
                    isFavorite(product.id)
                      ? "Quitar de favoritos"
                      : "Agregar a favoritos"
                  }
                >
                  <svg
                    className={`w-5 h-5 ${isFavorite(product.id)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-500 dark:text-gray-300"
                      }`}
                    fill={isFavorite(product.id) ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
                </div>
                <button
                  onClick={() => {
                    console.log("BOTÓN PRESIONADO");

                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      img: product.img,
                      quantity: quantity,
                      size: selectedSize,
                      color: selectedColor,
                    });

                    alert("Producto agregado al carrito");
                  }}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-all hover:shadow-lg mb-3 flex items-center justify-center"
                >
                  Agregar al Carrito
                </button>

                <button className="w-full py-4 bg-white dark:bg-brand-card-dark border-2 border-brand-green text-brand-green font-bold rounded-xl hover:bg-brand-green hover:text-black transition-all flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Probar virtualmente (AR)
                </button>

              </div>
            </div>

            <div className="mb-16">
              <div className="border-b border-gray-200 dark:border-gray-800 flex gap-8 mb-6">
                {['Descripción', 'Especificaciones', 'Reseñas (124)'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-brand-green"></div>}
                  </button>
                ))}
              </div>

              {activeTab === 'Descripción' && (
                <div className="bg-[#f8f9fa] dark:bg-brand-card-dark rounded-2xl p-6 sm:p-8">
                  <h3 className="font-extrabold text-lg mb-6">Características de Alto Rendimiento</h3>
                  <div className="grid sm:grid-cols-2 gap-y-4 gap-x-12">
                    {[
                      'Compresión muscular optimizada que mejora la circulación sanguínea',
                      'Paneles de mesh transpirable en las zonas de mayor sudoración',
                      'Costuras planas antirozaduras para máxima comodidad',
                      'Tejido elástico de 4 vías que garantiza libertad de movimiento',
                      'Composición: 85% Poliéster Reciclado, 15% Elastano',
                      'Tecnología: AeroDry Moisture Wicking',
                      'Ajuste: Skinny Athletic Fit',
                      'Cuidado: Lavado a máquina frío con colores similares'
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-start">
                        <svg className="w-4 h-4 text-brand-green mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab !== 'Descripción' && (
                <div className="p-8 text-center text-gray-500">
                  Contenido de {activeTab} en desarrollo...
                </div>
              )}
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-extrabold mb-8">Productos Relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: "2", cat: 'Gym', name: 'Apex Performance Shorts', price: '$45.00', img: 'https://images.unsplash.com/photo-1591557304192-35324d271638?w=400&q=80' },
                  { id: "3", cat: 'Ciclismo', name: 'Nova Carbon Windbreaker', price: '$129.00', img: 'https://images.unsplash.com/photo-1622445272461-c458007e63d2?w=400&q=80' },
                  { id: "4", cat: 'CrossFit', name: 'Vortex Weightlifting Shoes', price: '$149.00', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
                  { id: "5", cat: 'Yoga', name: 'Zen Ultra Breathable Crop', price: '$39.00', img: 'https://images.unsplash.com/photo-1608228079968-c76817032b90?w=400&q=80' }
                ].map((item, index) => (
                  <div key={index} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="relative bg-[#f4f5f7] dark:bg-gray-800 rounded-xl aspect-[4/5] mb-4 flex items-center justify-center overflow-hidden">
                      <button
                        onClick={() => {
                          toggleFavorite({
                            id: item.id,
                            cat: item.cat,
                            name: item.name,
                            price: Number(item.price.replace("$", "")),
                            img: item.img,
                          });
                        }}
                        className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:scale-110 transition-all z-10"
                      >
                        <svg
                          className={`w-4 h-4 ${isFavorite(item.id)
                            ? "text-red-500 fill-red-500"
                            : "text-gray-400 dark:text-gray-300"
                            }`}
                          fill={isFavorite(item.id) ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      <Link to={`/producto/${item.id}`} className="w-full h-full">
                        <img src={item.img} alt={item.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-500" />
                      </Link>
                    </div>
                    <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{item.cat}</div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-2 truncate">
                      <Link to={`/producto/${item.id}`}>{item.name}</Link>
                    </h3>
                    <div className="font-black text-lg mb-4 mt-auto dark:text-gray-200">{item.price}</div>
                    <div className="flex gap-2">
                      <Link to={`/producto/${item.id}`} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition text-center flex items-center justify-center">Ver Detalle</Link>
                      <button className="flex-1 py-2 bg-white border border-brand-green text-brand-green text-xs font-bold rounded-md hover:bg-brand-green hover:text-black transition flex items-center justify-center shadow-sm">
                        Probar AR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
    </AppLayout>
  );
}
