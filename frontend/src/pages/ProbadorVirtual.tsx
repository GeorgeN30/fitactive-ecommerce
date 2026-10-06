import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { paginateProducts, PRODUCTS_PER_PAGE } from '../utils/productPagination';
import { getVirtualTryOnSessionId, markVirtualTryOnProduct, trackVirtualTryOnEvent } from '../services/virtualTryOn';

import ProductSelector from '../components/ProbadorVirtual/ProductSelector';
import MeasuresTab from '../components/ProbadorVirtual/MeasuresTab';
import OutfitTab from '../components/ProbadorVirtual/OutfitTab';
import AnalyticsPanel from '../components/ProbadorVirtual/AnalyticsPanel';
import IncompatibleModal from '../components/ProbadorVirtual/IncompatibleModal';

const AvatarStage = lazy(() => import('../components/ProbadorVirtual/AvatarStage'));

function normalizeGender(value?: string | null): 'Hombre' | 'Mujer' | 'Unisex' {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'male' || normalized === 'hombre' || normalized === 'masculino') return 'Hombre';
  if (normalized === 'female' || normalized === 'mujer' || normalized === 'femenino') return 'Mujer';
  return 'Unisex';
}

export default function ProbadorVirtual() {
  const { user, updateProfile } = useAuth();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const productoIdUrl = searchParams.get('producto');

  const [activeTab, setActiveTab] = useState<'Prenda' | 'Medidas' | 'Outfit'>('Prenda');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isUserFemale = normalizeGender(user?.genero) === 'Mujer';
  const defaultAltura = user?.altura || (isUserFemale ? 160 : 175);
  const defaultPecho = user?.medida_pecho || (isUserFemale ? 90 : 100);
  const defaultCintura = user?.medida_cintura || (isUserFemale ? 70 : 85);
  const defaultCadera = user?.medida_cadera || (isUserFemale ? 95 : 95);
  const defaultMuslo = user?.medida_muslo || (isUserFemale ? 55 : 55);

  const [genero, setGenero] = useState<'Hombre' | 'Mujer'>(isUserFemale ? 'Mujer' : 'Hombre');
  const [altura, setAltura] = useState(defaultAltura);
  const [medidas, setMedidas] = useState({ pecho: defaultPecho, cintura: defaultCintura, cadera: defaultCadera, muslo: defaultMuslo });
  
  const [productos, setProductos] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [productPage, setProductPage] = useState(1);
  const [tryOnSessionId] = useState(() => getVirtualTryOnSessionId());
  const [tryOnStartedAt] = useState(() => Date.now());
  const initialGender = useRef(genero);
  const reportedProducts = useRef(new Set<string>());

  function seleccionarPorDefecto(listaValidos: any[]) {
    const firstProduct = listaValidos.find((product) => product.genero === 'Hombre') || listaValidos[0];
    if (!firstProduct) return;
    setSelectedProduct(firstProduct);
    if (firstProduct.genero === 'Hombre' || firstProduct.genero === 'Mujer') {
      setGenero(firstProduct.genero);
    }
  }

  useEffect(() => {
    void trackVirtualTryOnEvent({ sessionId: tryOnSessionId, type: 'session_started', gender: initialGender.current }).catch(() => undefined);
  }, [tryOnSessionId]);

  useEffect(() => {
    let cancelled = false;
    const cargarDatos = async () => {
      try {
        const response = await api.get('/products');
        const responseData = response.data as { products?: unknown[]; data?: unknown[] } | unknown[];
        const rawData = Array.isArray(responseData)
          ? responseData
          : responseData.products || responseData.data || [];
        const data = rawData.map((item: any) => ({
          ...item,
          imagen_url: item.imagen_url || item.imagenUrl || item.img,
          genero: normalizeGender(item.genero),
          categoria: item.categoria || 'General',
          producto_tallas: (item.producto_tallas || item.tallas || []).map((talla: any) => ({
            ...talla, rango_cm_min: talla.rango_cm_min ?? talla.rangoCmMin, rango_cm_max: talla.rango_cm_max ?? talla.rangoCmMax
          })),
        }));

        const productosValidos = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setProductos(productosValidos);
        if (productosValidos.length > 0) {
          if (productoIdUrl) {
            const productoEspecifico = productosValidos.find((p: any) => String(p.id) === String(productoIdUrl));
            if (productoEspecifico) {
              setSelectedProduct(productoEspecifico);
              if (productoEspecifico.genero === 'Hombre' || productoEspecifico.genero === 'Mujer') setGenero(productoEspecifico.genero);
            } else {
              setSelectedProduct(null);
            }
          } else {
            seleccionarPorDefecto(productosValidos);
          }
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
        if (!cancelled) setLoadError('No se pudieron cargar los productos del catálogo. Inténtalo de nuevo más tarde.');
      } finally {
        if (!cancelled) setCargando(false);
      }
    };
    void cargarDatos();
    return () => {
      cancelled = true;
    };
  }, [productoIdUrl]);

  const handleSaveMeasures = async () => {
    if (!user) {
      alert("Debes iniciar sesión para guardar tus medidas de forma permanente.");
      return;
    }
    try {
      await updateProfile({
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
    const nextGender = nuevoGenero === 'Mujer' ? 'Mujer' : 'Hombre';
    setGenero(nextGender);
    setCategoriaFiltro('Todas');
    setProductPage(1);

    if (nuevoGenero === 'Mujer') {
      setAltura(160);
      setMedidas({ pecho: 90, cintura: 70, cadera: 95, muslo: 55 });
    } else {
      setAltura(175);
      setMedidas({ pecho: 100, cintura: 85, cadera: 95, muslo: 55 });
    }

    const prodsNuevos = productos.filter(p => p?.genero === nextGender || p?.genero === 'Unisex');
    if (prodsNuevos.length > 0) setSelectedProduct(prodsNuevos[0]);
    else setSelectedProduct(null);
  };

  const productosDelGenero = productos.filter(p => p?.genero === genero || p?.genero === 'Unisex');
  const categoriasUnicas = ['Todas', ...Array.from(new Set(productosDelGenero.map(p => p?.categoria))).filter(Boolean)];
  const productosFiltrados = categoriaFiltro === 'Todas' ? productosDelGenero : productosDelGenero.filter(p => p?.categoria === categoriaFiltro);
  const pageCount = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTS_PER_PAGE));
  const currentProductPage = Math.min(productPage, pageCount);
  const firstProductIndex = productosFiltrados.length === 0 ? 0 : (currentProductPage - 1) * PRODUCTS_PER_PAGE + 1;
  const lastProductIndex = Math.min(currentProductPage * PRODUCTS_PER_PAGE, productosFiltrados.length);
  const visibleProducts = paginateProducts(productosFiltrados, currentProductPage);
  const handleCategoryFilterChange = (category: string) => {
    setCategoriaFiltro(category);
    setProductPage(1);
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
    void trackVirtualTryOnEvent({
      type: 'try_on',
      sessionId: tryOnSessionId,
      productId,
      size: String(analisis.talla),
      gender: genero,
      compatibility: Number(analisis.matchScore),
      durationSeconds: Math.max(0, Math.round((Date.now() - tryOnStartedAt) / 1000))
    }).catch(() => undefined);
  }, [analisis, genero, selectedProduct, tryOnSessionId, tryOnStartedAt]);

  const bodyMetrics = useMemo(() => {
    const isFemale = genero === 'Mujer';
    
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

    const selectedSize = selectedProduct.talla_sugerida || analisis?.talla;
    const selectedVariant = selectedProduct.producto_tallas?.find(
      (variant: any) => String(variant.talla) === String(selectedSize),
    );
    if (!selectedVariant || !selectedVariant.id) {
      alert("Selecciona una talla disponible del producto.");
      return;
    }
    if (Number(selectedVariant.stock) <= 0) {
      alert("La talla seleccionada está agotada.");
      return;
    }

    if (analisis && Number(analisis.matchScore) < 50) {
      setIsModalOpen(true);
    } else {
      addToCart({
        id: String(selectedProduct.id),
        name: selectedProduct.nombre,
        price: Number(selectedProduct.precio || 0),
        img: selectedProduct.imagen_url || selectedProduct.img || '',
        quantity: 1,
        size: selectedSize,
        color: selectedProduct.color || 'Unico',
        stock: Number(selectedVariant.stock),
        tallaId: String(selectedVariant.id),
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
                Probador Virtual 3D
              </h1>
            </div>
            {/* FITLOOK TECHNOLOGY v2.0 text removed per request */}
          </div>

          {loadError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {loadError}
            </p>
          )}

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
                    visibleProducts={visibleProducts} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                    genero={genero} handleCambioGenero={handleCambioGenero}
                    categoriaFiltro={categoriaFiltro} setCategoriaFiltro={handleCategoryFilterChange} categoriasUnicas={categoriasUnicas}
                    currentPage={currentProductPage} pageCount={pageCount} onPageChange={setProductPage}
                    totalProducts={productosFiltrados.length} firstProductIndex={firstProductIndex} lastProductIndex={lastProductIndex}
                  />
                )}
                {activeTab === 'Medidas' && (
                  <MeasuresTab medidas={medidas} setMedidas={setMedidas} altura={altura} setAltura={setAltura} onSave={handleSaveMeasures} />
                )}
                {activeTab === 'Outfit' && (
                  <OutfitTab
                    productos={productos.filter((product) => product.genero === genero || product.genero === 'Unisex')}
                    selectedProductId={selectedProduct ? String(selectedProduct.id) : undefined}
                    onSelectProduct={(product) => {
                      setSelectedProduct(product);
                      setActiveTab('Prenda');
                    }}
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col min-h-[50vh] lg:min-h-[600px]">
              <Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center text-sm text-gray-500">Cargando probador 3D…</div>}>
                <AvatarStage bodyMetrics={bodyMetrics} selectedProduct={selectedProduct} genero={genero} />
              </Suspense>
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
            const selectedSize = selectedProduct.talla_sugerida || analisis?.talla;
            const selectedVariant = selectedProduct.producto_tallas?.find(
              (variant: any) => String(variant.talla) === String(selectedSize),
            );
            if (!selectedVariant?.id || Number(selectedVariant.stock) <= 0) {
              alert("Selecciona una talla con stock antes de continuar.");
              return;
            }
            addToCart({
              id: String(selectedProduct.id),
              name: selectedProduct.nombre,
              price: Number(selectedProduct.precio || 0),
              img: selectedProduct.imagen_url || selectedProduct.img || '',
              quantity: 1,
              size: selectedSize,
              color: selectedProduct.color || 'Unico',
              stock: Number(selectedVariant.stock),
              tallaId: String(selectedVariant.id),
            });
            alert("¡Prenda agregada al carrito con éxito (ignorando advertencia)!");
          }
        }}
      />
    </AppLayout>
  );
}
