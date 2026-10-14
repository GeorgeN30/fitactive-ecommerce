import { describe, expect, it } from "vitest";
import { resolveVariantPrice } from "../src/utils/pricing";

describe("authoritative offer validity", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  it("preserves legacy offers and rounds money to cents", () => {
    expect(resolveVariantPrice(49.9, { descuento_porcentaje: 20 }, now).salePrice).toBe(39.92);
  });
  it("does not apply scheduled or expired offers, including the exact end instant", () => {
    expect(resolveVariantPrice(100, { descuento_porcentaje: 20, descuento_inicio: new Date("2026-10-09") }, now).salePrice).toBe(100);
    expect(resolveVariantPrice(100, { descuento_porcentaje: 20, descuento_fin: now }, now).discountPercent).toBe(0);
  });
  it("applies at the start instant and before expiry", () => {
    expect(resolveVariantPrice(100, { descuento_porcentaje: 20, descuento_inicio: now, descuento_fin: new Date("2026-10-09") }, now).salePrice).toBe(80);
  });
});
