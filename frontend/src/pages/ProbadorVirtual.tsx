import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

export default function ProbadorVirtual() {
  const [searchParams] = useSearchParams();
  const productoIdUrl = searchParams.get('producto');

  const [genero, setGenero] = useState('Hombre');
  const [medidas, setMedidas] = useState({ pecho: 96, cintura: 82, cadera: 95 });
  const [productos, setProductos] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await api.get('/products');
        const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const productosValidos = Array.isArray(data) ? data : [];
        setProductos(productosValidos);
        
        if (productosValidos.length > 0) {
          if (productoIdUrl) {
            const productoEspecifico = productosValidos.find((p: any) => String(p.id) === String(productoIdUrl));
            if (productoEspecifico) {
              setSelectedProduct(productoEspecifico);
              if (productoEspecifico.genero) {
                setGenero(productoEspecifico.genero);
              }
            } else {
              seleccionarPorDefecto(productosValidos);
            }
          } else {
            seleccionarPorDefecto(productosValidos);
          }
        }
      } catch (error) {
        console.error("Error al cargar productos para el probador:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [productoIdUrl]);

  const seleccionarPorDefecto = (listaValidos: any[]) => {
    const inicialesHombre = listaValidos.filter((p: any) => p.genero?.toLowerCase() === 'hombre');
    if (inicialesHombre.length > 0) {
      setSelectedProduct(inicialesHombre[0]);
    } else if (listaValidos.length > 0) {
      setSelectedProduct(listaValidos[0]);
      setGenero(listaValidos[0].genero || 'Hombre');
    }
  };

  const productosDelGenero = productos.filter(p => p?.genero?.toLowerCase() === genero.toLowerCase());
  const categoriasUnicas = ['Todas', ...Array.from(new Set(productosDelGenero.map(p => p?.categoria))).filter(Boolean)];
  const productosFiltrados = categoriaFiltro === 'Todas' 
    ? productosDelGenero 
    : productosDelGenero.filter(p => p?.categoria === categoriaFiltro);

  const handleCambioGenero = (nuevoGenero: string) => {
    setGenero(nuevoGenero);
    setCategoriaFiltro('Todas');
    
    if (nuevoGenero === 'Mujer') {
      setMedidas({ pecho: 90, cintura: 74, cadera: 98 });
    } else {
      setMedidas({ pecho: 96, cintura: 82, cadera: 95 });
    }
    
    const prodsNuevos = productos.filter(p => p?.genero?.toLowerCase() === nuevoGenero.toLowerCase());
    if (prodsNuevos.length > 0) {
      setSelectedProduct(prodsNuevos[0]);
    } else {
      setSelectedProduct(null);
    }
  };

  const categoriaSeleccionada = (selectedProduct?.categoria || '').toLowerCase();
  const esPrendaInferior = categoriaSeleccionada.includes('buzo') || categoriaSeleccionada.includes('short') || categoriaSeleccionada.includes('legging') || categoriaSeleccionada.includes('pantalón') || categoriaSeleccionada.includes('pantalon');

  const analisis = useMemo(() => {
    if (!selectedProduct || !selectedProduct.producto_tallas) return null;

    const tallas = selectedProduct.producto_tallas;
    if (!Array.isArray(tallas) || tallas.length === 0) return null;

    let tallaIdeal: any = null;
    let mejorDiferencia = Infinity;

    const medidaBase = esPrendaInferior ? medidas.cintura : medidas.pecho;

    tallaIdeal = tallas.find((t: any) => medidaBase >= Number(t.rango_cm_min || 0) && medidaBase <= Number(t.rango_cm_max || 0));

    if (!tallaIdeal) {
      tallas.forEach((t: any) => {
        const min = Number(t.rango_cm_min || 0);
        const max = Number(t.rango_cm_max || 0);
        
        if (min > 0 && max > 0) {
          const centro = (min + max) / 2;
          const diferencia = Math.abs(medidaBase - centro);
          
          if (diferencia < mejorDiferencia) {
            mejorDiferencia = diferencia;
            tallaIdeal = t;
          }
        }
      });
    } else {
      const centro = (Number(tallaIdeal.rango_cm_min || 0) + Number(tallaIdeal.rango_cm_max || 0)) / 2;
      mejorDiferencia = Math.abs(medidaBase - centro);
    }

    if (!tallaIdeal) return null;

    const calcularAjuste = (medidaUsuario: number, min: number, max: number) => {
      const rangoTotal = max - min;
      const posicion = rangoTotal === 0 ? 50 : ((medidaUsuario - min) / rangoTotal) * 100;
      const porcentajeVisual = Math.max(5, Math.min(95, posicion));
      
      let estado = 'Perfecto';
      let color = 'bg-brand-green';
      
      if (medidaUsuario < min - 3) { estado = 'Muy Holgado'; color = 'bg-blue-400'; }
      else if (medidaUsuario <= min + 1) { estado = 'Holgado'; color = 'bg-yellow-400'; }
      else if (medidaUsuario > max + 3) { estado = 'Muy Ajustado'; color = 'bg-red-500'; }
      else if (medidaUsuario >= max - 1) { estado = 'Ajustado'; color = 'bg-orange-400'; }

      return { estado, color, porcentajeVisual };
    };

    const minBase = Number(tallaIdeal.rango_cm_min || 60);
    const maxBase = Number(tallaIdeal.rango_cm_max || 100);
    
    const difCintura = genero === 'Mujer' ? 18 : 12;
    const difCadera = genero === 'Mujer' ? -4 : 2;

    let detallesFitMap = [];

    if (esPrendaInferior) {
      const ajusteCintura = calcularAjuste(medidas.cintura, minBase, maxBase);
      const ajusteCadera = calcularAjuste(medidas.cadera, minBase + 10, maxBase + 10);
      detallesFitMap = [
        { zona: 'Cintura', ...ajusteCintura, cms: medidas.cintura },
        { zona: 'Cadera', ...ajusteCadera, cms: medidas.cadera }
      ];
    } else {
      const ajustePecho = calcularAjuste(medidas.pecho, minBase, maxBase);
      const ajusteCintura = calcularAjuste(medidas.cintura, minBase - difCintura, maxBase - difCintura);
      const ajusteCadera = calcularAjuste(medidas.cadera, minBase - difCadera, maxBase - difCadera);
      detallesFitMap = [
        { zona: 'Pecho / Busto', ...ajustePecho, cms: medidas.pecho },
        { zona: 'Cintura', ...ajusteCintura, cms: medidas.cintura },
        { zona: 'Cadera', ...ajusteCadera, cms: medidas.cadera }
      ];
    }

    const matchScore = Math.max(40, Math.min(99, 100 - (mejorDiferencia * 1.8))).toFixed(0);

    return {
      talla: tallaIdeal.talla || 'M',
      stock: tallaIdeal.stock || 0,
      matchScore,
      detalles: detallesFitMap
    };
  }, [medidas, selectedProduct, genero, esPrendaInferior]);

  const handleMedidaManual = (id: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setMedidas({ ...medidas, [id]: numValue });
  };

  if (cargando) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center font-bold text-xl dark:text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mr-4"></div>
          Iniciando Smart Fit 2D...
        </div>
      </AppLayout>
    );
  }

  const inputsMedidas = [
    { id: 'pecho', label: 'Contorno de Pecho / Busto (cm)', mostrar: !esPrendaInferior },
    { id: 'cintura', label: 'Contorno de Cintura (cm)', mostrar: true },
    { id: 'cadera', label: 'Contorno de Cadera (cm)', mostrar: true }
  ];

  return (
    <AppLayout>
      <div className="bg-[#f4f7f9] dark:bg-[#0f1115] min-h-screen py-10 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <svg className="w-8 h-8 text-brand-green drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
              Smart Fit 2D <span className="text-[10px] font-black bg-brand-green/20 text-brand-green border border-brand-green/30 px-3 py-1 rounded-full uppercase tracking-widest ml-2 align-middle">Beta</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Algoritmo de análisis biométrico cruzado con especificaciones de confección en tiempo real.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
              <h3 className="font-extrabold text-sm dark:text-white mb-6 uppercase tracking-widest text-center border-b border-gray-100 dark:border-white/5 pb-4">Tu Perfil Físico</h3>
              
              <div className="flex justify-center mb-10 relative bg-gray-50/50 dark:bg-black/20 rounded-2xl py-8 overflow-hidden shadow-inner border border-gray-100/50 dark:border-white/5">
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-40 bg-brand-green/10 dark:bg-brand-green/5 blur-3xl rounded-full"></div>
                </div>

                <svg className="w-48 h-64 drop-shadow-2xl transition-all z-10 relative" viewBox="0 0 100 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="48" y="200" width="4" height="40" fill="#CBD5E1" className="dark:fill-gray-700/50" />
                  <ellipse cx="50" cy="235" rx="15" ry="3" fill="#94A3B8" className="dark:fill-gray-800" />
                  <rect x="47" y="20" width="6" height="15" fill="#E2E8F0" className="dark:fill-gray-700/50" />
                  <ellipse cx="50" cy="20" rx="8" ry="3" fill="#94A3B8" className="dark:fill-gray-800" />

                  {genero === 'Hombre' ? (
                    <path d="M42 35 C42 35, 58 35, 58 35 C68 35, 82 45, 85 55 L82 100 L76 160 C76 180, 65 200, 50 200 C35 200, 24 180, 24 160 L18 100 L15 55 C18 45, 32 35, 42 35 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" className="dark:fill-[#1a1d24] dark:stroke-gray-700/50"/>
                  ) : (
                    <path d="M44 35 C44 35, 56 35, 56 35 C64 35, 76 45, 78 55 L70 95 C66 110, 64 120, 68 135 L76 170 C78 185, 65 200, 50 200 C35 200, 22 185, 24 170 L32 135 C36 120, 34 110, 30 95 L22 55 C24 45, 36 35, 44 35 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" className="dark:fill-[#1a1d24] dark:stroke-gray-700/50"/>
                  )}

                  <g className="text-brand-green transition-opacity duration-300">
                    {!esPrendaInferior && (
                      <>
                        <line x1="10" y1="75" x2="90" y2="75" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                        <circle cx="90" cy="75" r="2.5" fill="currentColor" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                        <text x="5" y="72" fontSize="6" fill="currentColor" fontWeight="900" letterSpacing="1">PECHO</text>
                      </>
                    )}

                    <line x1="18" y1="120" x2="82" y2="120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                    <circle cx="82" cy="120" r="2.5" fill="currentColor" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                    <text x="14" y="117" fontSize="6" fill="currentColor" fontWeight="900" letterSpacing="1">CINTURA</text>

                    <line x1="15" y1="160" x2="85" y2="160" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                    <circle cx="85" cy="160" r="2.5" fill="currentColor" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                    <text x="11" y="157" fontSize="6" fill="currentColor" fontWeight="900" letterSpacing="1">CADERA</text>
                  </g>
                </svg>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Género Biométrico</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 p-1 bg-gray-50 dark:bg-black/20">
                    {['Hombre', 'Mujer'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => handleCambioGenero(g)}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${genero === g ? 'bg-white text-gray-900 shadow-sm dark:bg-brand-green dark:text-black' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="transition-all duration-300 space-y-4">
                  {inputsMedidas.map(med => (
                    med.mostrar && (
                      <div key={med.id} className="bg-white dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5 transition-all shadow-sm">
                        <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4 block">{med.label}</label>
                        <div className="flex items-center gap-5">
                          <input 
                            type="range" 
                            min="60" 
                            max="140" 
                            value={medidas[med.id as keyof typeof medidas]}
                            onChange={(e) => setMedidas({...medidas, [med.id]: Number(e.target.value)})}
                            className="flex-1 accent-brand-green cursor-pointer h-1.5 bg-gray-200 rounded-full appearance-none dark:bg-gray-700"
                          />
                          <div className="relative">
                            <input 
                              type="number" 
                              min="60" 
                              max="140" 
                              value={medidas[med.id as keyof typeof medidas] || ''}
                              onChange={(e) => handleMedidaManual(med.id, e.target.value)}
                              className="w-16 px-2 py-2 text-center text-sm font-black border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-black/40 dark:text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-8">
              
              <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">1. Selecciona una prenda</h3>
                  
                  <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                    {categoriasUnicas.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaFiltro(cat)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-[11px] font-bold transition-all cursor-pointer ${categoriaFiltro === cat ? 'bg-brand-green text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 border border-transparent dark:border-white/5'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
                  {productosFiltrados.map(prod => (
                    <button 
                      key={prod.id} 
                      onClick={() => setSelectedProduct(prod)}
                      className={`flex-shrink-0 w-28 h-36 rounded-2xl overflow-hidden border-2 transition-all duration-300 relative bg-gray-50 dark:bg-black/20 cursor-pointer ${selectedProduct?.id === prod.id ? 'border-brand-green scale-105 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-transparent opacity-70 hover:opacity-100 dark:border-white/5'}`}
                    >
                      <img src={prod.imagen_url || prod.img} alt={prod.nombre} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                      {selectedProduct?.id === prod.id && (
                        <div className="absolute inset-0 bg-brand-green/20 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-brand-green text-black rounded-full p-1.5 shadow-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <div className="w-full text-center py-10 text-gray-500 font-bold text-sm bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      No hay productos configurados con tallas para esta selección.
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct && analisis ? (
                <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-white/5 flex-1 flex flex-col md:flex-row gap-10">
                  
                  <div className="w-full md:w-1/3 flex flex-col justify-center items-center">
                    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 dark:bg-black/40 shadow-inner border border-gray-200/50 dark:border-white/5">
                      <img src={selectedProduct.imagen_url || selectedProduct.img} alt={selectedProduct.nombre} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal hover:scale-110 transition-transform duration-1000 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-5">
                        <div className="text-white">
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-green mb-1.5 drop-shadow-md">{selectedProduct.categoria}</p>
                          <h4 className="font-extrabold text-sm leading-snug line-clamp-2 drop-shadow-lg text-gray-50">{selectedProduct.nombre || selectedProduct.name}</h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-10 border-b border-gray-100 dark:border-white/5 pb-8">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Talla Calculada</p>
                        <div className="flex items-center gap-4">
                          <span className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{analisis.talla}</span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border ${Number(analisis.stock) > 0 ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {Number(analisis.stock) > 0 ? 'EN STOCK' : 'AGOTADO'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Precisión</p>
                        <div className="w-16 h-16 rounded-full border-[4px] border-brand-green flex items-center justify-center bg-white dark:bg-[#1a1d24] shadow-[0_0_20px_rgba(16,185,129,0.25)] relative">
                          <span className="text-lg font-black text-gray-900 dark:text-white">{analisis.matchScore}%</span>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-[11px] font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      Mapa de Ajuste (Fit Map)
                    </h4>
                    
                    <div className="space-y-7">
                      {analisis.detalles.map((det: any, idx: number) => (
                        <div key={idx} className="group transition-all duration-300">
                          <div className="flex justify-between items-center text-xs font-bold mb-3">
                            <span className="text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
                              {det.zona} {det.estado !== 'No aplica' && <span className="text-gray-400 dark:text-gray-500 font-medium normal-case ml-1">({det.cms} cm)</span>}
                            </span>
                            <span className={`${det.color.replace('bg-', 'text-')} text-[10px] font-black px-2.5 py-1 rounded-md bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 uppercase tracking-wider`}>
                              {det.estado}
                            </span>
                          </div>
                          {det.estado !== 'No aplica' ? (
                            <>
                              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10 -ml-px"></div>
                                <div 
                                  className={`absolute top-0 bottom-0 w-3 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${det.color} transition-all duration-1000 ease-out`}
                                  style={{ left: `calc(${det.porcentajeVisual}% - 6px)` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                <span>Ajustado</span>
                                <span className="text-brand-green/80">Perfecto</span>
                                <span>Holgado</span>
                              </div>
                            </>
                          ) : (
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full opacity-50"></div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-10">
                      <Link to={`/producto/${selectedProduct.id}`} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver Detalle del Producto
                      </Link>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-white/5 flex-1 flex flex-col items-center justify-center text-center h-full">
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-full mb-5 border border-dashed border-gray-200 dark:border-white/10">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm text-sm">No pudimos analizar esta prenda. Asegúrate de que la base de datos tenga los campos <strong>rango_cm_min</strong> y <strong>rango_cm_max</strong> configurados.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}