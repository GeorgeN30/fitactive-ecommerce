import { createContext, useContext, useEffect, useState } from "react";
import { SESSION_CLEARED_EVENT } from "../utils/session";

export interface FavoriteProduct {
  id: string;
  cat: string;
  name: string;
  price: number;
  img: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: FavoriteProduct) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback empty
    }
    return [];
  });

  useEffect(() => {
    const clearFavoritesOnSessionEnd = () => setFavorites([]);
    window.addEventListener(SESSION_CLEARED_EVENT, clearFavoritesOnSessionEnd);
    return () =>
      window.removeEventListener(SESSION_CLEARED_EVENT, clearFavoritesOnSessionEnd);
  }, []);

  useEffect(() => {
    try {
      if (favorites.length === 0) {
        localStorage.removeItem("favorites");
      } else {
        localStorage.setItem("favorites", JSON.stringify(favorites));
      }
    } catch (err) {
      console.error("Error saving favorites to localStorage:", err);
    }
  }, [favorites]);

  const addFavorite = (product: FavoriteProduct) => {
    setFavorites((prev) => {
      if (prev.some((item) => String(item.id) === String(product.id))) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const isFavorite = (id: string) => {
    return favorites.some((item) => String(item.id) === String(id));
  };

  const toggleFavorite = (product: FavoriteProduct) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => String(item.id) === String(product.id));
      if (exists) {
        return prev.filter((item) => String(item.id) !== String(product.id));
      }
      return [...prev, product];
    });
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites debe usarse dentro de FavoritesProvider");
  }

  return context;
}
