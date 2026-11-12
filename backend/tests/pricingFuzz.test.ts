import { describe, expect, it } from "vitest";
import { calculateDiscountedPrice, roundToCents } from "../src/utils/pricing";

describe("pricing property stress", () => {
  it("keeps 50,000 deterministic amount/discount combinations finite, bounded and cent-rounded", () => {
    let seed = 0x51f15e;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x1_0000_0000; };
    for (let iteration = 0; iteration < 50_000; iteration += 1) {
      const base = Math.round(random() * 1_000_000_00) / 100;
      const discount = Math.floor(random() * 101);
      const price = calculateDiscountedPrice(base, discount);
      expect(Number.isFinite(price)).toBe(true);
      expect(price).toBeGreaterThanOrEqual(0);
      expect(price).toBeLessThanOrEqual(base);
      expect(price).toBe(roundToCents(price));
    }
  });
  it("fails closed for fractional, negative and oversized percentages", () => {
    expect(calculateDiscountedPrice(100, -20)).toBe(100);
    expect(calculateDiscountedPrice(100, 20.5)).toBe(100);
    expect(calculateDiscountedPrice(100, 150)).toBe(0);
  });
});
