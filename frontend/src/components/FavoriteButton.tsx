import { type ReactNode } from "react";
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
  const favoritesCtx = useFavorites();
  const active = typeof favoritesCtx?.isFavorite === "function" ? Boolean(favoritesCtx.isFavorite(product.id)) : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof favoritesCtx?.toggleFavorite === "function") {
      favoritesCtx.toggleFavorite(product);
    } else if (typeof favoritesCtx?.addFavorite === "function") {
      favoritesCtx.addFavorite(product);
    }
  };

  return (
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
          className={`fa-solid fa-heart transition-colors ${
            active ? "text-red-500" : "text-gray-400 hover:text-red-400"
          } ${iconClassName}`}
        />
      )}
    </button>
  );
}
