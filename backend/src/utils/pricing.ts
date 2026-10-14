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

export interface DiscountWindow {
  descuento_porcentaje?: number | null;
  descuento_inicio?: Date | null;
  descuento_fin?: Date | null;
}

// The server clock is authoritative; expired offers never depend on a cleanup job.
export function resolveVariantPrice(basePrice: number, variant: DiscountWindow, now = new Date()) {
  const started = !variant.descuento_inicio || variant.descuento_inicio <= now;
  const ended = !!variant.descuento_fin && variant.descuento_fin <= now;
  const percent = started && !ended ? variant.descuento_porcentaje ?? 0 : 0;
  return {
    discountPercent: percent,
    salePrice: calculateDiscountedPrice(basePrice, percent),
    discountStartsAt: variant.descuento_inicio ?? null,
    discountEndsAt: variant.descuento_fin ?? null,
  };
}
