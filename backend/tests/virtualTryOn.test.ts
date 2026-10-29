import { describe, expect, it, vi } from "vitest";
vi.mock("../src/config/prisma", () => ({ prisma: { virtual_tryon_events: { create: vi.fn(), findMany: vi.fn() } } }));
import { prisma } from "../src/config/prisma";
import { aggregateEvents, dateRange, validateEvent, virtualTryOnService } from "../src/services/virtualTryOn";

const productId = "10000000-0000-4000-8000-000000000001";
const sessionId = "session-qa-0001";
describe("virtual try-on analytics and event validation", () => {
  it("accepts valid analytics events and rejects malformed identities and measurements", () => {
    expect(() => validateEvent({ sessionId, type: "try_on", productId, size: "M", compatibility: 80, durationSeconds: 25 })).not.toThrow();
    for (const event of [
      { sessionId: "short", type: "session_started" },
      { sessionId, type: "invalid" },
      { sessionId, type: "try_on" },
      { sessionId, type: "try_on", productId: "not-a-uuid" },
      { sessionId, type: "try_on", productId, compatibility: 101 },
      { sessionId, type: "try_on", productId, durationSeconds: -1 },
      { sessionId, type: "cart_added", productId, gender: "x".repeat(31) },
    ]) expect(() => validateEvent(event as never)).toThrow(/INVALID_VIRTUAL_TRYON/);
  });
  it("maps an event to the database and returns the inserted id", async () => {
    vi.mocked(prisma.virtual_tryon_events.create).mockResolvedValue({ id: "event-1" } as never);
    await expect(virtualTryOnService.recordEvent({ sessionId, type: "try_on", productId, size: "M", gender: "Mujer", compatibility: 92, durationSeconds: 60 }, "user-1"))
      .resolves.toEqual({ id: "event-1" });
    expect(prisma.virtual_tryon_events.create).toHaveBeenCalledWith({ data: expect.objectContaining({ usuario_id: "user-1", producto_id: productId, sesion_id: sessionId, tipo: "try_on", compatibilidad: 92 }), select: { id: true } });
  });
  it("calculates funnel, conversion, per-product usage and handles an empty data set", () => {
    const product = { nombre: "Polo", categoria: "Running" };
    const events = [
      { sesion_id: sessionId, tipo: "session_started", producto_id: null, talla: null, genero: "Mujer", compatibilidad: null, duracion_segundos: null, productos: null },
      { sesion_id: sessionId, tipo: "try_on", producto_id: productId, talla: "M", genero: "Mujer", compatibilidad: 90, duracion_segundos: 120, productos: product },
      { sesion_id: sessionId, tipo: "cart_added", producto_id: productId, talla: "M", genero: "Mujer", compatibilidad: null, duracion_segundos: null, productos: product },
      { sesion_id: sessionId, tipo: "purchase", producto_id: productId, talla: "M", genero: "Mujer", compatibilidad: 90, duracion_segundos: null, productos: product },
    ];
    const result = aggregateEvents(events);
    expect(result).toMatchObject({ totalTests: 1, garmentsTried: 1, conversionRate: 100, avgTimeMinutes: 2 });
    expect(result.topProducts).toEqual([{ name: "Polo", tryOns: 1, purchases: 1, conversionRate: 100 }]);
    expect(result.funnel.map((step) => step.count)).toEqual([1, 1, 1, 1]);
    expect(aggregateEvents([])).toMatchObject({ totalTests: 0, conversionRate: 0, avgTimeMinutes: 0, funnel: [{ percentage: 100 }, { percentage: 0 }, { percentage: 0 }, { percentage: 0 }] });
  });
  it("uses half-open day ranges and falls back safely for invalid custom dates", () => {
    const now = new Date("2026-10-08T15:30:00Z");
    const day = dateRange("custom", "2026-10-04", now);
    expect([day.start.getFullYear(), day.start.getMonth(), day.start.getDate()]).toEqual([2026, 9, 4]);
    expect([day.end.getFullYear(), day.end.getMonth(), day.end.getDate()]).toEqual([2026, 9, 5]);
    expect(dateRange("custom", "not-a-date", now).label).toBe("Últimos 30 días");
  });
  it("computes percentage growth safely when a prior range is empty", async () => {
    vi.mocked(prisma.virtual_tryon_events.findMany).mockResolvedValueOnce([{ sesion_id: sessionId, tipo: "try_on", producto_id: productId, talla: "M", genero: null, compatibilidad: 90, duracion_segundos: 60, productos: { nombre: "Polo", categoria: "Running" } }] as never).mockResolvedValueOnce([]);
    const summary = await virtualTryOnService.getSummary("today");
    expect(summary.totalTests).toBe(1);
    expect(summary.testsGrowth).toBe(100);
    expect(summary.avgTimeMinutes).toBe(1);
  });

  it("retrieves try-on history for a specific user ordered by creation", async () => {
    vi.mocked(prisma.virtual_tryon_events.findMany).mockResolvedValueOnce([
      { id: "event-1", usuario_id: "user-1", tipo: "try_on", talla: "M", productos: { nombre: "Polo Nike", categoria: "Polos" } },
    ] as never);
    const history = await virtualTryOnService.getMyHistory("user-1");
    expect(history).toHaveLength(1);
    expect(prisma.virtual_tryon_events.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuario_id: "user-1", tipo: "try_on" } })
    );
  });
});
