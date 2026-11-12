import { describe, expect, it } from 'vitest';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { maskBodyForTailoredOutfit } from '../src/components/ProbadorVirtual/garmentBodyMask';

describe('tailored outfit body coverage', () => {
  it.each([false, true])('hides covered regions but retains exposed skin (indexed=%s)', indexed => {
    const centers = [
      [10, 120, 5], [10, 125, -15], [0, 80, 5], [12, 30, -10], [28, 132, -5],
      [0, 150, 5], [0, 139, 2], [48, 133, -5], [13, 5, 0],
    ];
    const values = centers.flatMap(([x, y, z]) => [x - 0.1, y, z, x + 0.1, y, z, x, y + 0.1, z]);
    const original = new BufferGeometry();
    original.setAttribute('position', new Float32BufferAttribute(values, 3));
    if (indexed) original.setIndex(Array.from({ length: values.length / 3 }, (_, i) => i));
    const instance = original.clone();
    maskBodyForTailoredOutfit(instance);
    expect(Array.from(instance.index!.array)).toEqual(Array.from({ length: 15 }, (_, i) => i + 12));
    expect(original.index?.count ?? original.getAttribute('position').count).toBe(27);
    expect(instance.getAttribute('position').array).toEqual(original.getAttribute('position').array);
    original.dispose(); instance.dispose();
  });
});
