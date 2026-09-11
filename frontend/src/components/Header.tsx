import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import ThemeToggle from "./ThemeToggle";
import api from "../services/api";

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const isInventoryUser = user?.role === "inventory" || user?.role === "receptionist";
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { favorites } = useFavorites();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setAllProducts(Array.isArray(response.data) ? response.data : (response.data.data || []));
      } catch (error) {
        console.error("Error al cargar productos para la búsqueda:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    if (searchQuery.trim() !== "") {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/catalogo`);
    }
  };

  const handleSelectResult = (path: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  };

  const { filteredBrands, filteredProducts } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { filteredBrands: [], filteredProducts: [] };

    const brands = Array.from(new Set(allProducts.map(p => p.marca).filter(Boolean)));
    const matchingBrands = brands.filter(b => b.toLowerCase().includes(query)).slice(0, 3);

    const matchingProducts = allProducts.filter(p => 
      (p.nombre || p.name || '').toLowerCase().includes(query) || 
      (p.marca || '').toLowerCase().includes(query)
    ).slice(0, 4);

    return { filteredBrands: matchingBrands, filteredProducts: matchingProducts };
  }, [searchQuery, allProducts]);

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
          <Link to="/catalogo" className="hover:text-brand-green transition-colors">
            Catalogo
          </Link>
          <Link to="/probador-virtual" className="hover:text-brand-green transition-colors">
            Probador Virtual
          </Link>
          <Link to="/favoritos" className="hover:text-brand-green transition-colors flex items-center gap-1.5">
            Favoritos
            {favorites?.length > 0 && (
              <span className="bg-brand-green text-slate-900 text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <form
            ref={searchContainerRef}
            onSubmit={handleSearchSubmit}
            className={`relative hidden sm:block w-64 lg:w-80 transition-all z-50 ${
              searchFocused ? "w-80 lg:w-96" : ""
            }`}
          >
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => {
                setSearchFocused(true);
                if (searchQuery.trim() !== "") setSearchOpen(true);
              }}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 rounded-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all"
            />

            {searchOpen && searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 mt-3 w-full bg-white dark:bg-brand-card-dark rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 py-3 overflow-hidden">
                {filteredBrands.length > 0 && (
                  <div className="mb-2">
                    <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marcas</h4>
                    {filteredBrands.map(marca => (
                      <button 
                        key={marca} 
                        type="button"
                        onClick={() => handleSelectResult(`/catalogo?q=${encodeURIComponent(marca)}`)}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-tag text-xs text-brand-green/70"></i>
                        {marca}
                      </button>
                    ))}
                  </div>
                )}

                {filteredBrands.length > 0 && filteredProducts.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-white/5 my-2"></div>
                )}

                {filteredProducts.length > 0 && (
                  <div>
                    <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-1">Productos</h4>
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id} 
                        type="button"
                        onClick={() => handleSelectResult(`/producto/${p.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-10 h-12 bg-slate-100 dark:bg-black/20 rounded-md overflow-hidden flex-shrink-0">
                          <img src={p.imagen_url || p.img} alt={p.nombre} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{p.nombre || p.name}</p>
                          <p className="text-[10px] font-black text-brand-green mt-0.5">${p.precio || p.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredBrands.length === 0 && filteredProducts.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-medium text-slate-500">No encontramos resultados para "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </form>

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
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
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
            <div className="flex items-center gap-2">
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