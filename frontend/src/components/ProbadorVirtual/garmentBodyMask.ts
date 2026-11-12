import type { BufferGeometry } from 'three';

// Cloth-covered body triangles are hidden in bind space, preserving exposed neck, arms and feet.
export function maskBodyForTailoredOutfit(geometry: BufferGeometry): void {
  const positions = geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const factor = geometry.boundingBox!.max.y < 30 ? 0.1 : 1;
  const sourceIndex = geometry.index;
  const count = sourceIndex?.count ?? positions.count;
  const visible: number[] = [];
  for (let offset = 0; offset < count; offset += 3) {
    const ids = [0, 1, 2].map(corner => sourceIndex ? sourceIndex.getX(offset + corner) : offset + corner);
    let covered = 0;
    for (const id of ids) {
      const x = Math.abs(positions.getX(id) / factor);
      const y = positions.getY(id) / factor;
      const z = positions.getZ(id) / factor;
      const neckline = x <= 8 ? (z > -5 ? 133 + x : 140 + x / 8) : 141 + (x - 8) / 12.5;
      const torso = x < 20.8 && y > 89.5 && y < neckline - 0.4;
      const trousers = y > 9.8 && y < 94.5 && x < 23;
      // Leave the arm surface intact: the free sleeve opening is wider than the arm.
      if (torso || trousers) covered++;
    }
    if (covered < 2) visible.push(...ids);
  }
  geometry.setIndex(visible);
}
