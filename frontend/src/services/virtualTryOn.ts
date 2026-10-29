import api from "./api";

export type VirtualTryOnEventType =
  | "session_started"
  | "try_on"
  | "fit_result"
  | "cart_added"
  | "purchase"
  | "outfit_created";

export type VirtualTryOnPeriod = "today" | "week" | "month" | "year" | "custom";

export interface VirtualTryOnEventInput {
  sessionId: string;
  type: VirtualTryOnEventType;
  productId?: string;
  size?: string;
  gender?: string;
  compatibility?: number;
  durationSeconds?: number;
  orderId?: string;
}

export interface VirtualTryOnSummary {
  period: VirtualTryOnPeriod;
  periodLabel: string;
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
  topProducts: { name: string; tryOns: number; purchases: number; conversionRate: number }[];
  genderUsage: { name: string; count: number; percentage: number }[];
  sizeUsage: { size: string; count: number; percentage: number }[];
  categoryConversion: {
    name: string;
    conversionRate: number;
    tests: number;
    purchases: number;
  }[];
  funnel: {
    step: string;
    count: number;
    percentage: number;
    description: string;
  }[];
}

export const VIRTUAL_TRYON_SESSION_KEY = "fitlook:virtual-tryon-session";
const VIRTUAL_TRYON_PRODUCTS_KEY = "fitlook:virtual-tryon-products";

export function getVirtualTryOnSessionId(): string {
  const existing = sessionStorage.getItem(VIRTUAL_TRYON_SESSION_KEY);
  if (existing) return existing;

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const generated = typeof crypto.randomUUID === "function" ? crypto.randomUUID()
    : `tryon-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  sessionStorage.setItem(VIRTUAL_TRYON_SESSION_KEY, generated);
  return generated;
}

export function markVirtualTryOnProduct(productId: string): void {
  const current = getVirtualTryOnProducts();
  if (!current.includes(productId)) {
    sessionStorage.setItem(VIRTUAL_TRYON_PRODUCTS_KEY, JSON.stringify([...current, productId]));
  }
}

export function hasVirtualTryOnProduct(productId: string): boolean {
  return getVirtualTryOnProducts().includes(productId);
}

function getVirtualTryOnProducts(): string[] {
  const stored = sessionStorage.getItem(VIRTUAL_TRYON_PRODUCTS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export async function trackVirtualTryOnEvent(input: VirtualTryOnEventInput): Promise<void> {
  await api.post("/virtual-tryon/events", input);
}

export async function fetchVirtualTryOnSummary(
  period: VirtualTryOnPeriod = "month",
  date?: string,
): Promise<VirtualTryOnSummary> {
  const { data } = await api.get("/admin/virtual-tryon/summary", {
    params: { period, ...(date ? { date } : {}) },
  });
  return data.summary as VirtualTryOnSummary;
}


export interface UserTryOnHistoryItem {
  id: string;
  usuario_id: string;
  producto_id: string;
  tipo: string;
  talla: string;
  genero: string;
  compatibilidad: number | null;
  duracion_segundos: number | null;
  creado_en: string;
  productos?: {
    id: string;
    nombre: string;
    categoria: string;
    precio: number;
    imagen_url: string;
    genero: string;
  };
}

export async function fetchMyTryOnHistory(): Promise<UserTryOnHistoryItem[]> {
  try {
    const { data } = await api.get("/virtual-tryon/my-history");
    return (data.history || []) as UserTryOnHistoryItem[];
  } catch {
    return [];
  }
}
