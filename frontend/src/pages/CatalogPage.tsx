import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [selectedGender, setSelectedGender] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(250);
  const [inStock, setInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productos, setProductos] = useState<any[]>([]);

  const categoriasHombre = ['Shorts', 'Polos', 'Buzos Hombre', 'Casacas Hombre', 'Poleras Hombre'];
  const categoriasMujer = ['Tops', 'Leggings', 'Buzos Mujer', 'Casacas Mujer', 'Poleras Mujer'];
  
  const ordenTallas: Record<string, number> = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5 };

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        const response = await api.get('/products');
        const data = response.data;
        setProductos(Array.isArray(data) ? data : (data.data || []));
      } catch (error) {
        console.error(error);
      }
    };
    cargarCatalogo();
  }, []);

  const marcasDisponibles = useMemo(() => {
    return Array.from(new Set(productos.map(p => p.marca).filter(Boolean)));
  }, [productos]);

  useEffect(() => {
    if (queryParam) {
      const queryLower = queryParam.toLowerCase();

      if (queryLower.includes('mujer') || queryLower.includes('dama')) {
        setSelectedGender('Mujer');
      } else if (queryLower.includes('hombre') || queryLower.includes('caballero')) {
        setSelectedGender('Hombre');
      } else {
        setSelectedGender('Todos');
      }

      if (marcasDisponibles.length > 0) {
        const matchedBrand = marcasDisponibles.find(m => queryLower.includes(m.toLowerCase()));
        if (matchedBrand && !selectedBrands.includes(matchedBrand)) {
          setSelectedBrands(prev => [...prev, matchedBrand]);
        }
      }
    }
  }, [queryParam, marcasDisponibles]);

  const handleBrandToggle = (marca: string) => {
    setSelectedBrands(prev => {
      const newBrands = prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca];
      if (queryParam && queryParam.toLowerCase().includes(marca.toLowerCase()) && !newBrands.includes(marca)) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('q');
        setSearchParams(newParams);
      }
      return newBrands;
    });
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    setSelectedGender('Todos');
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setMaxPrice(250);
    setInStock(false);
    setCurrentPage(1);
    if (queryParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams);
    }
  };

  const productosFiltrados = productos.filter((item: any) => {
    let coincideBusqueda = true;
    if (queryParam) {
      const queryLower = queryParam.toLowerCase();
      const nombreLower = (item.nombre || item.name || '').toLowerCase();
      const marcaLower = (item.marca || '').toLowerCase();
      coincideBusqueda = nombreLower.includes(queryLower) || marcaLower.includes(queryLower);
    }

    const generoItem = item.genero || '';
    const coincideGenero = selectedGender === 'Todos' || generoItem.toLowerCase() === selectedGender.toLowerCase();
    
    const coincideCategoria = !selectedCategory || item.categoria === selectedCategory;
    const coincideMarca = selectedBrands.length === 0 || selectedBrands.includes(item.marca);
    const precioProd = Number(item.precio || item.price || 0);
    const coincidePrecio = precioProd <= maxPrice;

    let coincideTalla = true;
    if (selectedSizes.length > 0) {
      const tallasDelProducto = item.producto_tallas || [];
      coincideTalla = tallasDelProducto.some(
        (t: any) => selectedSizes.includes(t.talla) && Number(t.stock) > 0
      );
    }

    const coincideStock = !inStock || precioProd > 0;

    return coincideBusqueda && coincideGenero && coincideCategoria && coincideMarca && coincidePrecio && coincideTalla && coincideStock;
  });

  const productosPorPagina = 9;
  const indexUltimo = currentPage * productosPorPagina;
  const indexPrimer = indexUltimo - productosPorPagina;
  const productosActuales = productosFiltrados.slice(indexPrimer, indexUltimo);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina) || 1;
  
  const categoriasDisponibles = selectedGender === 'Hombre' ? categoriasHombre : 
                                selectedGender === 'Mujer' ? categoriasMujer : 
                                Array.from(new Set([...categoriasHombre, ...categoriasMujer]));

  return (
    <AppLayout>
      <div className="bg-[#f8f9fa] dark:bg-brand-dark-bg min-h-screen py-8 font-sans text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Catálogo Deportivo
            </h1>
            {queryParam && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Resultados de búsqueda para: <span className="font-bold text-brand-green">"{queryParam}"</span>
              </p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg dark:text-white">Filtros</h3>
                  <button
                    onClick={limpiarFiltros}
                    className="text-[10px] font-bold text-brand-green uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Género</h4>
                  <div className="space-y-2">
                    {['Todos', 'Hombre', 'Mujer'].map(gender => (
                      <label
                        key={gender}
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedGender(gender);
                          setSelectedCategory(null);
                          setCurrentPage(1);
                        }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGender === gender ? 'bg-brand-green border-brand-green' : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-green'}`}>
                          {selectedGender === gender && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium dark:text-gray-300">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Tipo de Prenda</h4>
                  <div className="space-y-2">
                    {categoriasDisponibles.map(cat => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={(e) => { 
                          e.preventDefault();
                          setSelectedCategory(selectedCategory === cat ? null : cat); 
                          setCurrentPage(1); 
                        }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'bg-brand-green border-brand-green' : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-green'}`}>
                          {selectedCategory === cat && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium dark:text-gray-300">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {marcasDisponibles.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Marca</h4>
                    <div className="space-y-2">
                      {marcasDisponibles.map(marca => (
                        <label
                          key={marca}
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={(e) => { 
                            e.preventDefault();
                            handleBrandToggle(marca); 
                          }}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(marca) ? 'bg-brand-green border-brand-green' : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-green'}`}>
                            {selectedBrands.includes(marca) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm font-medium dark:text-gray-300">{marca}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Talla</h4>
                  <div className="flex flex-wrap gap-2">
                    {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSizes(prev => 
                            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                          );
                          setCurrentPage(1);
                        }}
                        className={`w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center transition-all ${selectedSizes.includes(size) ? 'bg-brand-green text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                    Precio Máximo: S/ {maxPrice}
                  </h4>
                  <input
                    type="range"
                    min="20"
                    max="250"
                    step="5"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(Number(e.target.value)); setCurrentPage(1); }}
                    className="w-full accent-brand-green cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1">
                    <span>S/ 20</span>
                    <span>S/ 250</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-widest">Solo en Stock</h4>
                  <button
                    onClick={() => { setInStock(!inStock); setCurrentPage(1); }}
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
                  Mostrando <span className="font-bold text-black dark:text-white">{productosFiltrados.length}</span> productos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productosActuales.length > 0 ? productosActuales.map((item, index) => {
                  const tallasDisponibles = (item.producto_tallas || [])
                    .filter((t: any) => Number(t.stock) > 0)
                    .sort((a: any, b: any) => (ordenTallas[a.talla] || 99) - (ordenTallas[b.talla] || 99));

                  return (
                    <div key={item.id || index} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col">
                      <div className="relative bg-[#f4f5f7] dark:bg-gray-800 rounded-xl aspect-[4/5] mb-4 flex items-center justify-center overflow-hidden">
                        <span className="absolute top-3 left-3 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white rounded shadow-sm z-10 bg-gray-900/70 dark:bg-black/50">
                          IN STOCK
                        </span>
                        <Link to={`/producto/${item.id || 1}`} className="w-full h-full">
                          <img src={item.imagen_url || item.img || ''} alt={item.nombre || 'Producto'} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-500" />
                        </Link>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{item.categoria}</div>
                        {item.marca && <div className="text-[9px] text-brand-green font-black uppercase tracking-wider">{item.marca}</div>}
                      </div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-2 truncate">
                        <Link to={`/producto/${item.id || 1}`}>{item.nombre || item.name}</Link>
                      </h3>
                      <div className="font-black text-lg mb-3 dark:text-gray-200">${item.precio || item.price}</div>

                      <div className="flex gap-1 mb-4 mt-auto flex-wrap">
                        {tallasDisponibles.length > 0 ? (
                          tallasDisponibles.map((t: any) => (
                            <span key={t.talla} className="w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold text-gray-600 dark:text-gray-300">
                              {t.talla}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold">Agotado</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link to={`/producto/${item.id || 1}`} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition text-center flex items-center justify-center">
                          Ver Detalle
                        </Link>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-500 font-bold">
                    No se encontraron productos con estos filtros.
                  </div>
                )}
              </div>

              {totalPaginas > 1 && (
                <div className="flex justify-center mt-10 gap-2 overflow-x-auto pb-4 custom-scrollbar">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 transition shadow-sm"
                  >&lsaquo;</button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md shadow-sm transition font-medium ${currentPage === page ? 'bg-brand-green text-black font-bold' : 'bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPaginas, currentPage + 1))}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 transition shadow-sm"
                  >&rsaquo;</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}