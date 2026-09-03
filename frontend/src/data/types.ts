export type Sport = "Running" | "Gym" | "Cycling" | "CrossFit" | "Yoga";
export type ProductCategory = "Clothing" | "Footwear" | "Accessories";
export type ProductStatus = "Active" | "OutOfStock" | "Inactive";
export type OrderStatus = "Confirmed" | "Preparing" | "Pending" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
export type CustomerStatus = "Active" | "Blocked";
export type CustomerRole = "Customer" | "Admin";
export type MovementType = "Entry" | "Exit" | "Adjustment";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface ProductSizeStock {
  size: Size;
  stock: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  sport: Sport;
  price: number;
  sizes: ProductSizeStock[];
  totalStock: number;
  status: ProductStatus;
  imageUrl: string;
  isPublished: boolean;
}

export interface OrderItem {
  name: string;
  size: Size;
  quantity: number;
  price: number;
  sku: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
}

export interface CustomerOrder {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  registrationDate: string;
  ordersCount: number;
  totalSpent: number;
  status: CustomerStatus;
  role: CustomerRole;
  recentOrders: CustomerOrder[];
}

export interface InventoryMovement {
  id: string;
  datetime: string;
  productName: string;
  type: MovementType;
  quantity: number;
  responsible: string;
  note?: string;
}

export interface DashboardStats {
  totalSales: number;
  salesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  activeCustomers: number;
  customersGrowth: number;
  productsSold: number;
  productsGrowth: number;
}

export interface TopProduct {
  name: string;
  unitsSold: number;
  percentage: number;
}

export interface CategoryData {
  name: string;
  percentage: number;
  color: string;
}

export interface SalesDataPoint {
  label: string;
  value: number;
}

export interface ArMetrics {
  totalTests: number;
  testsGrowth: number;
  garmentsTried: number;
  garmentsGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  outfitsCreated: number;
  outfitsGrowth: number;
  avgTimeMinutes: number;
  avgTimeGrowth: number;
}

export interface ArTopProduct {
  name: string;
  tryOns: number;
  conversionRate: number;
}

export interface ArOutfit {
  name: string;
  uses: number;
  garmentCount: number;
}

export interface ConversionCategory {
  name: string;
  conversionRate: number;
  tests: number;
  purchases: number;
}

export interface ConversionFunnel {
  step: string;
  count: number;
  percentage: number;
  description: string;
}

export interface Notification {
  id: string;
  type: "order" | "alert";
  title: string;
  detail: string;
  targetTab: string;
}
