import { describe, expect, it } from 'vitest';
import { getGarmentVisual, prioritizeGarmentPilots } from '../src/utils/garmentVisuals';

describe('reference garment visuals', () => {
  it('selects only the photographed pilot products, not similarly named variants', () => {
    expect(getGarmentVisual({ nombre: ' Adidas  Entrada 22 ', genero: 'Hombre' })).toMatchObject({ kind: 'football-shirt', color: '#c80f32' });
    expect(getGarmentVisual({ nombre: 'Puma ESS Sweatpants', genero: 'male' })).toMatchObject({ kind: 'joggers' });
    for (const nombre of ['Adidas Entrada 22 Short', 'Puma Essentials', 'Reebok Vector']) {
      expect(getGarmentVisual({ nombre, genero: 'Hombre' })).toBeNull();
    }
    expect(getGarmentVisual({ nombre: 'Adidas Entrada 22', genero: 'Mujer' })).toBeNull();
    expect(getGarmentVisual(null)).toBeNull();
  });

  it('prioritizes pilots without duplicating, mutating or expanding the selection', () => {
    const products = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, nombre: `Prenda ${i}`, genero: 'Hombre' })),
      { id: 'shirt', nombre: 'Adidas Entrada 22', genero: 'Hombre' },
      { id: 'pants', nombre: 'Puma ESS Sweatpants', genero: 'Hombre' },
    ];
    const result = prioritizeGarmentPilots(products).slice(0, 5);
    expect(result.map(product => product.id)).toEqual(['shirt', 'pants', 'p0', 'p1', 'p2']);
    expect(new Set(result).size).toBe(5);
    expect(products[0].id).toBe('p0');
    expect(result[0]).toBe(products[6]);
  });
});
