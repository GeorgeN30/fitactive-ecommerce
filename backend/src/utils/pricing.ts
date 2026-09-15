export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateDiscountedPrice(
  basePrice: number,
  discountPercent: number,
): number {
  const safePercent = Number.isInteger(discountPercent)
    ? Math.min(100, Math.max(0, discountPercent))
    : 0;
  return roundToCents(basePrice * (1 - safePercent / 100));
}
