import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import CatalogProductCard from "../components/CatalogProductCard";
import { useCatalog } from "../hooks/useCatalog";
import { getCatalogPrice } from "../services/catalog";

function genderLabel(value: string | null) {
  const gender = value?.toLowerCase();
  return ["male", "hombre", "masculino"].includes(gender || "") ? "Hombre" : ["female", "mujer", "femenino"].includes(gender || "") ? "Mujer" : "Unisex";
}
export default function CatalogPage() {
  const { products, loading, error, refresh } = useCatalog();
  const { search } = useLocation();
  const [params, setParams] = useSearchParams();
  const searchQuery = params.get("search")?.trim().toLowerCase() || "";
  const onlyOffers = params.get("ofertas") === "1";
  const genderQuery = params.get("genero") || "Todos";
  const [gender, setGender] = useState(params.get("genero") || "Todos");
  const [size, setSize] = useState<string | null>(null);
  const [category, setCategory] = useState("Todas");
  const [brand, setBrand] = useState("Todas");
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); setGender(genderQuery); }, [search, genderQuery]);
  const categories = ["Todas", ...new Set(products.filter((p) => gender === "Todos" || genderLabel(p.genero) === gender).map((p) => p.categoria).filter((v): v is string => !!v))];
  const brands = ["Todas", ...new Set(products.map((p) => p.marca).filter((v): v is string => !!v))];
  const filtered = useMemo(() => products.filter((p) =>
    (gender === "Todos" || genderLabel(p.genero) === gender) &&
    (!size || p.tallas.some((s) => s.talla === size && s.stock > 0)) &&
    (!inStock || p.totalStock > 0) && (category === "Todas" || p.categoria === category) &&
    (brand === "Todas" || p.marca === brand) && (!onlyOffers || getCatalogPrice(p).discount > 0) &&
    (!searchQuery || [p.nombre, p.categoria || "", p.marca || ""].some((value) => value.toLowerCase().includes(searchQuery))))
    .sort((a, b) => sort === "low" ? getCatalogPrice(a).price - getCatalogPrice(b).price : sort === "high" ? getCatalogPrice(b).price - getCatalogPrice(a).price : b.totalStock - a.totalStock),
    [products, gender, size, inStock, category, brand, onlyOffers, searchQuery, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const page = Math.min(currentPage, pageCount);
  const visible = filtered.slice((page - 1) * 6, page * 6);
  const first = Math.floor((page - 1) / 5) * 5 + 1;
  const pages = Array.from({ length: Math.min(5, pageCount - first + 1) }, (_, index) => first + index);
  const clear = () => { setGender("Todos"); setSize(null); setCategory("Todas"); setBrand("Todas"); setInStock(true); setCurrentPage(1); setParams({}); };
  return <AppLayout><div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg text-gray-900 dark:text-white py-8"><div className="max-w-7xl mx-auto px-4 sm:px-6">
    <h1 className="text-3xl font-extrabold mb-2">Catálogo Deportivo</h1><p className="text-sm text-gray-500 mb-8">Productos, ofertas y precios por talla actualizados.</p>
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64 shrink-0 bg-white dark:bg-brand-card-dark p-6 rounded-2xl h-fit space-y-5">
        <div className="flex justify-between"><h2 className="font-bold">Filtros</h2><button onClick={clear} className="text-sm text-emerald-700 dark:text-brand-green">Limpiar</button></div>
        <fieldset><legend className="text-sm font-bold mb-2">Género</legend><div className="flex flex-wrap gap-2">{["Todos", "Hombre", "Mujer", "Unisex"].map((item) => <button key={item} aria-pressed={gender === item} onClick={() => { setGender(item); setCategory("Todas"); setCurrentPage(1); }} className={`rounded-lg px-3 py-2 text-sm ${gender === item ? "bg-brand-green text-black" : "bg-gray-100 dark:bg-gray-800"}`}>{item}</button>)}</div></fieldset>
        <label className="block text-sm font-bold">Categoría<select aria-label="Filtrar por categoría" value={category} onChange={(event) => { setCategory(event.target.value); setCurrentPage(1); }} className="block w-full mt-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="block text-sm font-bold">Marca<select aria-label="Filtrar por marca" value={brand} onChange={(event) => { setBrand(event.target.value); setCurrentPage(1); }} className="block w-full mt-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
        <fieldset><legend className="text-sm font-bold mb-2">Talla</legend><div className="flex flex-wrap gap-2">{["XS", "S", "M", "L", "XL", "XXL"].map((item) => <button key={item} aria-pressed={size === item} onClick={() => { setSize(size === item ? null : item); setCurrentPage(1); }} className={`rounded-lg w-10 h-10 text-xs ${size === item ? "bg-brand-green text-black" : "bg-gray-100 dark:bg-gray-800"}`}>{item}</button>)}</div></fieldset>
        <label className="flex gap-2 text-sm"><input aria-label="Filtrar productos en stock" type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setCurrentPage(1); }} />Solo en stock</label>
        <label className="flex gap-2 text-sm"><input aria-label="Solo productos en descuento" type="checkbox" checked={onlyOffers} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.checked) next.set("ofertas", "1"); else next.delete("ofertas"); setParams(next); }} />Solo ofertas vigentes</label>
      </aside>
      <div className="flex-1 min-w-0"><div className="flex flex-wrap justify-between gap-4 mb-6 bg-white dark:bg-brand-card-dark p-4 rounded-xl"><p className="text-sm">Mostrando <strong>{visible.length}</strong> de {filtered.length} productos{searchQuery && ` · Búsqueda: ${searchQuery}`}</p><label className="text-sm">Ordenar: <select aria-label="Ordenar productos" value={sort} onChange={(event) => { setSort(event.target.value); setCurrentPage(1); }} className="bg-transparent dark:bg-brand-card-dark"><option value="featured">Más destacados</option><option value="low">Precio menor</option><option value="high">Precio mayor</option></select></label></div>
        {error && <div role="alert" className="mb-4 text-red-600">{error} <button onClick={() => void refresh()} className="underline">Reintentar</button></div>}
        {loading ? <p>Cargando productos…</p> : visible.length === 0 ? <p className="p-8 text-center">No encontramos productos con esos filtros.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{visible.map((product) => <CatalogProductCard key={product.id} product={product} />)}</div>}
        {pageCount > 1 && <nav aria-label="Paginación del catálogo" className="flex flex-wrap justify-center items-center mt-10 gap-2 text-xs"><button aria-label="Productos anteriores" disabled={page === 1} onClick={() => setCurrentPage(page - 1)} className="p-2 border rounded disabled:opacity-40">Anterior</button>{pages.map((item) => <button key={item} aria-label={`Página ${item}`} aria-current={page === item ? "page" : undefined} onClick={() => setCurrentPage(item)} className={`p-2 rounded ${page === item ? "bg-brand-green text-black" : "border"}`}>{item}</button>)}<button aria-label="Productos siguientes" disabled={page === pageCount} onClick={() => setCurrentPage(page + 1)} className="p-2 border rounded disabled:opacity-40">Siguiente</button><span>Página {page} de {pageCount}</span></nav>}
      </div>
    </div>
  </div></div></AppLayout>;
}
