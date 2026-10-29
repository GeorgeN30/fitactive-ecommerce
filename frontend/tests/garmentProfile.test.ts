import { describe, expect, it } from 'vitest';
import { classifyGarment, type GarmentProfile } from '../src/utils/garmentProfile';

describe('classifyGarment', () => {
  it.each<[string, string, GarmentProfile]>([
    ['Casaca Under Armour OutRun', 'Polos', 'jacket'],
    ['Under Armour OutRun', 'Casacas', 'jacket'],
    ['Polera deportiva mujer', 'Tops', 'jacket'],
    ['Camiseta manga larga hombre', 'Polos', 'jacket'],
    ['Reebok Classics Vector', 'Casacas', 'jacket'],
    ['Nike Dri-FIT Legend', 'Polos', 'shirt'],
    ['Camiseta deportiva', 'Ropa hombre', 'shirt'],
    ['Top deportivo', 'Mujer', 'shirt'],
    ['Nike Challenger Shorts', 'Pantalones', 'shorts'],
    ['Adidas Tiro 23', 'Shorts', 'shorts'],
    ['Short de compresion', 'Leggings', 'shorts'],
    ['Pantalón corto hombre', 'Pantalones', 'shorts'],
    ['Reebok Lux Jogger', 'Leggings', 'pant'],
    ['PANTALÓN regular', 'Hombre', 'pant'],
    ['Pantalones rectos', 'Mujer', 'pant'],
    ['Buzo deportivo', 'Hombre', 'pant'],
    ['Under Armour Unstoppable', 'Buzos', 'pant'],
    ['Puma Power Colorblock', 'Pantalones', 'pant'],
    ['Nike Pro 365', 'Leggings', 'legging'],
    ['Leggings de compresión hombre', 'Pantalones', 'legging'],
    ['Mallas deportivas', 'Mujer', 'legging'],
    ['Nike Alate Minimalist', 'Tops', 'bra'],
    ['Sports Bra', 'Mujer', 'bra'],
    ['Sostén deportivo', 'Tops', 'bra'],
    ['Nike Yoga Dri-FIT Top', 'Tops', 'tank'],
    ['Tank deportivo hombre', 'Polos', 'tank'],
    ['Camiseta sin mangas', 'Tops', 'tank'],
    ['Gorra deportiva', 'Accesorios', 'unknown'],
    ['Brazalete', 'Accesorios', 'unknown'],
  ])('classifies %s / %s as %s', (nombre, categoria, expected) => {
    expect(classifyGarment({ nombre, categoria })).toBe(expected);
  });

  it.each(['Hombre', 'Mujer', 'Unisex'])('does not infer compression from gender %s', gender => {
    expect(classifyGarment({ nombre: `Pantalón ${gender}`, categoria: 'Ropa' })).toBe('pant');
    expect(classifyGarment({ nombre: `Casaca OutRun ${gender}`, categoria: 'Ropa' })).toBe('jacket');
    expect(classifyGarment({ nombre: `Leggings ${gender}`, categoria: 'Ropa' })).toBe('legging');
  });

  it('has a deterministic fallback without retaining previous products', () => {
    expect(classifyGarment({ nombre: 'Casaca OutRun' })).toBe('jacket');
    for (const product of [null, undefined, {}, { nombre: 'OutRun' }, { categoria: 'Accesorios' }]) {
      expect(classifyGarment(product)).toBe('unknown');
    }
  });
});
