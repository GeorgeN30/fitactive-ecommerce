import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import CatalogProductCard from "../components/CatalogProductCard";
import { useCatalog } from "../hooks/useCatalog";
import { getCatalogPrice } from "../services/catalog";

function genderLabel(value: string | null): "Hombre" | "Mujer" | null {
  const gender = value?.trim().toLowerCase();
  if (["male", "hombre", "masculino"].includes(gender || "")) return "Hombre";
  if (["female", "mujer", "femenino"].includes(gender || "")) return "Mujer";
  return null;
}

export default function CatalogPage() {
  const { products, loading, error, refresh } = useCatalog();
  const { search } = useLocation();
  const [params, setParams] = useSearchParams();
  const searchQuery = params.get("search")?.trim().toLowerCase() || "";
  const onlyOffers = params.get("ofertas") === "1";
  const genderParam = params.get("genero");
  const initialGender = genderParam === "Mujer" ? "Mujer" : genderParam === "Hombre" ? "Hombre" : "Todos";

  const [gender, setGender] = useState<"Todos" | "Hombre" | "Mujer">(initialGender);
  const [size, setSize] = useState<string | null>(null);
  const [category, setCategory] = useState("Todas");
  const [brand, setBrand] = useState("Todas");
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    if (genderParam === "Mujer" || genderParam === "Hombre") {
      setGender(genderParam);
    } else {
      setGender("Todos");
    }
  }, [search, genderParam]);

  // Excluir cualquier producto sin género o sin tallas estándar
  const validProducts = useMemo(() => {
    return products.filter((p) => {
      const g = genderLabel(p.genero);
      const hasStandardSizes = Array.isArray(p.tallas) && p.tallas.length > 0;
      return g !== null && hasStandardSizes;
    });
  }, [products]);

  const categories = useMemo(() => {
    return [
      "Todas",
      ...new Set(
        validProducts
          .filter((p) => gender === "Todos" || genderLabel(p.genero) === gender)
          .map((p) => p.categoria)
          .filter((v): v is string => !!v)
      ),
    ];
  }, [validProducts, gender]);

  const brands = useMemo(() => {
    return [
      "Todas",
      ...new Set(validProducts.map((p) => p.marca).filter((v): v is string => !!v)),
    ];
  }, [validProducts]);

  const filtered = useMemo(() => {
    return validProducts
      .filter((p) => {
        const prodGender = genderLabel(p.genero);
        const matchGender = gender === "Todos" || prodGender === gender;
        const matchSize = !size || p.tallas.some((s) => s.talla.toUpperCase() === size.toUpperCase() && s.stock > 0);
        const matchStock = !inStock || p.totalStock > 0;
        const matchCategory = category === "Todas" || p.categoria === category;
        const matchBrand = brand === "Todas" || p.marca === brand;
        const matchOffers = !onlyOffers || getCatalogPrice(p).discount > 0;
        const matchSearch =
          !searchQuery ||
          [p.nombre, p.categoria || "", p.marca || ""].some((value) =>
            value.toLowerCase().includes(searchQuery)
          );

        return (
          matchGender &&
          matchSize &&
          matchStock &&
          matchCategory &&
          matchBrand &&
          matchOffers &&
          matchSearch
        );
      })
      .sort((a, b) => {
        if (sort === "low") return getCatalogPrice(a).price - getCatalogPrice(b).price;
        if (sort === "high") return getCatalogPrice(b).price - getCatalogPrice(a).price;
        return b.totalStock - a.totalStock;
      });
  }, [validProducts, gender, size, inStock, category, brand, onlyOffers, searchQuery, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const page = Math.min(currentPage, pageCount);
  const visible = filtered.slice((page - 1) * 6, page * 6);
  const first = Math.floor((page - 1) / 5) * 5 + 1;
  const pages = Array.from(
    { length: Math.min(5, pageCount - first + 1) },
    (_, index) => first + index
  );

  const clear = () => {
    setGender("Todos");
    setSize(null);
    setCategory("Todas");
    setBrand("Todas");
    setInStock(true);
    setCurrentPage(1);
    setParams({});
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg text-gray-900 dark:text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">Catálogo Deportivo</h1>
              <p className="text-sm text-gray-500">
                Prendas oficiales configuradas para Hombre y Mujer con tallas y stock en tiempo real.
              </p>
            </div>

            {/* Selector de Género Principal */}
            <div className="flex bg-white dark:bg-brand-card-dark p-1 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              {(["Todos", "Hombre", "Mujer"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGender(g);
                    setCategory("Todas");
                    setCurrentPage(1);
                    const next = new URLSearchParams(params);
                    if (g === "Todos") next.delete("genero");
                    else next.set("genero", g);
                    setParams(next);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    gender === g
                      ? "bg-brand-green text-black shadow-sm"
                      : "text-gray-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 shrink-0 bg-white dark:bg-brand-card-dark p-6 rounded-3xl h-fit space-y-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-sm">Filtros</h2>
                <button
                  onClick={clear}
                  className="text-xs font-bold text-emerald-700 dark:text-brand-green hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              </div>

              {/* Categoría */}
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Categoría
                <select
                  aria-label="Filtrar por categoría"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full mt-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              {/* Marca */}
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Marca
                <select
                  aria-label="Filtrar por marca"
                  value={brand}
                  onChange={(event) => {
                    setBrand(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full mt-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200"
                >
                  {brands.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              {/* Talla Estándar */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Talla Estándar
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((item) => (
                    <button
                      key={item}
                      aria-pressed={size === item}
                      onClick={() => {
                        setSize(size === item ? null : item);
                        setCurrentPage(1);
                      }}
                      className={`rounded-xl w-10 h-10 text-xs font-black transition-all cursor-pointer ${
                        size === item
                          ? "bg-brand-green text-black shadow-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    aria-label="Filtrar productos en stock"
                    type="checkbox"
                    checked={inStock}
                    onChange={(event) => {
                      setInStock(event.target.checked);
                      setCurrentPage(1);
                    }}
                    className="accent-brand-green rounded"
                  />
                  <span>Solo en stock</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    aria-label="Solo productos en descuento"
                    type="checkbox"
                    checked={onlyOffers}
                    onChange={(event) => {
                      const next = new URLSearchParams(params);
                      if (event.target.checked) next.set("ofertas", "1");
                      else next.delete("ofertas");
                      setParams(next);
                    }}
                    className="accent-brand-green rounded"
                  />
                  <span>Solo ofertas vigentes</span>
                </label>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white dark:bg-brand-card-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Mostrando <strong className="text-gray-900 dark:text-white">{visible.length}</strong> de{" "}
                  {filtered.length} prendas{searchQuery && ` · Búsqueda: "${searchQuery}"`}
                </p>

                <label className="text-xs font-bold flex items-center gap-2">
                  <span>Ordenar:</span>
                  <select
                    aria-label="Ordenar productos"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="featured">Más destacados</option>
                    <option value="low">Precio menor</option>
                    <option value="high">Precio mayor</option>
                  </select>
                </label>
              </div>

              {error && (
                <div role="alert" className="mb-4 text-red-600 p-4 rounded-2xl bg-red-50 text-xs font-bold">
                  {error}{" "}
                  <button onClick={() => void refresh()} className="underline cursor-pointer">
                    Reintentar
                  </button>
                </div>
              )}

              {loading ? (
                <p className="p-8 text-center text-xs font-bold text-gray-500">Cargando catálogo…</p>
              ) : visible.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-brand-card-dark rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-500">No encontramos prendas con esos filtros.</p>
                  <button
                    onClick={clear}
                    className="mt-3 px-4 py-2 bg-brand-green text-black text-xs font-black rounded-xl hover:opacity-90"
                  >
                    Ver todas las prendas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((product) => (
                    <CatalogProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {pageCount > 1 && (
                <nav
                  aria-label="Paginación del catálogo"
                  className="flex flex-wrap justify-center items-center mt-10 gap-2 text-xs"
                >
                  <button
                    aria-label="Productos anteriores"
                    disabled={page === 1}
                    onClick={() => setCurrentPage(page - 1)}
                    className="p-2 border rounded-xl disabled:opacity-30 cursor-pointer bg-white dark:bg-brand-card-dark"
                  >
                    Anterior
                  </button>
                  {pages.map((item) => (
                    <button
                      key={item}
                      aria-label={`Página ${item}`}
                      aria-current={page === item ? "page" : undefined}
                      onClick={() => setCurrentPage(item)}
                      className={`px-3 py-2 rounded-xl font-bold cursor-pointer ${
                        page === item
                          ? "bg-brand-green text-black shadow-sm"
                          : "border bg-white dark:bg-brand-card-dark hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    aria-label="Productos siguientes"
                    disabled={page === pageCount}
                    onClick={() => setCurrentPage(page + 1)}
                    className="p-2 border rounded-xl disabled:opacity-30 cursor-pointer bg-white dark:bg-brand-card-dark"
                  >
                    Siguiente
                  </button>
                  <span className="text-xs text-gray-500 ml-2">
                    Página {page} de {pageCount}
                  </span>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
