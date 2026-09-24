import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  registerPendingCheckout: (orderId: string) => void;
  completePendingCheckout: (orderId?: string) => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "fitactive-cart";
const PENDING_CHECKOUT_STORAGE_KEY = "fitlook:pending-checkout";

interface PendingCheckoutSnapshot {
  orderId: string;
  items: CartItem[];
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === "string" && item.id.length > 0 &&
    typeof item.name === "string" && typeof item.img === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 &&
    (item.size === undefined || typeof item.size === "string") &&
    (item.color === undefined || typeof item.color === "string") &&
    (item.stock === undefined || (typeof item.stock === "number" && Number.isInteger(item.stock) && item.stock >= 0)) &&
    (item.tallaId === undefined || typeof item.tallaId === "string");
}

function maxQuantity(stock: number | undefined): number {
  return typeof stock === "number" && Number.isFinite(stock) && stock > 0
    ? Math.floor(stock)
    : Number.MAX_SAFE_INTEGER;
}

function isPendingCheckoutSnapshot(value: unknown): value is PendingCheckoutSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<PendingCheckoutSnapshot>;
  return typeof snapshot.orderId === "string" && snapshot.orderId.length > 0 &&
    Array.isArray(snapshot.items) && snapshot.items.every(isCartItem);
}

function readPendingCheckout(): PendingCheckoutSnapshot | null {
  const raw = getSessionScopedValue(PENDING_CHECKOUT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPendingCheckoutSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function removePendingCheckoutStorage(): void {
  localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
  sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
}

function sameCartLine(left: CartItem, right: CartItem): boolean {
  if (left.tallaId && right.tallaId) return left.tallaId === right.tallaId;
  return left.id === right.id && left.size === right.size && left.color === right.color;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (!getStoredSessionValue("token")) {
      localStorage.removeItem(CART_STORAGE_KEY);
      sessionStorage.removeItem(CART_STORAGE_KEY);
      removePendingCheckoutStorage();
      return [];
    }

    const savedCart = getSessionScopedValue(CART_STORAGE_KEY);
    if (!savedCart) return [];
    try {
      const parsed: unknown = JSON.parse(savedCart);
      return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const clearCartOnSessionEnd = () => {
      removePendingCheckoutStorage();
      setCartItems([]);
    };
    window.addEventListener(SESSION_CLEARED_EVENT, clearCartOnSessionEnd);
    return () =>
      window.removeEventListener(SESSION_CLEARED_EVENT, clearCartOnSessionEnd);
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      sessionStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    const persistence = getSessionPersistence();
    const storage = persistence === "session" ? sessionStorage : localStorage;
    localStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CART_STORAGE_KEY);
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
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
        const stock = item.stock ?? existingItem.stock;
        const nextQuantity = Math.min(
          maxQuantity(stock),
          existingItem.quantity + Math.max(1, item.quantity),
        );
        return currentItems.map((cartItem) =>
          cartItem.id === item.id &&
          cartItem.size === item.size &&
          cartItem.color === item.color
            ? {
                ...cartItem,
                stock,
                quantity: nextQuantity,
              }
            : cartItem,
        );
      }

      return [
        ...currentItems,
        { ...item, quantity: Math.min(item.quantity, maxQuantity(item.stock)) },
      ];
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
              quantity: Math.min(quantity, maxQuantity(item.stock)),
            }
          : item,
      ),
    );
  };

  const clearCart = useCallback(() => {
    removePendingCheckoutStorage();
    setCartItems([]);
  }, []);

  const registerPendingCheckout = useCallback((orderId: string) => {
    if (!orderId || cartItems.length === 0) return;
    const persistence = getSessionPersistence();
    if (!persistence) return;
    const storage = persistence === "session" ? sessionStorage : localStorage;
    removePendingCheckoutStorage();
    storage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify({
      orderId,
      items: cartItems,
    } satisfies PendingCheckoutSnapshot));
  }, [cartItems]);

  const completePendingCheckout = useCallback((orderId?: string) => {
    const snapshot = readPendingCheckout();
    if (!snapshot || (orderId && snapshot.orderId !== orderId)) return;

    setCartItems((currentItems) => currentItems.flatMap((item) => {
      const purchased = snapshot.items.find((candidate) => sameCartLine(candidate, item));
      if (!purchased) return [item];
      const remainingQuantity = item.quantity - purchased.quantity;
      return remainingQuantity > 0 ? [{ ...item, quantity: remainingQuantity }] : [];
    }));
    removePendingCheckoutStorage();
  }, []);

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
        registerPendingCheckout,
        completePendingCheckout,
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
