import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildTailoredGarment, updateTailoredGarment } from '../src/components/ProbadorVirtual/tailoredGarments';

function maleBody(relative = true, factor = 1) {
  const positions: number[] = [], indices: number[] = [], skin: number[] = [], weights: number[] = [];
  const bones = ['pelvis', 'spine', 'upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r'].map(name => {
    const bone = new THREE.Bone();
    bone.name = name;
    return bone;
  });
  const parts = [
    [0, 114, -5, 17.5, 27, 11.5, 1],
    [0, 84, -5, 17.5, 13, 11.5, 0],
    [10, 42, -5, 8.5, 34, 8, 4], [-10, 42, -5, 8.5, 34, 8, 5],
    [29, 133, -5.8, 15, 7, 7, 2], [-29, 133, -5.8, 15, 7, 7, 3],
    [0, 140, -5, 6, 10, 7, 1],
  ];
  for (const [x, y, z, rx, ry, rz, bone] of parts) {
    const sphere = new THREE.SphereGeometry(1, 48, 32);
    const p = sphere.getAttribute('position');
    const start = positions.length / 3;
    for (let i = 0; i < p.count; i++) {
      positions.push((x + p.getX(i) * rx) * factor, (y + p.getY(i) * ry) * factor, (z + p.getZ(i) * rz) * factor);
      skin.push(bone, 0, 0, 0);
      weights.push(0.9, 0.1, 0, 0);
    }
    for (const index of sphere.index!.array) indices.push(start + index);
    sphere.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skin, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.morphTargetsRelative = relative;
  geometry.morphAttributes.position = [0, 1].map(m => {
    const values = positions.map((value, i) => {
      const delta = m === 0 ? [0.1, 0.4, 0.2][i % 3] * factor : value * 0.04;
      return relative ? delta : value + delta;
    });
    const attribute = new THREE.Float32BufferAttribute(values, 3);
    attribute.name = m === 0 ? 'Delgada' : 'Grande';
    return attribute;
  });
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  bones.slice(1).forEach(b => bones[0].add(b));
  mesh.add(bones[0]);
  mesh.bind(new THREE.Skeleton(bones), new THREE.Matrix4().makeTranslation(0.5, 0, -0.2));
  mesh.morphTargetDictionary = { Delgada: 0, Grande: 1 };
  mesh.morphTargetInfluences = [0.2, 0.7];
  return mesh;
}

function dispose(mesh: THREE.SkinnedMesh) {
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach(m => m.dispose());
}

describe('tailored garment patterns', () => {
  it.each(['football-shirt', 'joggers'] as const)('builds independent, finite, indexed %s with transferred rig and morphs', kind => {
    const body = maleBody();
    const original = new Float32Array(body.geometry.getAttribute('position').array);
    const mesh = buildTailoredGarment(body, kind);
    const geometry = mesh.geometry;
    const p = geometry.getAttribute('position');
    expect(mesh.name).toBe(kind === 'football-shirt' ? 'garment_polo' : 'garment_pant');
    expect(mesh.userData.tailoredKind).toBe(kind);
    expect(geometry).not.toBe(body.geometry);
    expect(p.count).toBeGreaterThan(2000);
    expect(p.count).toBeLessThan(8000);
    expect(p.count).toBeLessThan(body.geometry.getAttribute('position').count);
    expect(geometry.index!.count).toBeGreaterThan(p.count);
    for (const index of geometry.index!.array) expect(index).toBeLessThan(p.count);
    for (const attribute of Object.values(geometry.attributes)) {
      expect(Array.from(attribute.array).every(Number.isFinite)).toBe(true);
    }
    expect(mesh.skeleton).toBe(body.skeleton);
    expect(mesh.bindMatrix.equals(body.bindMatrix)).toBe(true);
    expect(mesh.bindMatrixInverse.equals(body.bindMatrixInverse)).toBe(true);
    expect(mesh.bindMode).toBe(body.bindMode);
    expect(mesh.morphTargetDictionary).toEqual(body.morphTargetDictionary);
    expect(mesh.morphTargetInfluences).toBe(body.morphTargetInfluences);
    expect(geometry.morphTargetsRelative).toBe(true);
    expect(geometry.morphAttributes.position).toHaveLength(2);
    const delta = geometry.morphAttributes.position[0];
    expect(delta.count).toBe(p.count);
    for (let i = 0; i < p.count; i++) {
      const weight = geometry.getAttribute('skinWeight');
      const bone = geometry.getAttribute('skinIndex');
      let sum = 0;
      for (let slot = 0; slot < 4; slot++) {
        sum += weight.getComponent(i, slot);
        expect(bone.getComponent(i, slot)).toBeGreaterThanOrEqual(0);
        expect(bone.getComponent(i, slot)).toBeLessThan(body.skeleton.bones.length);
      }
      expect(sum).toBeCloseTo(1, 6);
      expect(delta.getX(i)).toBeCloseTo(0.1, 5);
      expect(delta.getY(i)).toBeCloseTo(0.4, 5);
      expect(delta.getZ(i)).toBeCloseTo(0.2, 5);
    }
    expect(body.geometry.getAttribute('position').array).toEqual(original);
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.roughness).toBe(0.9);
    expect(material.side).toBe(THREE.DoubleSide);
    expect(material.map).toBeNull();
    dispose(mesh); dispose(body);
  });

  it.each(['football-shirt', 'joggers'] as const)('sizes %s from its immutable baseline and resets exactly', kind => {
    const body = maleBody();
    const mesh = buildTailoredGarment(body, kind);
    const p = mesh.geometry.getAttribute('position');
    const baseline = new Float32Array(p.array);
    const normals = new Float32Array(mesh.geometry.getAttribute('normal').array);
    updateTailoredGarment(mesh, 'L');
    const large = new Float32Array(p.array);
    expect(large).not.toEqual(baseline);
    updateTailoredGarment(mesh, 'L');
    expect(p.array).toEqual(large);
    updateTailoredGarment(mesh, 'S');
    expect(p.array).not.toEqual(large);
    updateTailoredGarment(mesh, 'M');
    expect(p.array).toEqual(baseline);
    expect(mesh.geometry.getAttribute('normal').array).toEqual(normals);
    expect(mesh.geometry.userData.basePositions).toEqual(baseline);
    expect(mesh.geometry.userData.baseNormals).toEqual(normals);
    expect(mesh.geometry.boundingSphere!.radius).toBeGreaterThan(0);
    expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
    // Representative relative body-type combinations remain finite under skinning.
    for (const influences of [[0, 0], [1, 0], [0, 1]]) {
      body.morphTargetInfluences!.splice(0, 2, ...influences);
      body.updateMatrixWorld(true);
      body.skeleton.update();
      for (let i = 0; i < p.count; i += 13) {
        const v = mesh.getVertexPosition(i, new THREE.Vector3());
        expect([v.x, v.y, v.z].every(Number.isFinite)).toBe(true);
      }
    }
    dispose(mesh); dispose(body);
  });

  it('has independent front/back logo UVs, real V opening, sleeves and collar atlas', () => {
    const body = maleBody();
    const mesh = buildTailoredGarment(body, 'football-shirt');
    const p = mesh.geometry.getAttribute('position'), uv = mesh.geometry.getAttribute('uv');
    const front: number[] = [], back: number[] = [], collar: number[] = [];
    for (let i = 0; i < p.count; i++) {
      expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getX(i)).toBeLessThanOrEqual(1);
      expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getY(i)).toBeLessThanOrEqual(1);
      if (Math.abs(p.getX(i)) < 0.001 && p.getY(i) > 132) {
        if (p.getZ(i) > 0) front.push(p.getY(i));
        if (p.getZ(i) < -10) back.push(p.getY(i));
      }
      if (uv.getY(i) >= 0.985) collar.push(i);
    }
    expect(Math.max(...front)).toBeCloseTo(133);
    expect(Math.max(...back)).toBeCloseTo(140);
    expect(collar.length).toBeGreaterThan(20);
    const xs = Array.from({ length: p.count }, (_, i) => p.getX(i));
    expect(Math.max(...xs)).toBeCloseTo(36);
    expect(Math.min(...xs)).toBeCloseTo(-36);
    // Three includes possible morph displacements in these conservative bounds.
    expect(mesh.geometry.boundingBox!.max.x).toBeGreaterThanOrEqual(36);
    // Same +X chest location uses different, oppositely oriented atlas halves.
    const a = Array.from({ length: p.count }, (_, i) => i).find(i => p.getX(i) > 5 && p.getY(i) > 105 && p.getY(i) < 115 && p.getZ(i) > 3)!;
    const b = Array.from({ length: p.count }, (_, i) => i).find(i => Math.abs(p.getX(i) - p.getX(a)) < 0.001 && Math.abs(p.getY(i) - p.getY(a)) < 0.001 && p.getZ(i) < -10)!;
    expect(uv.getX(a)).toBeGreaterThan(0.25);
    expect(uv.getX(a)).toBeLessThan(0.48);
    expect(uv.getX(b)).toBeGreaterThan(0.52);
    expect(uv.getX(b)).toBeLessThan(0.75);
    const chest = Array.from({ length: p.count }, (_, i) => i).filter(i =>
      Math.abs(p.getX(i) - 10.25) < 0.001 && p.getY(i) > 131 && p.getY(i) < 132);
    expect(chest).toHaveLength(2);
    expect(Math.max(...chest.map(i => p.getZ(i)))).toBeGreaterThan(5);
    // The fuller chest must not pull the sleeve root away from its sewn edge.
    for (const side of [-1, 1]) for (const face of [-1, 1]) {
      const root = Array.from({ length: p.count }, (_, i) => i).filter(i =>
        Math.abs(p.getX(i) - side * 20.5) < 0.001 && Math.abs(p.getY(i) - 132) < 0.001
        && Math.abs(p.getZ(i) - (-5 + face * 8.8)) < 0.001);
      expect(root).toHaveLength(2);
    }
    dispose(mesh); dispose(body);
  });

  it('joins the pelvis to two disjoint lower legs through a shared crotch saddle', () => {
    const body = maleBody();
    const mesh = buildTailoredGarment(body, 'joggers');
    const p = mesh.geometry.getAttribute('position');
    const saddle: number[] = [];
    const thighSeams = new Map<string, number>();
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(p.getY(i) - 74) < 0.001) {
        const key = [p.getX(i), p.getZ(i)].map(v => v.toFixed(3)).join(',');
        thighSeams.set(key, (thighSeams.get(key) ?? 0) + 1);
        if (Math.abs(p.getX(i)) < 0.001 && Math.abs(p.getZ(i) + 5) < 0.001) saddle.push(i);
      }
      if (p.getY(i) < 65) expect(Math.abs(p.getX(i))).toBeGreaterThan(0.5);
    }
    expect(saddle.length).toBeGreaterThanOrEqual(6);
    expect([...thighSeams.values()].every(count => count >= 2)).toBe(true);
    const ys = Array.from({ length: p.count }, (_, i) => p.getY(i));
    expect(ys).toContain(14);
    expect(ys).toContain(91);
    expect(Math.max(...ys)).toBe(94);
    const stations = [
      [10, 13.108, -6.044, 3.8, 5.3], [14, 13, -6, 4, 5.5],
      [20, 12.8, -6.6, 6.3, 6.5], [30, 12.44, -7.48, 7.1, 7],
      [50, 10.73, -4.27, 7.4, 7.8], [70, 9.39, -4.15, 9.5, 10.2], [74, 9.5, -5, 9.5, 10.2],
    ];
    const centers = mesh.geometry.userData.centers as Float32Array;
    for (const [y, cx, cz, rx, rz] of stations) for (const side of [-1, 1]) {
      const ring = Array.from({ length: p.count }, (_, i) => i).filter(i =>
        Math.abs(p.getY(i) - y) < 0.001 && centers[i] * side > 0);
      expect(ring).toHaveLength(50);
      const xs = ring.map(i => side * p.getX(i)), zs = ring.map(i => p.getZ(i));
      // Local cloth bunching can add a fraction of a unit above the cuff.
      expect(Math.abs(Math.min(...xs) - (cx - rx))).toBeLessThan(0.2);
      expect(Math.abs(Math.max(...xs) - (cx + rx))).toBeLessThan(0.2);
      expect(Math.abs(Math.min(...zs) - (cz - rz))).toBeLessThan(0.3);
      expect(Math.abs(Math.max(...zs) - (cz + rz))).toBeLessThan(0.3);
      expect(Math.min(...xs)).toBeCloseTo(cx - rx, y <= 14 || y >= 70 ? 4 : 0);
    }
    const seat = Array.from({ length: p.count }, (_, i) => i).filter(i =>
      Math.abs(p.getX(i)) < 0.001 && Math.abs(p.getY(i) - 80) < 0.001);
    expect(Math.min(...seat.map(i => p.getZ(i)))).toBeLessThan(-15);
    // Sizing expands around the audited ankle centre rather than moving it.
    updateTailoredGarment(mesh, 'L');
    const cuff = Array.from({ length: p.count }, (_, i) => i).filter(i =>
      Math.abs(p.getY(i) - 10) < 0.001 && centers[i] > 0);
    expect((Math.min(...cuff.map(i => p.getX(i))) + Math.max(...cuff.map(i => p.getX(i)))) / 2).toBeCloseTo(13.108, 4);
    expect((Math.min(...cuff.map(i => p.getZ(i))) + Math.max(...cuff.map(i => p.getZ(i)))) / 2).toBeCloseTo(-6.044, 4);
    updateTailoredGarment(mesh, 'M');
    dispose(mesh); dispose(body);
  });

  it('converts absolute body targets to relative cloth deltas and supports the small-unit factor', () => {
    const body = maleBody(false, 0.1);
    const mesh = buildTailoredGarment(body, 'football-shirt');
    const morph = mesh.geometry.morphAttributes.position[0];
    expect(mesh.geometry.userData.factor).toBe(0.1);
    expect(mesh.geometry.morphTargetsRelative).toBe(true);
    const p = mesh.geometry.getAttribute('position');
    expect(Math.max(...Array.from({ length: p.count }, (_, i) => p.getX(i)))).toBeCloseTo(3.6);
    for (let i = 0; i < morph.count; i += 17) {
      expect(morph.getX(i)).toBeCloseTo(0.01, 5);
      expect(morph.getY(i)).toBeCloseTo(0.04, 5);
      expect(morph.getZ(i)).toBeCloseTo(0.02, 5);
    }
    dispose(mesh); dispose(body);
  });

  it('handles the shipped nonindexed source convention without copying its triangles', () => {
    const body = maleBody();
    const indexed = body.geometry;
    body.geometry = indexed.toNonIndexed();
    indexed.dispose();
    expect(body.geometry.getAttribute('position').count).toBeGreaterThan(60000);
    const mesh = buildTailoredGarment(body, 'joggers');
    expect(mesh.geometry.index).not.toBeNull();
    expect(mesh.geometry.getAttribute('position').count).toBeLessThan(8000);
    expect(mesh.geometry.morphAttributes.position[0].getY(100)).toBeCloseTo(0.4);
    dispose(mesh); dispose(body);
  });
});
