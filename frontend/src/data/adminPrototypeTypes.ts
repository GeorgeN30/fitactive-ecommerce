export type ViewName =
  | 'home' | 'login' | 'register'
  | 'catalog' | 'product'
  | 'favorites' | 'profile'
  | 'fitter' | 'cart' | 'checkout'
  | 'order-success' | 'order-tracking' | 'notifications'
  | 'admin' | 'inventory';

export interface Product {
  id: string;
  name: string;
  category: string;
  sport: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  sizes: string[];
  availableColors: { name: string; hex: string }[];
  description: string;
  stock: Record<string, number>;
  gender: 'male' | 'female' | 'unisex';
  tag?: 'new' | 'sale' | 'trending';
  measurements: {
    chest: [number, number];
    waist: [number, number];
    hips: [number, number];
    inseam?: [number, number];
  };
  featured: boolean;
  minStock: number;
}

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface UserMeasurements {
  height: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  build: 'slim' | 'regular' | 'athletic' | 'plus';
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'client' | 'admin' | 'inventory';
  measurements?: UserMeasurements;
  blocked?: boolean;
  registeredAt: string;
  lastAccess: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  date: string;
  estimatedDelivery: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'return';
  address: string;
  district: string;
  city: string;
  paymentMethod: string;
  customer: { name: string; email: string; phone: string };
}

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'recommendation' | 'return' | 'payment' | 'delivery';
  title: string;
  message: string;
  date: string;
  read: boolean;
}
