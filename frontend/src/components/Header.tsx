import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import ThemeToggle from "./ThemeToggle";
import { fetchCatalogProducts, getCatalogPrice, type CatalogProduct } from "../services/catalog";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop&auto=format";

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const isInventoryUser =
    user?.role === "inventory" || user?.role === "receptionist";
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { favorites } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCatalogProducts()
      .then((products) => {
        if (!cancelled) setAllProducts(products);
      })
      .catch(() => {
        // Si falla la carga, simplemente no se mostrarán sugerencias.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      const matches = allProducts
        .filter(
          (product) =>
            product.nombre.toLowerCase().includes(query) ||
            (product.categoria || "").toLowerCase().includes(query) ||
            (product.marca || "").toLowerCase().includes(query)
        )
        .slice(0, 6);
      setSuggestions(matches);
      setShowSuggestions(true);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, allProducts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runSearch = (term: string) => {
    if (term.trim() === "") return;
    setShowSuggestions(false);
    navigate(`/catalogo?search=${encodeURIComponent(term)}`);
  };

  const goToProduct = (product: CatalogProduct) => {
    setShowSuggestions(false);
    setSearchTerm("");
    navigate(`/producto/${product.id}`);
  };

  return (
    <header className="bg-white dark:bg-brand-card-dark border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              FIT<span className="text-brand-green">LOOK</span>
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-brand-green px-2 py-0.5 rounded border border-brand-green/30 tracking-wider hidden sm:inline">
              AR FIT
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-600 dark:text-slate-400">
          <Link to="/" className="hover:text-brand-green transition-colors">
            Inicio
          </Link>
          <Link
            to="/catalogo"
            className="hover:text-brand-green transition-colors"
          >
            Catalogo
          </Link>
          <Link
            to="/probador-virtual"
            className="hover:text-brand-green transition-colors"
          >
            Probador Virtual
          </Link>
          <Link
            to="/favoritos"
            className="hover:text-brand-green transition-colors flex items-center gap-1.5"
          >
            Favoritos
            {favorites.length > 0 && (
              <span className="bg-brand-green text-slate-900 text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div
            ref={searchRef}
            className={`relative hidden sm:block w-64 lg:w-80 transition-all ${
              searchFocused ? "w-80 lg:w-96" : ""
            }`}
          >
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  runSearch(searchTerm);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                setSearchFocused(true);
                if (searchTerm.trim() !== "" && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 rounded-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-brand-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 max-h-96 overflow-y-auto">
                {suggestions.map((product) => {
                  const pricing = getCatalogPrice(product);
                  const image = product.imagenUrl || FALLBACK_IMAGE;
                  return (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => goToProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <img
                        src={image}
                        alt={product.nombre}
                        className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                          {product.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {product.categoria || "General"}
                          {product.marca ? ` - ${product.marca}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                        S/ {pricing.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => runSearch(searchTerm)}
                  className="w-full text-left px-4 py-2 mt-1 border-t border-slate-100 dark:border-slate-700 text-[11px] font-bold text-brand-green hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  Ver todos los resultados para "{searchTerm}"
                </button>
              </div>
            )}

            {showSuggestions && suggestions.length === 0 && searchTerm.trim() !== "" && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-brand-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-3 px-4 z-50">
                <p className="text-xs text-slate-400">Sin coincidencias para "{searchTerm}"</p>
              </div>
            )}
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-green-hover transition-colors"
            >
              <i className="fa-solid fa-shield-halved" />
              Admin
            </Link>
          )}

          {isInventoryUser && (
            <Link
              to="/inventory"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <i className="fa-solid fa-boxes-stacked" />
              Inventario
            </Link>
          )}

          {user ? (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-xs font-bold">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-slate-700 dark:text-slate-300 max-w-[120px] truncate hidden sm:inline">
                  {user.name || user.email}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-brand-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        <i className="fa-solid fa-shield-halved mr-2 text-xs" />
                        2FA
                      </span>
                      {user.twoFactorEnabled ? (
                        <span className="text-[10px] font-bold bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Activo
                        </span>
                      ) : (
                        <Link
                          to="/2fa-setup"
                          onClick={() => setMenuOpen(false)}
                          className="text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          Configurar
                        </Link>
                      )}
                    </div>

                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        <i className="fa-solid fa-coins mr-2 text-xs" />
                        Puntos
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {user.points || 0}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-gear text-xs" />
                      Configuracion
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-right-from-bracket text-xs" />
                      Cerrar sesion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2" ref={ref}>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-semibold text-brand-green border border-brand-green/30 rounded-lg hover:bg-brand-green/5 transition-colors"
              >
                Iniciar sesion
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-bold text-slate-900 bg-brand-green rounded-lg hover:bg-brand-green-hover transition-colors shadow-sm shadow-brand-green/20"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          <Link
            to="/carrito"
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Carrito"
          >
            <i className="fa-solid fa-bag-shopping text-lg" />

            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-brand-green text-slate-900 text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-brand-card-dark">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}