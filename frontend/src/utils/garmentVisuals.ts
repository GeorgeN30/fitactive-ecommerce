import type { CatalogProduct } from '../services/catalog';

export interface GarmentVisual {
  kind: 'football-shirt' | 'joggers';
  color: string;
  roughness: number;
}

const pilotVisuals: Record<string, GarmentVisual> = {
  'adidas entrada 22': { kind: 'football-shirt', color: '#c80f32', roughness: 0.88 },
  'puma ess sweatpants': { kind: 'joggers', color: '#1c1d20', roughness: 0.98 },
};

export function getGarmentVisual(product?: { nombre?: string | null; genero?: string | null } | null): GarmentVisual | null {
  if (!product) return null;
  const gender = product.genero?.trim().toLowerCase();
  if (gender && !['hombre', 'male', 'masculino'].includes(gender)) return null;
  const name = product.nombre?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
  return pilotVisuals[name] || null;
}

export function prioritizeGarmentPilots<T extends Pick<CatalogProduct, 'nombre' | 'genero'>>(products: T[]): T[] {
  return [...products.filter(product => getGarmentVisual(product)), ...products.filter(product => !getGarmentVisual(product))];
}
