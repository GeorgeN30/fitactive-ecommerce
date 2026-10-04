import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getVirtualTryOnSessionId, markVirtualTryOnProduct, trackVirtualTryOnEvent } from '../services/virtualTryOn';

import AvatarStage from '../components/ProbadorVirtual/AvatarStage';
import ProductSelector from '../components/ProbadorVirtual/ProductSelector';
import MeasuresTab from '../components/ProbadorVirtual/MeasuresTab';
import OutfitTab from '../components/ProbadorVirtual/OutfitTab';
import AnalyticsPanel from '../components/ProbadorVirtual/AnalyticsPanel';
import IncompatibleModal from '../components/ProbadorVirtual/IncompatibleModal';

export const PRODUCTS_PER_PAGE = 8;
export function paginateProducts<T>(products: T[], page: number, pageSize = PRODUCTS_PER_PAGE): T[] {
  const safePage = Math.max(1, page);
  const startIndex = (safePage - 1) * pageSize;
  return products.slice(startIndex, startIndex + pageSize);
}

export default function ProbadorVirtual() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const productoIdUrl = searchParams.get('producto');

  const [activeTab, setActiveTab] = useState<'Prenda' | 'Medidas' | 'Outfit'>('Prenda');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isUserFemale = user?.genero === 'Femenino' || user?.genero === 'Mujer';
  const defaultAltura = user?.altura || (isUserFemale ? 160 : 175);
  const defaultPecho = user?.medida_pecho || (isUserFemale ? 90 : 100);
  const defaultCintura = user?.medida_cintura || (isUserFemale ? 70 : 85);
  const defaultCadera = user?.medida_cadera || (isUserFemale ? 95 : 95);
  const defaultMuslo = user?.medida_muslo || (isUserFemale ? 55 : 55);

  const [genero, setGenero] = useState(user?.genero === 'Femenino' ? 'Mujer' : (user?.genero || 'Hombre'));
  const [altura, setAltura] = useState(defaultAltura);
  const [medidas, setMedidas] = useState({ pecho: defaultPecho, cintura: defaultCintura, cadera: defaultCadera, muslo: defaultMuslo });
  
  const [productos, setProductos] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [productPage, setProductPage] = useState(1);
  const tryOnSessionId = useRef(getVirtualTryOnSessionId());
  const tryOnStartedAt = useRef(Date.now());
  const reportedProducts = useRef(new Set<string>());

  useEffect(() => {
    void trackVirtualTryOnEvent({ sessionId: tryOnSessionId.current, type: 'session_started', gender: genero }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await api.get('/products');
        const rawData = Array.isArray(response.data) ? response.data : (response.data.products || response.data.data || []);
        const data = rawData.map((item: any) => ({
          ...item,
          imagen_url: item.imagen_url || item.imagenUrl || item.img,
          genero: item.genero === 'male' ? 'Hombre' : item.genero === 'female' ? 'Mujer' : item.genero || 'Unisex',
          categoria: item.categoria || 'General',
          producto_tallas: (item.producto_tallas || item.tallas || []).map((talla: any) => ({
            ...talla, rango_cm_min: talla.rango_cm_min ?? talla.rangoCmMin, rango_cm_max: talla.rango_cm_max ?? talla.rangoCmMax
          })),
        }));

        const mockProducts = [
          {
            id: 'mock-1', nombre: 'Casaca Deportiva Runner', precio: 189.90, genero: 'Hombre', categoria: 'Casacas', 
            imagen_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop',
            producto_tallas: [ { talla: 'S', rango_cm_min: 85, rango_cm_max: 95 }, { talla: 'M', rango_cm_min: 96, rango_cm_max: 105 }, { talla: 'L', rango_cm_min: 106, rango_cm_max: 115 } ]
          },
          {
            id: 'mock-2', nombre: 'Pantalón Training Pro', precio: 129.50, genero: 'Hombre', categoria: 'Pantalones', 
            imagen_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=300&auto=format&fit=crop',
            producto_tallas: [ { talla: 'S', rango_cm_min: 75, rango_cm_max: 82 }, { talla: 'M', rango_cm_min: 83, rango_cm_max: 90 }, { talla: 'L', rango_cm_min: 91, rango_cm_max: 98 } ]
          },
          {
            id: 'mock-3', nombre: 'Top Deportivo Flex', precio: 89.90, genero: 'Mujer', categoria: 'Tops', 
            imagen_url: 'https://images.unsplash.com/photo-1622260614153-03223fb72052?q=80&w=300&auto=format&fit=crop',
            producto_tallas: [ { talla: 'XS', rango_cm_min: 75, rango_cm_max: 82 }, { talla: 'S', rango_cm_min: 83, rango_cm_max: 89 }, { talla: 'M', rango_cm_min: 90, rango_cm_max: 96 } ]
          },
          {
            id: 'mock-4', nombre: 'Leggings High Waist', precio: 119.90, genero: 'Mujer', categoria: 'Leggings', 
            imagen_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=300&auto=format&fit=crop',
            producto_tallas: [ { talla: 'S', rango_cm_min: 65, rango_cm_max: 72 }, { talla: 'M', rango_cm_min: 73, rango_cm_max: 79 }, { talla: 'L', rango_cm_min: 80, rango_cm_max: 88 } ]
          }
        ];

        const baseData = Array.isArray(data) ? data : [];
        const productosValidos = [...baseData, ...mockProducts];
        setProductos(productosValidos);
        if (productosValidos.length > 0) {
          if (productoIdUrl) {
            const productoEspecifico = productosValidos.find((p: any) => String(p.id) === String(productoIdUrl));
            if (productoEspecifico) {
              setSelectedProduct(productoEspecifico);
              if (productoEspecifico.genero) setGenero(productoEspecifico.genero);
            } else {
              seleccionarPorDefecto(productosValidos);
            }
          } else {
            seleccionarPorDefecto(productosValidos);
          }
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [productoIdUrl]);

  const seleccionarPorDefecto = (listaValidos: any[]) => {
    const inicialesHombre = listaValidos.filter((p: any) => ['hombre', 'male'].includes(p.genero?.toLowerCase()));
    if (inicialesHombre.length > 0) setSelectedProduct(inicialesHombre[0]);
    else if (listaValidos.length > 0) {
      setSelectedProduct(listaValidos[0]);
      setGenero(listaValidos[0].genero || 'Hombre');
    }
  };

  const handleSaveMeasures = async () => {
    if (!user) {
      alert("Debes iniciar sesión para guardar tus medidas de forma permanente.");
      return;
    }
    try {
      await api.put('/auth/me', {
        genero: genero,
        altura: altura,
        medida_pecho: medidas.pecho,
        medida_cintura: medidas.cintura,
        medida_cadera: medidas.cadera,
        medida_muslo: medidas.muslo
      });
      alert("¡Tus medidas se han guardado en tu perfil!");
    } catch(err) {
      console.error(err);
    }
  };

  const handleCambioGenero = (nuevoGenero: string) => {
    setGenero(nuevoGenero);
    setCategoriaFiltro('Todas');
    setProductPage(1);

    if (nuevoGenero === 'Mujer') {
      setAltura(160);
      setMedidas({ pecho: 90, cintura: 70, cadera: 95, muslo: 55 });
    } else {
      setAltura(175);
      setMedidas({ pecho: 100, cintura: 85, cadera: 95, muslo: 55 });
    }

    const prodsNuevos = productos.filter(p => {
      const productGender = p?.genero?.toLowerCase();
      return productGender === nuevoGenero.toLowerCase() || (nuevoGenero === 'Hombre' && productGender === 'male') || (nuevoGenero === 'Mujer' && productGender === 'female') || productGender === 'unisex';
    });
    if (prodsNuevos.length > 0) setSelectedProduct(prodsNuevos[0]);
    else setSelectedProduct(null);
  };

  const productosDelGenero = productos.filter(p => p?.genero?.toLowerCase() === genero.toLowerCase() || p?.genero?.toLowerCase() === 'unisex');
  const categoriasUnicas = ['Todas', ...Array.from(new Set(productosDelGenero.map(p => p?.categoria))).filter(Boolean)];
  const productosFiltrados = categoriaFiltro === 'Todas' ? productosDelGenero : productosDelGenero.filter(p => p?.categoria === categoriaFiltro);
  const visibleProducts = paginateProducts(productosFiltrados, productPage);

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
      detallesFitMap = [
        { zona: 'Cintura', ...calcularAjuste(medidas.cintura, minBase, maxBase), cms: medidas.cintura },
        { zona: 'Cadera', ...calcularAjuste(medidas.cadera, minBase + 10, maxBase + 10), cms: medidas.cadera }
      ];
    } else {
      detallesFitMap = [
        { zona: 'Pecho', ...calcularAjuste(medidas.pecho, minBase, maxBase), cms: medidas.pecho },
        { zona: 'Cintura', ...calcularAjuste(medidas.cintura, minBase - difCintura, maxBase - difCintura), cms: medidas.cintura },
        { zona: 'Cadera', ...calcularAjuste(medidas.cadera, minBase - difCadera, maxBase - difCadera), cms: medidas.cadera }
      ];
    }

    const matchScore = Math.max(10, Math.min(99, 100 - (mejorDiferencia * 1.8))).toFixed(0);

    return { talla: tallaIdeal.talla || 'M', stock: tallaIdeal.stock || 0, matchScore, detalles: detallesFitMap };
  }, [medidas, selectedProduct, genero, esPrendaInferior]);

  useEffect(() => {
    if (!selectedProduct || !analisis || reportedProducts.current.has(String(selectedProduct.id))) return;
    const productId = String(selectedProduct.id);
    reportedProducts.current.add(productId);
    markVirtualTryOnProduct(productId);
    trackVirtualTryOnEvent({
      type: 'try_on',
      sessionId: tryOnSessionId.current,
      productId,
      size: String(analisis.talla),
      gender: genero,
      compatibility: Number(analisis.matchScore),
      durationSeconds: Math.max(0, Math.round((Date.now() - tryOnStartedAt.current) / 1000))
    }).catch(() => undefined);
  }, [analisis, genero, selectedProduct]);

  const bodyMetrics = useMemo(() => {
    const isFemale = genero === 'Mujer' || genero === 'Femenino';
    
    const scalePecho = (medidas.pecho || 90) / (isFemale ? 90 : 100);
    const scaleCintura = (medidas.cintura || 70) / (isFemale ? 70 : 85);
    const scaleCadera = (medidas.cadera || 95) / (isFemale ? 95 : 95);
    
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    const baseTorsoScale = clamp((scalePecho * 0.4 + scaleCintura * 0.4 + scaleCadera * 0.2), 0.85, 1.25);
    
    const torsoScaleX = baseTorsoScale;
    const torsoScaleY = 1 + (torsoScaleX - 1) * 0.4; 

    return { spriteScales: { torsoScaleX, torsoScaleY } };
  }, [medidas, genero]);

  const handleAddToCartClick = () => {
    if (!user) {
      alert("Por favor, inicia sesión para añadir prendas a tu carrito.");
      return;
    }

    if (!selectedProduct) return;

    if (analisis && Number(analisis.matchScore) < 50) {
      setIsModalOpen(true);
    } else {
      addToCart({
        id: String(selectedProduct.id),
        name: selectedProduct.nombre,
        price: Number(selectedProduct.precio || 0),
        img: selectedProduct.imagen_url || selectedProduct.img || '',
        quantity: 1,
        size: analisis?.talla || 'M',
        color: selectedProduct.color || 'Unico'
      });
      alert("¡Prenda agregada al carrito con éxito!");
    }
  };

  if (cargando) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center font-bold text-xl dark:text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mr-4"></div>
          Iniciando Probador Virtual v2.0...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-[#f4f7f9] dark:bg-[#0f1115] min-h-screen py-10 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                Probador Virtual 2D
              </h1>
            </div>
            {/* FITLOOK TECHNOLOGY v2.0 text removed per request */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
            
            <div className="lg:col-span-3 bg-white dark:bg-white/[0.02] p-4 lg:p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-white/5 flex flex-col min-h-[400px] lg:h-auto lg:min-h-[600px]">
              <div className="flex gap-2 mb-6 bg-gray-50 dark:bg-black/30 p-1.5 rounded-2xl">
                {['Prenda', 'Medidas', 'Outfit'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-2 text-[11px] font-black uppercase rounded-xl transition-all ${activeTab === tab ? 'bg-brand-green text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'Prenda' && (
                  <ProductSelector 
                    productos={productos} visibleProducts={visibleProducts} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                    genero={genero} handleCambioGenero={handleCambioGenero}
                    categoriaFiltro={categoriaFiltro} setCategoriaFiltro={setCategoriaFiltro} categoriasUnicas={categoriasUnicas}
                  />
                )}
                {activeTab === 'Medidas' && (
                  <MeasuresTab medidas={medidas} setMedidas={setMedidas} altura={altura} setAltura={setAltura} onSave={handleSaveMeasures} />
                )}
                {activeTab === 'Outfit' && (
                  <OutfitTab productos={productos} />
                )}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col min-h-[50vh] lg:min-h-[600px]">
              <AvatarStage 
                bodyMetrics={bodyMetrics} selectedProduct={selectedProduct} genero={genero as any}
              />
            </div>

            <div className="lg:col-span-3 min-h-[400px] lg:h-auto lg:min-h-[600px]">
              <AnalyticsPanel analisis={analisis} medidas={medidas} altura={altura} onEditMeasures={() => setActiveTab('Medidas')} onAddToCart={handleAddToCartClick} />
            </div>

          </div>
        </div>
      </div>

      <IncompatibleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onUpdateMeasures={() => { setIsModalOpen(false); setActiveTab('Medidas'); }}
        onTryOther={() => { setIsModalOpen(false); setActiveTab('Prenda'); }}
        onAddAnyway={() => { 
          setIsModalOpen(false);
          if (selectedProduct) {
            addToCart({
              id: String(selectedProduct.id),
              name: selectedProduct.nombre,
              price: Number(selectedProduct.precio || 0),
              img: selectedProduct.imagen_url || selectedProduct.img || '',
              quantity: 1,
              size: analisis?.talla || 'M',
              color: selectedProduct.color || 'Unico'
            });
            alert("¡Prenda agregada al carrito con éxito (ignorando advertencia)!");
          }
        }}
      />
    </AppLayout>
  );
}
