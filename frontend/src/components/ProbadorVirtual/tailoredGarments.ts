import * as THREE from 'three';

type Kind = 'football-shirt' | 'joggers';
type Size = 'S' | 'M' | 'L';
type Point = [number, number, number];

/**
 * Bind-space patterns for the male pilot (Y up, front +Z, centimetre-like units).
 * UVs use Three's bottom-left origin, not canvas coordinates:
 *
 * Shirt body: front U .02..48, back U .52..98, V .02..78.
 * Front U = .02 + (x + 22) / 44 * .46; back reverses X so lettering
 * reads normally when viewed from behind. V = .02 + (y - 90) / 54 * .76.
 * Sleeves: four tiles U 0..25, .25..50, .50..75, .75..1, V .82..97,
 * in order negative-X front, negative-X back, positive-X front, positive-X back.
 * Tile U runs shoulder -> sleeve end; V runs underarm -> shoulder seam.
 * Contrasting V-neck binding (both faces and opening turn): U 0..1, V .985..1.
 *
 * Joggers: front U .02..48, back U .52..98, V .02..98.
 * Front U = .02 + (x + 22) / 44 * .46; back reverses X.
 * V = .02 + (y - 10) / 84 * .96. Waistband is Y 91..94, cuffs Y 10..14.
 * Thus front/back logos must be drawn separately, never mirrored by the texture.
 * Rims reuse their adjacent fabric UVs. No textures are created here.
 *
 * Attach alongside the body in the SAME local coordinate system; do not reapply
 * its ancestor scale. Skeleton posing and morph influences belong to the caller.
 * M is the authored pattern. S/L change cloth ease, not the avatar's proportions.
 */
export function buildTailoredGarment(bodyMesh: THREE.SkinnedMesh, kind: Kind): THREE.SkinnedMesh {
  const source = bodyMesh.geometry;
  const sourcePosition = source.getAttribute('position');
  const sourceIndex = source.getAttribute('skinIndex');
  const sourceWeight = source.getAttribute('skinWeight');
  if (!sourcePosition?.count || !sourceIndex || !sourceWeight || !bodyMesh.skeleton?.bones.length) {
    throw new Error('Tailored garments require a bind-space body with skin attributes and a skeleton');
  }
  source.computeBoundingBox();
  // The optional small-unit asset uses approximately 0.1 of the male units.
  const factor = source.boundingBox!.max.y < 30 ? 0.1 : 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const centers: number[] = [];
  const depthCenters: number[] = [];
  const atlas = (p: Point, front: boolean): [number, number] => [
    (front ? 0.02 : 0.52) + ((front ? p[0] : -p[0]) + 22) / 44 * 0.46,
    kind === 'football-shirt' ? 0.02 + (p[1] - 90) / 54 * 0.76 : 0.02 + (p[1] - 10) / 84 * 0.96,
  ];
  const vertex = (p: Point, uv: [number, number], center = 0, depthCenter = -5) => {
    const id = positions.length / 3;
    positions.push(...p.map(v => v * factor));
    uvs.push(...uv);
    centers.push(center * factor);
    depthCenters.push(depthCenter * factor);
    return id;
  };
  const point = (id: number): Point => [positions[id * 3] / factor, positions[id * 3 + 1] / factor, positions[id * 3 + 2] / factor];
  const quad = (a: number, b: number, c: number, d: number, front: boolean) => {
    if (front) indices.push(a, b, d, b, c, d);
    else indices.push(a, d, b, b, d, c);
  };
  // Every panel uses the same winding in its (horizontal, vertical) coordinates.
  const panel = (columns: number, rows: number, sample: (u: number, v: number) => Point,
    front: boolean, uv?: (p: Point, u: number, v: number) => [number, number],
    center: number | ((v: number) => [number, number]) = 0) => {
    const grid: number[][] = [];
    for (let j = 0; j <= rows; j++) {
      const row: number[] = [];
      for (let i = 0; i <= columns; i++) {
        const p = sample(i / columns, j / rows);
        const origin = typeof center === 'number' ? [center, -5] : center(j / rows);
        row.push(vertex(p, uv ? uv(p, i / columns, j / rows) : atlas(p, front), origin[0], origin[1]));
      }
      grid.push(row);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
      quad(grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i], front);
    }
    return grid;
  };
  // Turn opening edges inward by 0.24 units, rather than leaving a paper edge.
  const rim = (edge: number[], shift: (p: Point) => Point, reverse: boolean) => {
    const inner = edge.map(id => {
      const p = point(id);
      const delta = shift(p);
      return vertex([p[0] + delta[0], p[1] + delta[1], p[2] + delta[2]],
        [uvs[id * 2], uvs[id * 2 + 1]], centers[id] / factor, depthCenters[id] / factor);
    });
    for (let i = 0; i < edge.length - 1; i++) quad(edge[i], edge[i + 1], inner[i + 1], inner[i], reverse);
  };
  const ellipse = (q: number) => Math.sqrt(Math.max(0, 1 - q * q));

  if (kind === 'football-shirt') {
    // Identical column stations above/below the armhole avoid T-junctions.
    const xs = Array.from({ length: 49 }, (_, i) => (i / 48 * 2 - 1) * 20.5);
    xs.push(-8, 8);
    xs.sort((a, b) => a - b);
    for (const front of [true, false]) {
      const sign = front ? 1 : -1;
      const lower = panel(xs.length - 1, 18, (u, v) => {
        const q = xs[Math.round(u * (xs.length - 1))] / 20.5;
        const y = 90 + 32 * v;
        const width = 18 + 2.5 * v;
        const fold = 0.20 * Math.sin(q * 17 + v * 5) * Math.sin(Math.PI * v);
        // Keep the free hem outside the jogger waistband, including its turned rim.
        const depth = 12.8 + 1.5 * (1 - v) ** 2;
        return [q * width, y, -5 + sign * (depth + fold) * ellipse(q)];
      }, front);
      rim(lower[0], p => [-p[0] / 18 * 0.24, 0.24, -(p[2] + 5) / 12.8 * 0.24], !front);

      // Include the two neck corners exactly; this keeps the V open, not painted.
      const upper: number[][] = [];
      for (let j = 0; j <= 14; j++) {
        const t = j / 14;
        upper.push(xs.map(x => {
          const a = Math.abs(x);
          const neck = a <= 8;
          const top = neck ? (front ? 133 + 8 * a / 8 : 140 + a / 8) : 141 + (a - 8) / 12.5;
          const depthTop = neck ? 7.6 * ellipse(x / 8) : 0;
          // Roll over the chest/scapulae instead of cutting a straight shortcut
          // to the shoulder. Both opening and sleeve-root endpoints stay fixed.
          const falloff = !front && neck ? 1 - t * t : Math.sqrt(1 - t ** 3);
          const depth = 12.8 * ellipse(x / 20.5) * falloff + depthTop * (front ? 1 - falloff : t * t)
            + 8.8 * Math.sin(Math.PI * t) * Math.pow(a / 20.5, 6);
          const p: Point = [x, 122 + (top - 122) * t, -5 + sign * depth];
          return vertex(p, atlas(p, front));
        }));
      }
      for (let j = 0; j < 14; j++) for (let i = 0; i < xs.length - 1; i++) {
        let ids = [upper[j][i], upper[j][i + 1], upper[j + 1][i + 1], upper[j + 1][i]];
        if (j >= 12 && xs[i] >= -8 && xs[i + 1] <= 8) {
          // Split UV vertices at the binding, but smooth normals across the seam.
          ids = ids.map((id, k) => vertex(point(id), [(xs[i + (k === 1 || k === 2 ? 1 : 0)] + 8) / 16,
            k < 2 ? 0.985 : 1]));
        }
        quad(ids[0], ids[1], ids[2], ids[3], front);
      }
      const neckEdge = upper[14].filter((_, i) => Math.abs(xs[i]) <= 8);
      const collarRim = neckEdge.map(id => vertex(point(id), [(point(id)[0] + 8) / 16, 1]));
      rim(collarRim, p => [-p[0] / 8 * 0.24, -0.24, -(p[2] + 5) / 7.6 * 0.24], front);

      for (const side of [-1, 1]) {
        // The sleeve root reproduces the upper panel's side edge exactly.
        const sleeve = panel(12, 14, (u, t) => {
          const rootY = 122 + 20 * t;
          const endY = 124.5 + 17 * t;
          return [side * (20.5 + 15.5 * u), rootY * (1 - u) + endY * u,
            -5 + sign * Math.sin(Math.PI * t) * (8.8 - 0.8 * u)];
        }, front === (side === 1), (_p, u, t) => [
          (side < 0 ? 0 : 0.5) + (front ? 0 : 0.25) + u * 0.25, 0.82 + t * 0.15,
        ], side * 20.5);
        rim(sleeve.map(row => row[12]), p => [-side * 0.24,
          -(p[1] - 133) / 8.5 * 0.24, -(p[2] + 5) / 8 * 0.24], front === (side === 1));
      }
    }
  } else {
    // Y, positive-X leg centre, Z centre, X radius, Z radius in bind units.
    // Monotone Hermite slopes avoid overshooting the audited calf/knee outline.
    const stations = [
      [10, 13.108, -6.044, 3.8, 5.3],
      [14, 13, -6, 4, 5.5],
      [20, 12.8, -6.6, 6.3, 6.5],
      [30, 12.44, -7.48, 7.1, 7],
      [50, 10.73, -4.27, 7.4, 7.8],
      [70, 9.39, -4.15, 9.5, 10.2],
      [74, 9.5, -5, 9.5, 10.2],
    ];
    const slopes = stations.map((station, i) => station.map((_, axis) => {
      if (!axis) return 0;
      if (i === 0) return (stations[1][axis] - station[axis]) / (stations[1][0] - station[0]);
      if (i === stations.length - 1) return (station[axis] - stations[i - 1][axis]) / (station[0] - stations[i - 1][0]);
      const before = station[0] - stations[i - 1][0], after = stations[i + 1][0] - station[0];
      const left = (station[axis] - stations[i - 1][axis]) / before;
      const right = (stations[i + 1][axis] - station[axis]) / after;
      if (left * right <= 0) return 0;
      const w1 = 2 * after + before, w2 = after + 2 * before;
      return (w1 + w2) / (w1 / left + w2 / right);
    }));
    const sections: number[][] = [];
    const steps = [3, 4, 5, 9, 10, 5];
    for (let segment = 0; segment < steps.length; segment++) {
      const a = stations[segment], b = stations[segment + 1];
      const span = b[0] - a[0];
      for (let row = 0; row < steps[segment]; row++) {
        const t = row / steps[segment], t2 = t * t, t3 = t2 * t;
        sections.push(a.map((value, axis) => axis === 0 ? value + span * t
          : (2 * t3 - 3 * t2 + 1) * value + (t3 - 2 * t2 + t) * span * slopes[segment][axis]
            + (-2 * t3 + 3 * t2) * b[axis] + (t3 - t2) * span * slopes[segment + 1][axis]));
      }
    }
    sections.push(stations[stations.length - 1]);
    for (const front of [true, false]) {
      const sign = front ? 1 : -1;
      const pelvis = panel(48, 12, (u, v) => {
        const q = u * 2 - 1;
        const row = v * 12;
        const y = row <= 8 ? 74 + row * 2 : 90 + row - 8;
        const height = (y - 74) / 20;
        const width = 19 - 1.6 * Math.min(1, Math.max(0, (y - 87) / 4));
        // A double-lobed bottom boundary becomes a single waist ellipse.
        // Its shared central saddle is the crotch bridge, not overlapping tubes.
        const lobes = ellipse(2 * Math.abs(q) - 1);
        // A rounded saddle restores seat/front-rise volume immediately above
        // the crotch without changing either the bottom join or the waistband.
        const rise = Math.sqrt(1 - (1 - height) ** 3);
        const depth = 10.2 * lobes * (1 - rise) + 12.8 * ellipse(q) * rise;
        return [q * width, y, -5 + sign * depth];
      }, front);
      rim(pelvis[12], p => [-p[0] / 17.4 * 0.24, -0.24, -(p[2] + 5) / 12.8 * 0.24], front);
      for (const side of [-1, 1]) {
        const leg = panel(24, 36, (u, v) => {
          const [y, cx, cz, rx, rz] = sections[Math.round(v * 36)];
          const q = u * 2 - 1;
          // Local, oblique cloth bunches, not evenly spaced sinusoidal ribs.
          const fold = THREE.MathUtils.smoothstep(y, 14, 17) * (1 - THREE.MathUtils.smoothstep(y, 60, 70))
            * (0.28 * Math.exp(-Math.pow((y - 18.4 - side * q * 1.4) / 1.8, 2))
              + 0.13 * Math.exp(-Math.pow((y - 24.5 + side * q) / 2.1, 2))
              + 0.10 * Math.exp(-Math.pow((y - 42 - side * q * 2) / 3, 2)));
          return [side * cx + q * (rx + fold * 0.55), y, cz + sign * (rz + fold) * ellipse(q)];
        }, front, undefined, v => {
          const section = sections[Math.round(v * 36)];
          return [side * section[1], section[2]];
        });
        rim(leg[0], p => [-(p[0] - side * 13.108) / 3.8 * 0.24,
          0.24, -(p[2] + 6.044) / 5.3 * 0.24], !front);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  // Deduplicate source corners before bucketing: the shipped GLB is nonindexed.
  // Four inverse-distance neighbours interpolate smoothly without scanning the
  // 80k source vertices for each pattern vertex. Search is capped at six cells.
  const cell = 5 * factor;
  const buckets = new Map<string, number[]>();
  const unique = new Set<string>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  for (let i = 0; i < sourcePosition.count; i++) {
    const x = sourcePosition.getX(i), y = sourcePosition.getY(i), z = sourcePosition.getZ(i);
    const exact = key(Math.round(x / factor * 10000), Math.round(y / factor * 10000), Math.round(z / factor * 10000));
    if (unique.has(exact)) continue;
    unique.add(exact);
    const k = key(Math.floor(x / cell), Math.floor(y / cell), Math.floor(z / cell));
    const bucket = buckets.get(k);
    if (bucket) bucket.push(i); else buckets.set(k, [i]);
  }
  const skinIndices = new Uint16Array(positions.length / 3 * 4);
  const skinWeights = new Float32Array(skinIndices.length);
  const sourceMorphs = source.morphAttributes.position ?? [];
  const morphs = sourceMorphs.map(() => new Float32Array(positions.length));
  const fallbackBuckets = new Map<string, number[]>();
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const bx = Math.floor(x / cell), by = Math.floor(y / cell), bz = Math.floor(z / cell);
    const nearest: { index: number; distance: number }[] = [];
    const consider = (id: number) => {
      const sx = sourcePosition.getX(id), sy = sourcePosition.getY(id);
      // Do not borrow the other thigh or a torso influence across an armpit.
      if (kind === 'joggers' && y < 73 * factor && sx * x < 0) return;
      if (kind === 'football-shirt' && Math.abs(x) > 24 * factor && (Math.abs(sx) < 17 * factor || sy < 117 * factor)) return;
      const distance = (sx - x) ** 2 + (sy - y) ** 2 + (sourcePosition.getZ(id) - z) ** 2;
      if (nearest.length === 4 && distance >= nearest[3].distance) return;
      nearest.push({ index: id, distance });
      nearest.sort((a, b) => a.distance - b.distance);
      if (nearest.length > 4) nearest.pop();
    };
    for (let r = 0; r <= 6; r++) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== r) continue;
        const bucket = buckets.get(key(bx + dx, by + dy, bz + dz));
        if (bucket) for (const id of bucket) consider(id);
      }
      // Any unvisited cell is at least r * cell from this cell's interior.
      if (nearest.length === 4 && nearest[3].distance < (r * cell) ** 2) break;
    }
    if (!nearest.length) {
      const k = key(bx, by, bz);
      let fallback = fallbackBuckets.get(k);
      if (!fallback) {
        let best = Infinity;
        for (const bucket of buckets.values()) {
          const id = bucket[0];
          const d = (sourcePosition.getX(id) - x) ** 2 + (sourcePosition.getY(id) - y) ** 2 + (sourcePosition.getZ(id) - z) ** 2;
          if (d < best) { best = d; fallback = bucket; }
        }
        fallbackBuckets.set(k, fallback!);
      }
      // Degenerate/sparse fixtures may have no anatomically matching region.
      for (const id of fallback!) consider(id);
      if (!nearest.length) nearest.push({ index: fallback![0], distance: 1 });
    }
    const total = nearest.reduce((sum, n) => sum + 1 / Math.max(n.distance, 1e-8 * factor * factor), 0);
    const bones = new Map<number, number>();
    for (const n of nearest) {
      const w = 1 / Math.max(n.distance, 1e-8 * factor * factor) / total;
      for (let slot = 0; slot < 4; slot++) {
        const bone = sourceIndex.getComponent(n.index, slot);
        const weight = sourceWeight.getComponent(n.index, slot);
        if (bone >= 0 && bone < bodyMesh.skeleton.bones.length && weight > 0) bones.set(bone, (bones.get(bone) ?? 0) + weight * w);
      }
      for (let m = 0; m < morphs.length; m++) for (let axis = 0; axis < 3; axis++) {
        const delta = sourceMorphs[m].getComponent(n.index, axis)
          - (source.morphTargetsRelative ? 0 : sourcePosition.getComponent(n.index, axis));
        morphs[m][i * 3 + axis] += delta * w;
      }
    }
    const strongest = [...bones].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const weightSum = strongest.reduce((sum, b) => sum + b[1], 0);
    if (!weightSum) strongest.push([0, 1]);
    strongest.forEach(([bone, weight], slot) => {
      skinIndices[i * 4 + slot] = bone;
      skinWeights[i * 4 + slot] = weight / (weightSum || 1);
    });
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = morphs.map((m, i) => {
    const attribute = new THREE.Float32BufferAttribute(m, 3);
    attribute.name = sourceMorphs[i].name;
    return attribute;
  });

  // UV/panel duplicates share normals. Use the authored positions as seam IDs so
  // repeated sizing cannot change which vertices belong to the same seam.
  const seamMap = new Map<string, number[]>();
  for (let i = 0; i < positions.length / 3; i++) {
    const k = key(Math.round(positions[i * 3] / factor * 10000),
      Math.round(positions[i * 3 + 1] / factor * 10000), Math.round(positions[i * 3 + 2] / factor * 10000));
    const seam = seamMap.get(k);
    if (seam) seam.push(i); else seamMap.set(k, [i]);
  }
  geometry.userData = {
    tailoredKind: kind, factor, basePositions: new Float32Array(positions),
    centers: new Float32Array(centers), depthCenters: new Float32Array(depthCenters),
    seams: [...seamMap.values()].filter(s => s.length > 1),
    uvAtlas: kind === 'football-shirt' ? 'shirt-panels-v1' : 'jogger-panels-v1',
  };
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide,
  }));
  mesh.name = kind === 'football-shirt' ? 'garment_polo' : 'garment_pant';
  mesh.userData = geometry.userData;
  mesh.bindMode = bodyMesh.bindMode;
  mesh.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);
  mesh.bindMatrixInverse.copy(bodyMesh.bindMatrixInverse);
  mesh.morphTargetDictionary = bodyMesh.morphTargetDictionary ? { ...bodyMesh.morphTargetDictionary } : undefined;
  mesh.morphTargetInfluences = bodyMesh.morphTargetInfluences;
  mesh.castShadow = mesh.receiveShadow = true;
  updateTailoredGarment(mesh, 'M');
  geometry.userData.baseNormals = new Float32Array(geometry.getAttribute('normal').array);
  return mesh;
}

export function updateTailoredGarment(mesh: THREE.SkinnedMesh, size: Size): void {
  const geometry = mesh.geometry;
  const data = geometry.userData;
  if (!data.tailoredKind || !data.basePositions) return;
  const base = data.basePositions as Float32Array;
  const centers = data.centers as Float32Array;
  const depthCenters = data.depthCenters as Float32Array;
  const factor = data.factor as number;
  const amount = size === 'S' ? -0.45 : size === 'L' ? 1.05 : 0;
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    const shirt = data.tailoredKind === 'football-shirt';
    // Keep the neck/shoulder seam stable; cuffs and waistband stretch less.
    const ease = shirt ? Math.min(1, Math.max(0, (141 - y / factor) / 18))
      : Math.min(1, Math.max(0.22, (y / factor - 10) / 10));
    const center = shirt || y >= 74 * factor ? 0
      : centers[i] * Math.min(1, (74 - y / factor) / 10);
    position.setXYZ(i, x + (x - center) * amount * ease / 24,
      y, z + (z - depthCenters[i]) * amount * ease / 16);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute('normal');
  for (const seam of data.seams as number[][]) {
    let x = 0, y = 0, z = 0;
    for (const id of seam) { x += normal.getX(id); y += normal.getY(id); z += normal.getZ(id); }
    const length = Math.hypot(x, y, z) || 1;
    for (const id of seam) normal.setXYZ(id, x / length, y / length, z / length);
  }
  normal.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh.userData.tailoredSize = size;
}
