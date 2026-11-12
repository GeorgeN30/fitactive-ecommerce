import * as THREE from 'three';
import type { GarmentVisual } from '../../utils/garmentVisuals';

// This atlas depicts observed front details; it is not a reconstruction of the unseen back.
export function createTailoredTexture(kind: GarmentVisual['kind'], color: string, branded = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1024, 1024);

  // Restrained, deterministic knit variation, without baking large fake shadows into the fabric.
  for (let y = 0; y < 1024; y += 3) {
    ctx.fillStyle = y % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';
    ctx.fillRect(0, y, 1024, 1);
  }
  const uv = (u: number, v: number): [number, number] => [u * 1024, (1 - v) * 1024];
  const line = (points: [number, number][], width = 1, light = false) => {
    ctx.strokeStyle = light ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.19)';
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([u, v], index) => { const [x, y] = uv(u, v); if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
  };
  if (kind === 'football-shirt') {
    // Only the dedicated collar UV strip is white; body and sleeves stay red.
    ctx.fillStyle = '#f4f2ec';
    ctx.fillRect(0, 0, 1024, 16);
    for (let x = 0; x < 1024; x += 3) {
      ctx.fillStyle = 'rgba(90,80,70,0.10)'; ctx.fillRect(x, 0, 1, 16);
    }
    for (const offset of [0, 0.5]) {
      line([[0.025 + offset, 0.048], [0.475 + offset, 0.048]], 1.3, true);
      line([[0.025 + offset, 0.055], [0.475 + offset, 0.055]], 1, true);
    }
    for (let tile = 0; tile < 4; tile++) {
      line([[(tile + 0.94) / 4, 0.823], [(tile + 0.94) / 4, 0.968]], 1.2, true);
    }
    if (branded) {
      // The reference has the print on the wearer's right (viewer left), front only.
      const [x, y] = uv(0.174, 0.55);
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#f7f5f0';
      ctx.rotate(-0.45);
      for (let i = 0; i < 3; i++) ctx.fillRect(-15 + i * 12, -3 - i * 6, 7, 12 + i * 6);
      ctx.restore();
      ctx.fillStyle = '#f7f5f0'; ctx.font = 'bold 17px Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('adidas', x, y + 23);
    }
  } else {
    // Waistband and ankle ribbing occupy the same Y stations as the pattern geometry.
    for (const [bottom, top] of [[0.946, 0.98], [0.02, 0.066]]) {
      const y = (1 - top) * 1024, height = (top - bottom) * 1024;
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, y, 1024, height);
      for (let x = 0; x < 1024; x += 4) {
        ctx.fillStyle = 'rgba(255,255,255,0.055)'; ctx.fillRect(x, y, 1, height);
      }
      line([[0.02, bottom], [0.48, bottom]], 1.4, true);
      line([[0.52, bottom], [0.98, bottom]], 1.4, true);
    }
    // Subtle front pocket openings; no invented contrast stripes or rear branding.
    line([[0.075, 0.927], [0.105, 0.87], [0.13, 0.835]], 3);
    line([[0.425, 0.927], [0.395, 0.87], [0.37, 0.835]], 3);
    line([[0.077, 0.927], [0.107, 0.87], [0.132, 0.835]], 1, true);
    line([[0.423, 0.927], [0.393, 0.87], [0.368, 0.835]], 1, true);
    if (branded) {
      const [x, y] = uv(0.363, 0.837);
      ctx.fillStyle = '#ecebe6'; ctx.font = '900 17px Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('PUMA', x, y + 8);
      // A small approximate leaping mark, not a photograph pasted across the whole leg.
      ctx.save(); ctx.translate(x + 12, y - 13); ctx.lineWidth = 3; ctx.strokeStyle = '#ecebe6'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, 3); ctx.quadraticCurveTo(0, -5, 8, -1); ctx.lineTo(13, -10);
      ctx.moveTo(-7, 3); ctx.lineTo(-14, 10); ctx.moveTo(6, -1); ctx.lineTo(13, 4);
      ctx.moveTo(-8, 2); ctx.quadraticCurveTo(-17, -2, -18, -10); ctx.stroke(); ctx.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
