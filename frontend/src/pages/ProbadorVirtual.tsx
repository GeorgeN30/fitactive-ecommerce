import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useCatalog } from '../hooks/useCatalog';
import { getSizePrice } from '../services/catalog';
import ProductOffer from '../components/ProductOffer';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { paginateProducts, PRODUCTS_PER_PAGE } from '../utils/productPagination';
import { getVirtualTryOnSessionId, markVirtualTryOnProduct, trackVirtualTryOnEvent } from '../services/virtualTryOn';
import ProductSelector from '../components/ProbadorVirtual/ProductSelector';

const AvatarStage = lazy(() => import('../components/ProbadorVirtual/AvatarStage'));

function normalizeGender(value?: string | null): 'Hombre' | 'Mujer' {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'female' || normalized === 'mujer' || normalized === 'femenino') return 'Mujer';
  return 'Hombre';
}

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ProbadorVirtual() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const productoIdUrl = searchParams.get('producto');
  const tallaUrl = searchParams.get('talla')?.toUpperCase();

  const [genero, setGenero] = useState<'Hombre' | 'Mujer'>(() => {
    return normalizeGender(user?.genero);
  });

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (tallaUrl && STANDARD_SIZES.includes(tallaUrl)) return tallaUrl;
    return 'M';
  });

  const [customColor, setCustomColor] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [productPage, setProductPage] = useState(1);
  const [cartSuccessMsg, setCartSuccessMsg] = useState<string | null>(null);

  const [tryOnSessionId] = useState(() => getVirtualTryOnSessionId());
  const [tryOnStartedAt] = useState(() => Date.now());
  const reportedProducts = useRef(new Set<string>());

  const catalog = useCatalog();
  const productos = useMemo(() => {
    return catalog.products
      .filter((item) => {
        const gen = (item.genero || '').trim().toLowerCase();
        return !gen || gen === 'hombre' || gen === 'mujer' || gen === 'male' || gen === 'female' || gen === 'unisex';
      })
      .map((item) => ({
        ...item,
        imagen_url: item.imagenUrl || (item as any).imagen_url || (item as any).img,
        genero: normalizeGender(item.genero),
        categoria: item.categoria || 'General',
        producto_tallas: (item.tallas || (item as any).producto_tallas || []).map((size: any) => ({
          ...size,
          rango_cm_min: size.rangoCmMin,
          rango_cm_max: size.rangoCmMax,
        })),
      }));
  }, [catalog.products]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Carga inicial o cambio de producto vía URL
  const lastUrl = useRef<string | null>(null);
  useEffect(() => {
    if (catalog.loading || productos.length === 0) return;

    const changedUrl = lastUrl.current !== productoIdUrl;
    lastUrl.current = productoIdUrl;

    if (productoIdUrl) {
      const found = productos.find((p) => String(p.id) === String(productoIdUrl));
      if (found) {
        setSelectedProduct(found);
        if (found.genero !== genero) {
          setGenero(found.genero);
        }
        if (tallaUrl && STANDARD_SIZES.includes(tallaUrl)) {
          setSelectedSize(tallaUrl);
        }
        return;
      }
    }

    if (changedUrl || !selectedProduct) {
      const defaultProd = productos.find((p) => p.genero === genero) || productos[0] || null;
      setSelectedProduct(defaultProd);
      if (tallaUrl && STANDARD_SIZES.includes(tallaUrl)) {
        setSelectedSize(tallaUrl);
      }
    }
  }, [productos, productoIdUrl, tallaUrl, catalog.loading]);

  // Track evento de inicio de sesión de probador
  useEffect(() => {
    void trackVirtualTryOnEvent({
      sessionId: tryOnSessionId,
      type: 'session_started',
      gender: genero,
    }).catch(() => undefined);
  }, [tryOnSessionId]);

  // Track evento de prueba de producto
  useEffect(() => {
    if (!selectedProduct || reportedProducts.current.has(String(selectedProduct.id))) return;
    const productId = String(selectedProduct.id);
    reportedProducts.current.add(productId);
    markVirtualTryOnProduct(productId);
    void trackVirtualTryOnEvent({
      type: 'try_on',
      sessionId: tryOnSessionId,
      productId,
      size: selectedSize,
      gender: genero,
      durationSeconds: Math.max(0, Math.round((Date.now() - tryOnStartedAt) / 1000)),
    }).catch(() => undefined);
  }, [selectedProduct, selectedSize, genero, tryOnSessionId, tryOnStartedAt]);

  const handleCambioGenero = (nuevoGenero: string) => {
    const nextGen: 'Hombre' | 'Mujer' = nuevoGenero === 'Mujer' ? 'Mujer' : 'Hombre';
    setGenero(nextGen);
    setCategoriaFiltro('Todas');
    setSearchTerm('');
    setProductPage(1);

    const prodsNuevos = productos.filter((p) => p.genero === nextGen);
    if (prodsNuevos.length > 0) {
      setSelectedProduct(prodsNuevos[0]);
    }
  };

  // Filtrado de productos para el catálogo del probador
  const productosDelGenero = productos.filter((p) => p.genero === genero);
  const categoriasUnicas = ['Todas', ...Array.from(new Set(productosDelGenero.map((p) => p.categoria))).filter(Boolean)];

  const productosFiltrados = productosDelGenero.filter((p) => {
    const matchCat = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    const matchSearch =
      !searchTerm ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  const pageCount = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTS_PER_PAGE));
  const currentProductPage = Math.min(productPage, pageCount);
  const firstProductIndex = productosFiltrados.length === 0 ? 0 : (currentProductPage - 1) * PRODUCTS_PER_PAGE + 1;
  const lastProductIndex = Math.min(currentProductPage * PRODUCTS_PER_PAGE, productosFiltrados.length);
  const visibleProducts = paginateProducts(productosFiltrados, currentProductPage);

  const handleCategoryFilterChange = (category: string) => {
    setCategoriaFiltro(category);
    setProductPage(1);
  };

  // Información de stock y variante de la talla activa
  const productSizes = selectedProduct?.producto_tallas || selectedProduct?.tallas || [];
  const activeVariant = productSizes.find((v: any) => String(v.talla).trim().toUpperCase() === selectedSize);
  const activeStock = activeVariant ? Number(activeVariant.stock ?? 0) : 0;
  const isOutOfStock = !activeVariant || activeStock <= 0;

  const currentPriceInfo = selectedProduct && activeVariant
    ? getSizePrice(selectedProduct, activeVariant)
    : { price: Number(selectedProduct?.precio || 0), discount: 0 };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    if (!activeVariant || !activeVariant.id) {
      alert(`La talla ${selectedSize} no está configurada para este producto.`);
      return;
    }

    if (activeStock <= 0) {
      alert(`La talla ${selectedSize} está actualmente agotada. Elige otra talla para añadir al carrito.`);
      return;
    }

    addToCart({
      id: String(selectedProduct.id),
      name: selectedProduct.nombre,
      price: currentPriceInfo.price,
      img: selectedProduct.imagen_url || selectedProduct.imagenUrl || selectedProduct.img || '',
      quantity: 1,
      size: selectedSize,
      color: customColor || selectedProduct.color || 'Original',
      stock: activeStock,
      tallaId: String(activeVariant.id),
    });

    setCartSuccessMsg(`¡${selectedProduct.nombre} (Talla ${selectedSize}) agregado a tu carrito!`);
    setTimeout(() => setCartSuccessMsg(null), 4000);
  };

  const handleSelectSize = (sz: string) => {
    const norm = sz.trim().toUpperCase();
    setSelectedSize(norm);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('talla', norm);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('producto', String(product.id));
    if (selectedSize) {
      nextParams.set('talla', selectedSize);
    }
    setSearchParams(nextParams, { replace: true });
  };

  if (catalog.loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center font-bold text-xl text-gray-900 dark:text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mr-4"></div>
          Cargando Probador Virtual 3D...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-[#f4f7f9] dark:bg-[#0f1115] min-h-screen py-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Superior Limpio */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Link to="/catalogo" className="hover:text-brand-green transition-colors">
                  Catálogo
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-white font-bold">Probador Virtual</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse"></span>
                Probador Virtual 3D
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Previsualización anatómica 3D vinculada directamente al catálogo oficial y tallas estándar
              </p>
            </div>

            {/* Selector Rápido de Género en Header */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-1.5 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => handleCambioGenero('Hombre')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  genero === 'Hombre'
                    ? 'bg-brand-green text-black shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                🏃‍♂️ Hombre
              </button>
              <button
                type="button"
                onClick={() => handleCambioGenero('Mujer')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  genero === 'Mujer'
                    ? 'bg-brand-green text-black shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                🏃‍♀️ Mujer
              </button>
            </div>
          </div>

          {/* Notificación de Carrito */}
          {cartSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-500 text-base"></i>
                <span>{cartSuccessMsg}</span>
              </div>
              <Link to="/carrito" className="underline font-black text-xs hover:opacity-80">
                Ir al carrito →
              </Link>
            </div>
          )}

          {catalog.error && (
            <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {catalog.error}
            </p>
          )}

          {/* Grid Principal Equilibrado de 3 Columnas (3 - 6 - 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16">
            {/* Columna Izquierda: Selector de Prendas del Catálogo */}
            <div className="lg:col-span-3 bg-white dark:bg-white/[0.02] p-4 lg:p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-white/5 flex flex-col min-h-[420px] lg:h-[720px]">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Prendas {genero}
                </h3>
                <span className="text-[10px] font-bold bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full">
                  {productosDelGenero.length} productos
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <ProductSelector
                  visibleProducts={visibleProducts}
                  selectedProduct={selectedProduct}
                  setSelectedProduct={handleSelectProduct}
                  genero={genero}
                  handleCambioGenero={handleCambioGenero}
                  categoriaFiltro={categoriaFiltro}
                  setCategoriaFiltro={handleCategoryFilterChange}
                  categoriasUnicas={categoriasUnicas}
                  currentPage={currentProductPage}
                  pageCount={pageCount}
                  onPageChange={setProductPage}
                  totalProducts={productosFiltrados.length}
                  firstProductIndex={firstProductIndex}
                  lastProductIndex={lastProductIndex}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
            </div>

            {/* Columna Central: Escenario 3D con Avatar Centrado Horizontalmente */}
            <div className="lg:col-span-6 flex flex-col h-[520px] lg:h-[720px] relative">
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center rounded-[2.5rem] bg-gray-100 dark:bg-white/5 text-xs text-gray-500 font-bold">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mr-3"></div>
                    Cargando probador 3D…
                  </div>
                }
              >
                <AvatarStage
                  selectedProduct={selectedProduct}
                  genero={genero}
                  activeSize={selectedSize}
                  onSelectSize={handleSelectSize}
                  customColor={customColor}
                  onSelectColor={setCustomColor}
                />
              </Suspense>
            </div>

            {/* Columna Derecha: Ficha de Acción, Tallas, Stock y Compra Directa */}
            <div className="lg:col-span-3 bg-white dark:bg-white/[0.02] p-5 lg:p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-white/5 flex flex-col justify-between min-h-[420px] lg:h-[720px] overflow-y-auto">
              {selectedProduct ? (
                <div className="flex flex-col h-full justify-between gap-4">
                  {/* Ficha de la Prenda */}
                  <div className="space-y-4">
                    <div className="relative rounded-2xl bg-[#f4f5f7] dark:bg-gray-800/60 p-4 aspect-[4/3] flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/5">
                      <img
                        src={selectedProduct.imagen_url || selectedProduct.imagenUrl || selectedProduct.img || 'https://placehold.co/400x400'}
                        alt={selectedProduct.nombre}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                      />
                      <FavoriteButton
                        product={{
                          id: String(selectedProduct.id),
                          cat: selectedProduct.categoria || 'Catálogo',
                          name: selectedProduct.nombre,
                          price: currentPriceInfo.price,
                          img: selectedProduct.imagen_url || selectedProduct.imagenUrl || selectedProduct.img || '',
                        }}
                        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 dark:bg-zinc-800/90 rounded-full shadow-md text-red-500 hover:scale-110 transition-all cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                        <span>{selectedProduct.marca || 'Marca Oficial'}</span>
                        <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                          {selectedProduct.categoria}
                        </span>
                      </div>
                      <h2 className="text-base font-black text-gray-900 dark:text-white mt-1">
                        {selectedProduct.nombre}
                      </h2>
                    </div>

                    {/* Precios y Ofertas */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                      <ProductOffer product={selectedProduct} selectedSize={selectedSize} />
                    </div>

                    {/* Selector y Estado de Tallas */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                          Talla Seleccionada:
                        </span>
                        <span className="text-xs font-black text-brand-green">
                          Talla {selectedSize}
                        </span>
                      </div>

                      <div className="grid grid-cols-6 gap-1.5">
                        {STANDARD_SIZES.map((sz) => {
                          const isSelected = sz === selectedSize;
                          const variant = productSizes.find((v: any) => String(v.talla).trim().toUpperCase() === sz);
                          const hasStock = variant && Number(variant.stock) > 0;

                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleSelectSize(sz)}
                              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center relative ${
                                isSelected
                                  ? 'bg-brand-green text-black ring-2 ring-brand-green/80 shadow-md font-black'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                              } ${!hasStock ? 'opacity-50' : ''}`}
                            >
                              {sz}
                              {!hasStock && (
                                <span className="block text-[8px] font-normal text-red-500 leading-none">
                                  0
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Mensaje de Stock en Tiempo Real */}
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 text-xs">
                        {isOutOfStock ? (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                            <span>❌</span>
                            <span>Agotado en Talla {selectedSize}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{activeStock} unidades disponibles en Talla {selectedSize}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Compra y Detalle */}
                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      className="w-full py-3.5 rounded-2xl bg-brand-green text-black text-xs font-black uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-cart-shopping"></i>
                      <span>{isOutOfStock ? 'Talla Agotada' : 'Añadir al Carrito'}</span>
                    </button>

                    <Link
                      to={`/producto/${selectedProduct.id}`}
                      className="w-full py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Ver ficha completa</span>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                  <div className="text-4xl mb-3">👕</div>
                  <p className="text-xs font-bold">Selecciona una prenda del catálogo para ver su información y probarla.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
