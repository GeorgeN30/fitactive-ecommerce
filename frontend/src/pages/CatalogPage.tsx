import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import FavoriteButton from "../components/FavoriteButton";
import { fetchCatalogProducts, getCatalogPrice, type CatalogProduct } from "../services/catalog";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=700&fit=crop&auto=format";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const GENDER_OPTIONS = ["Todos", "Hombre", "Mujer", "Unisex"];

function genderLabel(value: string | null): string {
  const normalized = value?.toLowerCase();
  if (normalized === "male" || normalized === "hombre") return "Hombre";
  if (normalized === "female" || normalized === "mujer") return "Mujer";
  return "Unisex";
}

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const { search } = useLocation();
  const searchQuery = new URLSearchParams(search).get("search")?.trim().toLowerCase() || "";
  const [selectedGender, setSelectedGender] = useState("Todos");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const loaded = await fetchCatalogProducts();
        if (!cancelled) setProducts(loaded);
      } catch {
        if (!cancelled) setError("No se pudo conectar con el catálogo. Intenta nuevamente.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const productsForGender = selectedGender === "Todos"
    ? products
    : products.filter((product) => genderLabel(product.genero) === selectedGender);
  const categoryOptions = [
    "Todas",
    ...Array.from(
      new Set(
        productsForGender
          .map((product) => product.categoria)
          .filter((category): category is string => Boolean(category)),
      ),
    ),
  ];
  const brandOptions = [
    "Todas",
    ...Array.from(
      new Set(
        products
          .map((product) => product.marca)
          .filter((brand): brand is string => Boolean(brand)),
      ),
    ),
  ];

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const hasSize = !selectedSize || product.tallas.some((size) => size.talla === selectedSize && size.stock > 0);
      const hasStock = !inStock || product.totalStock > 0;
      const matchGender = selectedGender === "Todos" || genderLabel(product.genero) === selectedGender;
      const matchCategory = selectedCategory === "Todas" || product.categoria === selectedCategory;
      const matchBrand = selectedBrand === "Todas" || product.marca === selectedBrand;
      const matchSearch = !searchQuery || [
        product.nombre,
        product.categoria || "",
        product.marca || "",
      ].some((value) => value.toLowerCase().includes(searchQuery));
      return matchGender && hasSize && hasStock && matchCategory && matchBrand && matchSearch;
    });
    return [...result].sort((a, b) => {
      if (sort === "low") return getCatalogPrice(a).price - getCatalogPrice(b).price;
      if (sort === "high") return getCatalogPrice(b).price - getCatalogPrice(a).price;
      return b.totalStock - a.totalStock;
    });
  }, [inStock, products, searchQuery, selectedBrand, selectedCategory, selectedGender, selectedSize, sort]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const page = Math.min(currentPage, pageCount);
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const paginationPageSize = 5;
  const paginationStart = Math.floor((page - 1) / paginationPageSize) * paginationPageSize + 1;
  const paginationEnd = Math.min(paginationStart + paginationPageSize - 1, pageCount);
  const paginationPages = Array.from({ length: paginationEnd - paginationStart + 1 }, (_, index) => paginationStart + index);

  const clearFilters = () => {
    setSelectedGender("Todos");
    setSelectedSize(null);
    setSelectedCategory("Todas");
    setSelectedBrand("Todas");
    setInStock(true);
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="bg-[#f8f9fa] dark:bg-brand-dark-bg min-h-screen py-8 font-sans text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8"><h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Catálogo Deportivo</h1><p className="text-sm text-gray-500 mt-2">Productos y precios sincronizados con la base de datos.</p></div>
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-brand-card-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg dark:text-white">Filtros</h3><button type="button" onClick={clearFilters} className="text-[10px] font-bold text-brand-green uppercase tracking-wider hover:underline">Limpiar</button></div>
                <div className="mb-6"><h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Género</h4><div className="space-y-2">{GENDER_OPTIONS.map((gender) => <button type="button" key={gender} onClick={() => { setSelectedGender(gender); setSelectedCategory("Todas"); setCurrentPage(1); }} className="w-full flex items-center gap-2 cursor-pointer group text-left"><span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGender === gender ? "bg-brand-green border-brand-green" : "border-gray-300 dark:border-gray-600 group-hover:border-brand-green"}`}>{selectedGender === gender && <span className="text-white text-xs">✓</span>}</span><span className="text-sm font-medium dark:text-gray-300">{gender}</span></button>)}</div></div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Categoría</h4>
                  <select
                    aria-label="Filtrar por categoría"
                    value={selectedCategory}
                    onChange={(event) => { setSelectedCategory(event.target.value); setCurrentPage(1); }}
                    className="w-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700 focus:ring-0 focus:border-brand-green cursor-pointer"
                  >
                    {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Marca</h4>
                  <select
                    aria-label="Filtrar por marca"
                    value={selectedBrand}
                    onChange={(event) => { setSelectedBrand(event.target.value); setCurrentPage(1); }}
                    className="w-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700 focus:ring-0 focus:border-brand-green cursor-pointer"
                  >
                    {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </div>
                <div className="mb-6"><h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Talla</h4><div className="flex flex-wrap gap-2">{SIZE_OPTIONS.map((size) => <button type="button" key={size} onClick={() => { setSelectedSize(selectedSize === size ? null : size); setCurrentPage(1); }} className={`w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center transition-all ${selectedSize === size ? "bg-brand-green text-black" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{size}</button>)}</div></div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700"><h4 className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-widest">Solo en stock</h4><button type="button" aria-label="Filtrar productos en stock" onClick={() => { setInStock(!inStock); setCurrentPage(1); }} className={`w-10 h-5 rounded-full relative transition-colors ${inStock ? "bg-brand-green" : "bg-gray-300 dark:bg-gray-600"}`}><span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${inStock ? "left-6" : "left-1"}`} /></button></div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-brand-card-dark rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-800"><p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">Mostrando <span className="font-bold text-black dark:text-white">{visibleProducts.length}</span> de {filteredProducts.length} productos{searchQuery && <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-green/10 text-brand-green rounded">Búsqueda: "{searchQuery}"</span>}</p><div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ordenar:</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="text-sm font-bold bg-transparent dark:bg-brand-card-dark text-gray-900 dark:text-white border-none focus:ring-0 cursor-pointer"><option value="featured">Más destacados</option><option value="low">Precio menor</option><option value="high">Precio mayor</option></select></div></div>

              {loading ? <div className="p-12 text-center text-gray-400">Cargando productos desde la base de datos…</div> : error ? <div className="p-12 text-center text-red-500 font-bold">{error}</div> : visibleProducts.length === 0 ? <div className="p-12 text-center bg-white dark:bg-brand-card-dark rounded-2xl text-gray-500">No encontramos productos con esos filtros.</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{visibleProducts.map((product) => {
                const pricing = getCatalogPrice(product);
                const image = product.imagenUrl || FALLBACK_IMAGE;
                const stockLabel = product.totalStock > 25 ? "ALTO STOCK" : product.totalStock <= 5 ? "STOCK LIMITADO" : "EN STOCK";
                return <div key={product.id} className="bg-white dark:bg-brand-card-dark rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col"><div className="relative bg-[#f4f5f7] dark:bg-gray-800 rounded-xl aspect-[4/5] mb-4 flex items-center justify-center overflow-hidden"><span className={`absolute top-3 left-3 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white rounded shadow-sm z-10 ${product.totalStock <= 5 ? "bg-red-500" : "bg-gray-900/70 dark:bg-black/50"}`}>{stockLabel}</span>{pricing.discount > 0 && <span className="absolute bottom-3 left-3 px-2 py-1 text-[10px] font-black bg-brand-green text-black rounded z-10">-{pricing.discount}%</span>}<FavoriteButton product={{ id: product.id, cat: product.categoria || "General", name: product.nombre, price: pricing.price, img: image }} className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:scale-110 transition-all z-10" /> <Link to={`/producto/${product.id}`} className="w-full h-full"><img src={image} alt={product.nombre} className="object-contain p-3 w-full h-full mix-blend-multiply dark:mix-blend-normal" /></Link></div><div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{product.categoria || "General"}{product.marca ? ` - ${product.marca}` : ""}</div><h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-2 truncate"><Link to={`/producto/${product.id}`}>{product.nombre}</Link></h3><div className="font-black text-lg mb-3 dark:text-gray-200">{pricing.discount > 0 && <span className="text-sm text-gray-400 line-through mr-2">S/ {product.precio.toFixed(2)}</span>}S/ {pricing.price.toFixed(2)}</div><div className="mb-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="text-gray-500 dark:text-gray-400">Disponible</span><span className={product.totalStock > 0 ? "text-brand-green" : "text-red-500"}>{product.totalStock} unidades</span></div><div className="flex gap-1 mb-4 mt-auto">{product.tallas.filter((size) => size.stock > 0).sort((a, b) => SIZE_OPTIONS.indexOf(a.talla) - SIZE_OPTIONS.indexOf(b.talla)).map((size) => <span key={size.id} title={`${size.talla}: ${size.stock} unidades`} className="w-7 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold text-gray-600 dark:text-gray-300">{size.talla}</span>)}</div><div className="flex gap-2"><Link to={`/producto/${product.id}`} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition text-center">Ver detalle</Link><Link to={`/probador-virtual?producto=${product.id}`} className="flex-1 py-2 bg-white dark:bg-transparent border border-brand-green text-brand-green text-xs font-bold rounded-md hover:bg-brand-green hover:text-black transition text-center">Probar AR</Link></div></div>;
              })}</div>}

              {pageCount > 1 && <nav aria-label="Paginación del catálogo" className="flex flex-wrap justify-center items-center mt-10 gap-2 text-xs font-bold text-gray-500 dark:text-gray-400"><button type="button" aria-label="Productos anteriores" disabled={page === 1} onClick={() => setCurrentPage(Math.max(1, page - 1))} className="px-3 h-8 rounded-md bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-green hover:text-brand-green transition-colors">Anterior</button>{paginationPages.map((item) => <button type="button" aria-label={`Página ${item}`} key={item} onClick={() => setCurrentPage(item)} className={`w-8 h-8 rounded-md shadow-sm transition font-medium ${page === item ? "bg-brand-green text-black font-bold" : "bg-white dark:bg-brand-card-dark border text-gray-700 dark:text-gray-300"}`}>{item}</button>)}<button type="button" aria-label="Productos siguientes" disabled={page === pageCount} onClick={() => setCurrentPage(Math.min(pageCount, page + 1))} className="px-3 h-8 rounded-md bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-green hover:text-brand-green transition-colors">Siguiente</button><span className="min-w-24 text-center">Página {page} de {pageCount}</span></nav>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
