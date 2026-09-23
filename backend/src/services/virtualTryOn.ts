import { prisma } from "../config/prisma";

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
  topProducts: {
    name: string;
    tryOns: number;
    purchases: number;
    conversionRate: number;
  }[];
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

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

const EVENT_TYPES = new Set<VirtualTryOnEventType>([
  "session_started",
  "try_on",
  "fit_result",
  "cart_added",
  "purchase",
  "outfit_created",
]);

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dateRange(period: VirtualTryOnPeriod, customDate?: string, now = new Date()): DateRange {
  if (period === "custom" && customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
    const [year, month, day] = customDate.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    if (!Number.isNaN(start.getTime())) {
      return {
        start,
        end: new Date(year, month - 1, day + 1),
        label: start.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }),
      };
    }
  }

  const today = startOfDay(now);
  if (period === "today") {
    return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000), label: "Hoy" };
  }
  if (period === "week") {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      label: "Últimos 7 días",
    };
  }
  if (period === "year") {
    return {
      start: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      label: "Últimos 12 meses",
    };
  }
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    label: "Últimos 30 días",
  };
}

function previousRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - duration),
    end: range.start,
    label: range.label,
  };
}

function growth(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function percentage(value: number, total: number): number {
  return total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
}

function validateEvent(input: VirtualTryOnEventInput): void {
  if (!input || typeof input !== "object") throw new Error("INVALID_VIRTUAL_TRYON_EVENT");
  if (
    typeof input.sessionId !== "string" ||
    !/^[a-zA-Z0-9:_-]{8,100}$/.test(input.sessionId)
  ) {
    throw new Error("INVALID_VIRTUAL_TRYON_SESSION");
  }
  if (!EVENT_TYPES.has(input.type)) throw new Error("INVALID_VIRTUAL_TRYON_EVENT");
  if (input.size !== undefined && (typeof input.size !== "string" || input.size.length > 20)) {
    throw new Error("INVALID_VIRTUAL_TRYON_SIZE");
  }
  if (
    input.compatibility !== undefined &&
    (!Number.isInteger(input.compatibility) || input.compatibility < 0 || input.compatibility > 100)
  ) {
    throw new Error("INVALID_VIRTUAL_TRYON_COMPATIBILITY");
  }
  if (
    input.durationSeconds !== undefined &&
    (!Number.isInteger(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 86400)
  ) {
    throw new Error("INVALID_VIRTUAL_TRYON_DURATION");
  }
}

function mapEventData(input: VirtualTryOnEventInput, userId?: string) {
  return {
    usuario_id: userId || null,
    producto_id: input.productId || null,
    orden_id: input.orderId || null,
    sesion_id: input.sessionId,
    tipo: input.type,
    talla: input.size || null,
    genero: input.gender || null,
    compatibilidad: input.compatibility ?? null,
    duracion_segundos: input.durationSeconds ?? null,
  };
}

function aggregateEvents(events: Array<{
  sesion_id: string;
  tipo: string;
  producto_id: string | null;
  talla: string | null;
  genero: string | null;
  compatibilidad: number | null;
  duracion_segundos: number | null;
  productos: { nombre: string; categoria: string | null } | null;
}>): {
  totalTests: number;
  garmentsTried: number;
  conversionRate: number;
  outfitsCreated: number;
  avgTimeMinutes: number;
  topProducts: VirtualTryOnSummary["topProducts"];
  genderUsage: VirtualTryOnSummary["genderUsage"];
  sizeUsage: VirtualTryOnSummary["sizeUsage"];
  categoryConversion: VirtualTryOnSummary["categoryConversion"];
  funnel: VirtualTryOnSummary["funnel"];
} {
  const tryOns = events.filter((event) => event.tipo === "try_on");
  const purchases = events.filter((event) => event.tipo === "purchase");
  const sessions = new Set(
    events.filter((event) => event.tipo === "session_started").map((event) => event.sesion_id),
  );
  const productIds = new Set(tryOns.map((event) => event.producto_id).filter(Boolean));
  const durationValues = tryOns
    .map((event) => event.duracion_segundos)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const totalTests = tryOns.length;
  const conversionRate = percentage(purchases.length, totalTests);

  const productMap = new Map<string, { name: string; tryOns: number; purchases: number }>();
  const categoryMap = new Map<string, { tests: number; purchases: number }>();
  for (const event of tryOns) {
    const productId = event.producto_id || `unknown-${event.productos?.nombre || "producto"}`;
    const product = productMap.get(productId) || {
      name: event.productos?.nombre || "Producto eliminado",
      tryOns: 0,
      purchases: 0,
    };
    product.tryOns += 1;
    productMap.set(productId, product);

    const category = event.productos?.categoria || "Sin categoría";
    const categoryData = categoryMap.get(category) || { tests: 0, purchases: 0 };
    categoryData.tests += 1;
    categoryMap.set(category, categoryData);
  }

  for (const event of purchases) {
    const productId = event.producto_id;
    if (productId) {
      const product = productMap.get(productId);
      if (product) product.purchases += 1;
    }
    const category = event.productos?.categoria || "Sin categoría";
    const categoryData = categoryMap.get(category) || { tests: 0, purchases: 0 };
    categoryData.purchases += 1;
    categoryMap.set(category, categoryData);
  }

  const genderCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();
  for (const event of tryOns) {
    const gender = event.genero || "Sin especificar";
    genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
    if (event.talla) sizeCounts.set(event.talla, (sizeCounts.get(event.talla) || 0) + 1);
  }

  const genderUsage = Array.from(genderCounts.entries())
    .map(([name, count]) => ({ name, count, percentage: percentage(count, totalTests) }))
    .sort((a, b) => b.count - a.count);
  const sizeUsage = Array.from(sizeCounts.entries())
    .map(([size, count]) => ({ size, count, percentage: percentage(count, totalTests) }))
    .sort((a, b) => b.count - a.count);
  const topProducts = Array.from(productMap.values())
    .map((product) => ({
      name: product.name,
      tryOns: product.tryOns,
      purchases: product.purchases,
      conversionRate: percentage(product.purchases, product.tryOns),
    }))
    .sort((a, b) => b.tryOns - a.tryOns)
    .slice(0, 6);
  const categoryConversion = Array.from(categoryMap.entries())
    .map(([name, category]) => ({
      name,
      tests: category.tests,
      purchases: category.purchases,
      conversionRate: percentage(category.purchases, category.tests),
    }))
    .sort((a, b) => b.tests - a.tests);

  const sessionCount = Math.max(sessions.size, totalTests > 0 ? totalTests : 0);
  const cartCount = events.filter((event) => event.tipo === "cart_added").length;
  const funnel = [
    { step: "VISITARON", count: sessionCount, description: "Abrieron el probador virtual" },
    { step: "PROBARON", count: totalTests, description: "Seleccionaron una prenda" },
    { step: "CARRITO", count: cartCount, description: "Añadieron desde el probador" },
    { step: "COMPRARON", count: purchases.length, description: "Pedido asociado a una prueba" },
  ].map((item, index, all) => ({
    ...item,
    percentage: index === 0 ? 100 : percentage(item.count, all[0].count),
  }));

  return {
    totalTests,
    garmentsTried: productIds.size,
    conversionRate,
    outfitsCreated: events.filter((event) => event.tipo === "outfit_created").length,
    avgTimeMinutes: durationValues.length
      ? Number((durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length / 60).toFixed(1))
      : 0,
    topProducts,
    genderUsage,
    sizeUsage,
    categoryConversion,
    funnel,
  };
}

export const virtualTryOnService = {
  async recordEvent(input: VirtualTryOnEventInput, userId?: string): Promise<{ id: string }> {
    validateEvent(input);
    const event = await prisma.virtual_tryon_events.create({
      data: mapEventData(input, userId),
      select: { id: true },
    });
    return event;
  },

  async getSummary(
    period: VirtualTryOnPeriod = "month",
    customDate?: string,
  ): Promise<VirtualTryOnSummary> {
    const range = dateRange(period, customDate);
    const previous = previousRange(range);
    const [events, previousEvents] = await Promise.all([
      prisma.virtual_tryon_events.findMany({
        where: { creado_en: { gte: range.start, lt: range.end } },
        include: { productos: { select: { nombre: true, categoria: true } } },
        orderBy: { creado_en: "asc" },
      }),
      prisma.virtual_tryon_events.findMany({
        where: { creado_en: { gte: previous.start, lt: previous.end } },
        include: { productos: { select: { nombre: true, categoria: true } } },
      }),
    ]);

    const current = aggregateEvents(events);
    const prior = aggregateEvents(previousEvents);
    return {
      period,
      periodLabel: range.label,
      totalTests: current.totalTests,
      testsGrowth: growth(current.totalTests, prior.totalTests),
      garmentsTried: current.garmentsTried,
      garmentsGrowth: growth(current.garmentsTried, prior.garmentsTried),
      conversionRate: current.conversionRate,
      conversionGrowth: Number((current.conversionRate - prior.conversionRate).toFixed(1)),
      outfitsCreated: current.outfitsCreated,
      outfitsGrowth: growth(current.outfitsCreated, prior.outfitsCreated),
      avgTimeMinutes: current.avgTimeMinutes,
      avgTimeGrowth: growth(current.avgTimeMinutes, prior.avgTimeMinutes),
      topProducts: current.topProducts,
      genderUsage: current.genderUsage,
      sizeUsage: current.sizeUsage,
      categoryConversion: current.categoryConversion,
      funnel: current.funnel,
    };
  },
};
