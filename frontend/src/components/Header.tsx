import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import ThemeToggle from "./ThemeToggle";
import NotificationToast from "./NotificationToast";
import { fetchCatalogProducts, getCatalogPrice, type CatalogProduct } from "../services/catalog";
import {
  connectAdminSocket,
  fetchNotifications,
  mapLiveEventToCustomerNotification,
  NOTIFICATIONS_UPDATED_EVENT,
  type AdminNotification,
  type LiveEvent,
} from "../services/notifications";

const SEARCH_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop&auto=format";

function checkoutCompletedByEvent(event: LiveEvent): boolean {
  if (event.type === "PAYMENT_STATUS") {
    return String(event.data?.paymentStatus || "").toLowerCase() === "approved";
  }
  if (event.type !== "ORDER_STATUS") return false;
  const status = String(event.data?.status || "").trim().toLowerCase();
  return ["confirmado", "preparando", "enviado", "entregado"].includes(status);
}

function checkoutCompletedByNotification(notification: AdminNotification): boolean {
  const value = `${notification.title} ${notification.message}`.toLowerCase();
  return value.includes("pago aprobado") ||
    ["confirmado", "preparando", "enviado", "entregado"].some((status) =>
      value.includes(`estado: ${status}`),
    );
}

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const isInventoryUser =
    user?.role === "inventory" || user?.role === "receptionist";
  const navigate = useNavigate();
  const { cartCount, completePendingCheckout } = useCart();
  const { favorites } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [customerToast, setCustomerToast] = useState<{
    title: string;
    message: string;
    kind?: "info" | "critical" | "success";
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCatalogProducts()
      .then((loadedProducts) => {
        if (!cancelled) setAllProducts(loadedProducts);
      })
      .catch(() => {
        if (!cancelled) setAllProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== "customer") {
      setUnreadNotifications(0);
      setCustomerToast(null);
      return;
    }

    let active = true;
    let toastTimer: number | undefined;

    const refreshNotifications = async () => {
      try {
        const notifications = await fetchNotifications();
        if (!active) return;
        setUnreadNotifications(notifications.filter((item) => !item.read).length);
        for (const notification of notifications) {
          if (!notification.read && notification.referenceId && checkoutCompletedByNotification(notification)) {
            completePendingCheckout(notification.referenceId);
          }
        }
      } catch {
        // El socket seguirá intentando; el sondeo es solo respaldo.
      }
    };

    void refreshNotifications();
    const disconnect = connectAdminSocket((event) => {
      if (!["NEW_ORDER", "ORDER_STATUS", "PAYMENT_STATUS"].includes(event.type)) return;
      const notification = mapLiveEventToCustomerNotification(event);
      setUnreadNotifications((current) => current + 1);
      setCustomerToast({
        title: notification.title,
        message: notification.message,
        kind: notification.priority === "high"
          ? "critical"
          : event.type === "PAYMENT_STATUS" && String(event.data?.paymentStatus || "").toLowerCase() === "approved"
            ? "success"
            : "info",
      });
      if (checkoutCompletedByEvent(event)) {
        completePendingCheckout(String(event.data?.orderId || ""));
      }
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setCustomerToast(null), 6000);
      window.setTimeout(() => void refreshNotifications(), 700);
    });
    const pollingTimer = window.setInterval(() => void refreshNotifications(), 15000);
    const handleNotificationsUpdated = () => void refreshNotifications();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);

    return () => {
      active = false;
      disconnect();
      window.clearInterval(pollingTimer);
      window.clearTimeout(toastTimer);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    };
  }, [completePendingCheckout, user?.id, user?.role]);

  useEffect(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      const matches = allProducts
        .filter((product) => [
          product.nombre,
          product.categoria || "",
          product.marca || "",
        ].some((value) => value.toLowerCase().includes(query)))
        .slice(0, 6);
      setSuggestions(matches);
      setShowSuggestions(true);
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [allProducts, searchTerm]);

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
    const normalizedTerm = term.trim();
    if (!normalizedTerm) return;
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    navigate(`/catalogo?search=${encodeURIComponent(normalizedTerm)}`);
  };

  const goToProduct = (product: CatalogProduct) => {
    setShowSuggestions(false);
    setSearchTerm("");
    navigate(`/producto/${product.id}`);
  };

  return (
    <>
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
            to="/producto/1"
            className="hover:text-brand-green transition-colors"
          >
            Probador Virtual
          </Link>
          {user && (
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
          )}
          {user && (
            <Link to="/mis-compras" className="hover:text-brand-green transition-colors">
              Mis compras
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 md:hidden"
          >
            <i
              className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"} text-lg`}
            />
          </button>

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
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(searchTerm);
                if (event.key === "Escape") setShowSuggestions(false);
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 rounded-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-green/50 transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-brand-card-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 max-h-96 overflow-y-auto">
                {suggestions.map((product) => {
                  const pricing = getCatalogPrice(product);
                  return (
                    <button
                      type="button"
                      key={product.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goToProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <img
                        src={product.imagenUrl || SEARCH_FALLBACK_IMAGE}
                        alt={product.nombre}
                        className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-700"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-slate-800 dark:text-white truncate">{product.nombre}</span>
                        <span className="block text-[10px] text-slate-400 truncate">{product.categoria || "General"}{product.marca ? ` - ${product.marca}` : ""}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">S/ {pricing.price.toFixed(2)}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
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
                      to="/mis-compras"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-receipt text-xs" />
                      Mis compras
                    </Link>
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

          {user && (
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
          )}

          {user?.role === "customer" && (
            <Link
              to="/notificaciones"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <i className="fa-solid fa-bell text-lg" />
              {unreadNotifications > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[9px] font-black leading-none text-white dark:border-brand-card-dark">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-slate-700/50 dark:bg-brand-card-dark md:hidden">
          <div className="mb-4 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(searchTerm);
              }}
              className="w-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 rounded-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-green/50"
            />
          </div>

          <nav className="grid gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
            >
              <i className="fa-solid fa-house mr-3 w-4 text-center text-xs" />
              Inicio
            </Link>
            <Link
              to="/catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
            >
              <i className="fa-solid fa-shirt mr-3 w-4 text-center text-xs" />
              Catálogo
            </Link>
            <Link
              to="/producto/1"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-3 w-4 text-center text-xs" />
              Probador virtual
            </Link>
            {user && (
              <>
                <Link
                  to="/favoritos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
                >
                  <span>
                    <i className="fa-solid fa-heart mr-3 w-4 text-center text-xs" />
                    Favoritos
                  </span>
                  {favorites.length > 0 && (
                    <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-slate-900">
                      {favorites.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/carrito"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
                >
                  <span>
                    <i className="fa-solid fa-bag-shopping mr-3 w-4 text-center text-xs" />
                    Carrito
                  </span>
                  {cartCount > 0 && (
                    <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-slate-900">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/mis-compras"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
                >
                  <i className="fa-solid fa-receipt mr-3 w-4 text-center text-xs" />
                  Mis compras
                </Link>
                {user.role === "customer" && (
                  <Link
                    to="/notificaciones"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
                  >
                    <span>
                      <i className="fa-solid fa-bell mr-3 w-4 text-center text-xs" />
                      Notificaciones
                    </span>
                    {unreadNotifications > 0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-brand-green hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <i className="fa-solid fa-shield-halved mr-3 w-4 text-center text-xs" />
                Admin
              </Link>
            )}
            {isInventoryUser && (
              <Link
                to="/inventory"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-amber-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <i className="fa-solid fa-boxes-stacked mr-3 w-4 text-center text-xs" />
                Inventario
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-3 hover:bg-slate-50 hover:text-brand-green dark:hover:bg-slate-700/50"
                >
                  <i className="fa-solid fa-gear mr-3 w-4 text-center text-xs" />
                  Configuración
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate("/");
                  }}
                  className="w-full rounded-lg px-3 py-3 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <i className="fa-solid fa-right-from-bracket mr-3 w-4 text-center text-xs" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 rounded-lg border border-brand-green/30 px-3 py-3 text-center text-brand-green hover:bg-brand-green/5"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-brand-green px-3 py-3 text-center font-bold text-slate-900 hover:bg-brand-green-hover"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
    <NotificationToast
      notification={customerToast}
      onClose={() => setCustomerToast(null)}
      onOpen={() => {
        setCustomerToast(null);
        navigate("/notificaciones");
      }}
    />
    </>
  );
}
