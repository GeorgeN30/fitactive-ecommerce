import { createContext, useContext, useEffect, useState } from "react";
import {
  getSessionPersistence,
  getSessionScopedValue,
  getStoredSessionValue,
  SESSION_CLEARED_EVENT,
} from "../utils/session";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  img: string;
  quantity: number;
  size?: string;
  color?: string;
  stock?: number;
  tallaId?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  updateQuantity: (
    id: string,
    quantity: number,
    size?: string,
    color?: string,
  ) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === "string" && item.id.length > 0 &&
    typeof item.name === "string" && typeof item.img === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 &&
    (item.size === undefined || typeof item.size === "string") &&
    (item.color === undefined || typeof item.color === "string") &&
    (item.tallaId === undefined || typeof item.tallaId === "string");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (!getStoredSessionValue("token")) {
      localStorage.removeItem("fitactive-cart");
      return [];
    }

    const savedCart = getSessionScopedValue("fitactive-cart");
    if (!savedCart) return [];
    try {
      const parsed: unknown = JSON.parse(savedCart);
      return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const clearCartOnSessionEnd = () => setCartItems([]);
    window.addEventListener(SESSION_CLEARED_EVENT, clearCartOnSessionEnd);
    return () =>
      window.removeEventListener(SESSION_CLEARED_EVENT, clearCartOnSessionEnd);
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      localStorage.removeItem("fitactive-cart");
      sessionStorage.removeItem("fitactive-cart");
      return;
    }
    const persistence = getSessionPersistence();
    const storage = persistence === "session" ? sessionStorage : localStorage;
    localStorage.removeItem("fitactive-cart");
    sessionStorage.removeItem("fitactive-cart");
    storage.setItem("fitactive-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.size === item.size &&
          cartItem.color === item.color,
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.id === item.id &&
          cartItem.size === item.size &&
          cartItem.color === item.color
            ? {
                ...cartItem,
                quantity: cartItem.quantity + item.quantity,
              }
            : cartItem,
        );
      }

      return [...currentItems, item];
    });
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(item.id === id && item.size === size && item.color === color),
      ),
    );
  };

  const updateQuantity = (
    id: string,
    quantity: number,
    size?: string,
    color?: string,
  ) => {
    if (quantity < 1) return;

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && item.size === size && item.color === color
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe utilizarse dentro de CartProvider");
  }

  return context;
}
