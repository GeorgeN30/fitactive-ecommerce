import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import ModalPortal from "./ModalPortal";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export interface FavoriteButtonProduct {
  id: string;
  cat: string;
  name: string;
  price: number;
  img: string;
}

interface FavoriteButtonProps {
  product: FavoriteButtonProduct;
  className: string;
  iconClassName?: string;
  children?: (active: boolean) => ReactNode;
}

export default function FavoriteButton({
  product,
  className,
  iconClassName = "",
  children,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const active = isFavorite(product.id);

  const handleClick = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    toggleFavorite(product);
  };

  return (
    <>
      <button
        type="button"
        aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
        onClick={handleClick}
        className={className}
      >
        {children ? (
          children(active)
        ) : (
          <i
            className={`fa-solid fa-heart ${
              active ? "text-red-500" : "text-gray-400"
            } ${iconClassName}`}
          />
        )}
      </button>

      {showAuthPrompt && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => setShowAuthPrompt(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="favorite-auth-title"
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-card-dark animate-fade-in"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-green">
                    Favoritos
                  </p>
                  <h2
                    id="favorite-auth-title"
                    className="text-xl font-extrabold text-slate-900 dark:text-white"
                  >
                    Guarda tus productos favoritos
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setShowAuthPrompt(false)}
                  className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Inicia sesión o crea una cuenta para guardar este producto y
                verlo después en Favoritos.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-xl border border-brand-green px-4 py-3 text-sm font-bold text-brand-green transition hover:bg-brand-green/10"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-brand-green-hover"
                >
                  Crear cuenta
                </button>
              </div>
            </section>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
