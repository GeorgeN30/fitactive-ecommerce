import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createHash } from 'node:crypto';
import { buildTailoredGarment, updateTailoredGarment } from '../../src/components/ProbadorVirtual/tailoredGarments';

function body() {
  const geometry = new THREE.SphereGeometry(20, 36, 24);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) position.setY(i, position.getY(i) + 110);
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(position.count * 4), 4));
  const weights = new Float32Array(position.count * 4);
  for (let i = 0; i < position.count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.morphTargetsRelative = true;
  const morph = new THREE.Float32BufferAttribute(new Float32Array(position.count * 3).fill(0.5), 3);
  morph.name = 'shape';
  geometry.morphAttributes.position = [morph];
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  mesh.bind(new THREE.Skeleton([new THREE.Bone(), new THREE.Bone()]));
  return mesh;
}

function snapshot(mesh: THREE.SkinnedMesh) {
  const g = mesh.geometry;
  return {
    attributes: Object.fromEntries(Object.entries(g.attributes).map(([name, a]) => [name, Array.from(a.array)])),
    index: Array.from(g.index!.array),
    morphs: g.morphAttributes.position.map(a => Array.from(a.array)),
  };
}

function adversarialBody(sparse: boolean, relative: boolean) {
  const points = sparse ? [[1000, 150, 1000], [1001, 150, 1000], [1002, 151, 1000]] : [
    [-19, 90, -5], [-17, 90, -5], [-18, 89, -5], [-18, 91, -5], [-18, 90, -6], [-18, 90, -4],
    [-20, 74, -5], [-18, 74, -5], [-19, 73, -5], [-19, 75, -5], [-19, 74, -6], [-19, 74, -4],
    [-19, 90, -5], [0, 150, 0],
  ];
  const geometry = new THREE.BufferGeometry();
  const data = new THREE.InterleavedBuffer(new Float32Array(points.flatMap((p, i) => [99, ...p, i % 4, 1, i * 0.125, i * -0.25, i * 0.5])), 9);
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(data, 3, 1));
  const indices = new Uint16Array(points.length * 4), weights = new Float32Array(points.length * 4);
  for (let i = 0; i < points.length; i++) { indices[i * 4] = i % 4; weights[i * 4] = 1; }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.morphTargetsRelative = relative;
  const values = points.flatMap((p, i) => p.map((v, axis) => (relative ? 0 : v) + i * [0.125, -0.25, 0.5][axis]));
  const morphData = new THREE.InterleavedBuffer(new Float32Array(points.flatMap((_, i) => [99, ...values.slice(i * 3, i * 3 + 3)])), 4);
  const morph = new THREE.InterleavedBufferAttribute(morphData, 3, 1);
  morph.name = 'adversarial';
  geometry.morphAttributes.position = [morph];
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  mesh.bind(new THREE.Skeleton(Array.from({ length: 4 }, () => new THREE.Bone())));
  return mesh;
}

function digest(mesh: THREE.SkinnedMesh) {
  const g = mesh.geometry;
  const hash = createHash('sha256');
  for (const a of [...Object.values(g.attributes), g.index!, ...g.morphAttributes.position]) {
    hash.update(new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength));
  }
  return hash.digest('hex');
}

describe('tailored spatial source cache', () => {
  it.each([[false, true], [false, false], [true, true], [true, false]])('preserves adversarial output sparse=%s relative=%s', (sparse, relative) => {
    const mesh = adversarialBody(sparse, relative);
    const results = (['football-shirt', 'joggers'] as const).map(kind => digest(buildTailoredGarment(mesh, kind)));
    // Hashes captured from the original push/sort/pop search, including fallback reuse.
    expect(results).toEqual(sparse ? [
      'b29609de632e52ac3dfaf1f6b2149709113d558784df095fcd3ff55561c78b79',
      '3ad13db8f0c19f0e5b4155e8093edb14b8cd91c28c9f03e48b24df0c1fd3545e',
    ] : [
      '557a054bba779bfb362f6e7da7722a9bb47c86734db9a593ad029007272a884a',
      'cc5d8b9e0f95eb89b5e61711cb0c58548ecd8b7ae463af6880961352e97bc5cb',
    ]);
  }, 30000);
  it('does not recompute garment geometry for the already active size', () => {
    const mesh = buildTailoredGarment(body(), 'football-shirt');
    const normals = vi.spyOn(mesh.geometry, 'computeVertexNormals');
    const positionVersion = mesh.geometry.getAttribute('position').version;
    updateTailoredGarment(mesh, 'M');
    expect(normals).not.toHaveBeenCalled();
    expect(mesh.geometry.getAttribute('position').version).toBe(positionVersion);
    updateTailoredGarment(mesh, 'L');
    expect(normals).toHaveBeenCalledTimes(1);
    updateTailoredGarment(mesh, 'L');
    expect(normals).toHaveBeenCalledTimes(1);
  }, 30000);

  it('reuses a masked clone attribute, preserves output, and invalidates updated positions', () => {
    const mesh = body();
    const original = mesh.geometry;
    mesh.geometry = original.clone();
    const p = mesh.geometry.getAttribute('position');
    expect(p).not.toBe(original.getAttribute('position'));
    const getX = vi.spyOn(p, 'getX');
    const first = buildTailoredGarment(mesh, 'football-shirt');
    const coldReads = getX.mock.calls.length;
    getX.mockClear();
    const second = buildTailoredGarment(mesh, 'football-shirt');
    expect(coldReads - getX.mock.calls.length).toBe(p.count);
    expect(snapshot(second)).toEqual(snapshot(first));
    expect(mesh.geometry.boundingBox).toBeNull();
    updateTailoredGarment(first, 'L');
    expect(snapshot(second)).not.toEqual(snapshot(first));

    p.setX(0, p.getX(0) + 7);
    p.needsUpdate = true;
    getX.mockClear();
    const changed = buildTailoredGarment(mesh, 'joggers');
    const updatedReads = getX.mock.calls.length;
    getX.mockClear();
    const reused = buildTailoredGarment(mesh, 'joggers');
    expect(updatedReads - getX.mock.calls.length).toBe(p.count);
    expect(snapshot(changed)).toEqual(snapshot(reused));
    const clone = mesh.geometry.clone();
    mesh.geometry = clone;
    const cloneReads = vi.spyOn(clone.getAttribute('position'), 'getX');
    const fresh = buildTailoredGarment(mesh, 'joggers');
    expect(cloneReads.mock.calls.length).toBe(updatedReads);
    expect(snapshot(fresh)).toEqual(snapshot(changed));
  }, 30000);

  it('reads current skin, morphs and influences even on a cache hit', () => {
    const mesh = body();
    const first = buildTailoredGarment(mesh, 'joggers');
    const skinIndex = mesh.geometry.getAttribute('skinIndex');
    const skinWeight = mesh.geometry.getAttribute('skinWeight');
    for (let i = 0; i < skinIndex.count; i++) {
      skinIndex.setX(i, 1);
      skinWeight.setXY(i, 0.75, 0.25);
    }
    const morph = mesh.geometry.morphAttributes.position[0];
    for (let i = 0; i < morph.count; i++) morph.setXYZ(i, 2, 2, 2);
    morph.name = 'changed';
    mesh.morphTargetInfluences = [0.8];
    const second = buildTailoredGarment(mesh, 'joggers');
    expect(second.geometry.morphAttributes.position[0].name).toBe('changed');
    expect(second.geometry.getAttribute('skinIndex').getX(0)).toBe(1);
    expect(first.geometry.getAttribute('skinIndex').getX(0)).toBe(0);
    expect(second.geometry.getAttribute('skinWeight').getX(0)).toBe(0.75);
    expect(second.geometry.getAttribute('skinWeight').getY(0)).toBe(0.25);
    expect(second.geometry.morphAttributes.position[0].getX(0)).toBeCloseTo(2);
    expect(first.geometry.morphAttributes.position[0].getX(0)).toBeCloseTo(0.5);
    expect(second.morphTargetInfluences).toBe(mesh.morphTargetInfluences);
    const clone = mesh.geometry.clone();
    mesh.geometry = clone;
    expect(snapshot(buildTailoredGarment(mesh, 'joggers'))).toEqual(snapshot(second));
  });
});
