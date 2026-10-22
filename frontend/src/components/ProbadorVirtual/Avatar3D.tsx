import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useStoreSettings } from '../../context/StoreSettingsContext';

// Precarga de los modelos humanos atléticos reales (Hombre morph MakeHuman y Mujer morph MakeHuman)
useGLTF.preload('/avatar/hombre_morph.glb?v=5');
useGLTF.preload('/avatar/mujer_morph.glb?v=13');

export interface BodyScales {
  scalePecho: number;
  scaleCintura: number;
  scaleCadera: number;
  scaleMuslo: number;
  scaleHombros?: number;
  scaleBrazo?: number;
  scaleAltura: number;
}

// Material unificado Maniquí Studio Nike (Porcelana grafito de alta definición)
const createNikeMatteBlackMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color('#383c44'), // Acabado de maniquí de estudio atlético profesional
    roughness: 0.54,                  // Satinado suave para resaltar los contornos anatómicos
    metalness: 0.12,                  // Reflejo sutil de pasarela
    flatShading: false,
  });


type GarmentType = 'polo' | 'top' | 'top_bra' | 'top_tank' | 'short' | 'legging';

// Generador procedural de micro-tejido atlético (Dri-FIT / pique knit weave)
let sharedFabricBumpMap: THREE.CanvasTexture | null = null;
function getAthleticFabricBumpMap(): THREE.CanvasTexture {
  if (sharedFabricBumpMap) return sharedFabricBumpMap;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#626262';
  for (let y = 0; y < 128; y += 4) {
    for (let x = 0; x < 128; x += 4) {
      if ((x / 4 + y / 4) % 2 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  sharedFabricBumpMap = texture;
  return texture;
}

// Caché de colores dominantes extraídos de las fotos del catálogo
const imageColorCache: Record<string, string> = {};

// Extrae el color textil auténtico de la foto del catálogo excluyendo el fondo blanco y la piel del modelo
function extractDominantColor(
  imageUrl: string | undefined,
  fallback: string,
  onExtracted: (color: string) => void
) {
  if (!imageUrl) {
    onExtracted(fallback);
    return;
  }
  if (imageColorCache[imageUrl]) {
    onExtracted(imageColorCache[imageUrl]);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onExtracted(fallback);
        return;
      }
      ctx.drawImage(img, 0, 0, 64, 64);
      const imgData = ctx.getImageData(0, 0, 64, 64);
      const d = imgData.data;

      // 1. Muestrear las esquinas para determinar el color de fondo del packshot
      const sample = (px: number, py: number) => {
        const idx = (py * 64 + px) * 4;
        return { r: d[idx], g: d[idx + 1], b: d[idx + 2] };
      };
      const corners = [sample(1, 1), sample(62, 1), sample(1, 62), sample(62, 62)];
      const bgR = corners.reduce((acc, c) => acc + c.r, 0) / 4;
      const bgG = corners.reduce((acc, c) => acc + c.g, 0) / 4;
      const bgB = corners.reduce((acc, c) => acc + c.b, 0) / 4;
      const isWhiteBg = bgR > 230 && bgG > 230 && bgB > 230;

      let rTotal = 0, gTotal = 0, bTotal = 0, validPixels = 0;
      let darkR = 0, darkG = 0, darkB = 0, darkCount = 0;
      let lightCount = 0;

      // 2. Muestreo de la zona central donde se ubica la prenda textil
      for (let y = 14; y < 52; y++) {
        for (let x = 16; x < 48; x++) {
          const i = (y * 64 + x) * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
          if (a < 120) continue;

          // Ignorar píxeles idénticos al fondo de las 4 esquinas
          if (isWhiteBg && r > 248 && g > 248 && b > 248) continue;

          // Filtrar piel humana de modelos fotográficos (evita teñir la ropa de beige)
          const isModelSkin = r > 115 && g > 65 && b > 35 && r > g && g >= b && (r - b) > 15 && (r - b) < 110;
          if (isModelSkin) continue;

          // Si hay prenda negra/oscura en la foto
          if (r < 70 && g < 70 && b < 70) {
            darkR += r; darkG += g; darkB += b; darkCount++;
          } else if (r > 215 && g > 215 && b > 215) {
            // Prenda blanca identificada en la zona central
            lightCount++;
          } else {
            rTotal += r; gTotal += g; bTotal += b; validPixels++;
          }
        }
      }

      if (fallback === '#f5f6f9') {
        // Prenda blanca oficial confirmada (como el Nike Dri-FIT Legend)
        imageColorCache[imageUrl] = '#f5f6f9';
        onExtracted('#f5f6f9');
      } else if (darkCount > 10) {
        // Prenda oscura/negra identificada con certeza
        const avgR = Math.round(darkR / darkCount);
        const avgG = Math.round(darkG / darkCount);
        const avgB = Math.round(darkB / darkCount);
        const hex = '#' + ((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1);
        imageColorCache[imageUrl] = hex;
        onExtracted(hex);
      } else if (validPixels > 15) {
        const avgR = Math.round(rTotal / validPixels);
        const avgG = Math.round(gTotal / validPixels);
        const avgB = Math.round(bTotal / validPixels);
        const hex = '#' + ((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1);
        imageColorCache[imageUrl] = hex;
        onExtracted(hex);
      } else {
        imageColorCache[imageUrl] = fallback;
        onExtracted(fallback);
      }
    } catch {
      onExtracted(fallback);
    }
  };
  img.onerror = () => {
    onExtracted(fallback);
  };
  img.src = '/api/products/image-proxy?url=' + encodeURIComponent(imageUrl);
}

// Paleta de respaldo inteligente basada en nombre o descripción
function getFallbackGarmentColor(selectedProduct?: any): string {
  if (!selectedProduct) return '#121316';
  const name = (selectedProduct.nombre || '').toLowerCase();
  const desc = (selectedProduct.descripcion || '').toLowerCase();
  const full = `${name} ${desc}`;

  // Prendas oficiales clave de la base de datos
  if (name.includes('legend')) return '#f5f6f9';        // Nike Dri-FIT Legend es BLANCO oficial
  if (name.includes('alate')) return '#7b5c52';         // Nike Alate Minimalist es MARRÓN CHOCOLATE / ESPRESSO oficial
  if (name.includes('yoga')) return '#a94c42';          // Nike Yoga Dri-FIT Top es TERRACOTA / SALMON CORAL oficial
  if (name.includes('pro 365') || name.includes('nike pro')) return '#111215'; // Nike Pro 365 es NEGRO de compresión
  if (name.includes('vector')) return '#111215';        // Reebok Classics Vector es NEGRO oficial con chevron blanco
  if (name.includes('challenger')) return '#121316';    // Nike Challenger es NEGRO deportivo
  if (name.includes('tiro')) return '#121316';          // Adidas Tiro 23 es NEGRO deportivo
  if (name.includes('unstoppable')) return '#141518';   // Under Armour Unstoppable es NEGRO sigilo
  if (name.includes('lux jogger')) return '#1a1b20';    // Reebok Lux Jogger es CHARCOAL jaspeado
  if (name.includes('colorblock')) return '#121316';    // Puma Power Colorblock es NEGRO con paneles blancos

  if (full.includes('blanco') || full.includes('white')) return '#f5f6f9';
  if (full.includes('azul') || full.includes('blue') || full.includes('navy')) return '#1e3a8a';
  if (full.includes('rojo') || full.includes('red') || full.includes('crimson')) return '#b91c1c';
  if (full.includes('verde') || full.includes('green') || full.includes('olive')) return '#15803d';
  if (full.includes('gris') || full.includes('grey') || full.includes('heather')) return '#4b5563';
  if (full.includes('amarillo') || full.includes('yellow')) return '#ca8a04';
  if (full.includes('rosa') || full.includes('pink')) return '#db2777';

  return '#141518';
}

function getLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Textura de confección deportiva con diseño y detalles idénticos a los packshots de catálogo
function createBrandLogoTexture(
  productName: string,
  brandName: string,
  garmentType: GarmentType,
  baseColor: string = '#181a20'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const nameUpper = `${productName} ${brandName}`.toUpperCase();

  // Detección de prendas icónicas específicas del catálogo oficial
  const isReebokVector = nameUpper.includes('VECTOR') || (nameUpper.includes('REEBOK') && nameUpper.includes('CLASSICS'));
  const isUAUnstoppable = nameUpper.includes('UNSTOPPABLE');
  const isAdidasTiro = nameUpper.includes('TIRO');
  const isNikeLegend = nameUpper.includes('LEGEND');
  const isNikePro = nameUpper.includes('PRO 365') || nameUpper.includes('NIKE PRO');
  const isNikeChallenger = nameUpper.includes('CHALLENGER');
  const isPumaColorblock = nameUpper.includes('COLORBLOCK') || nameUpper.includes('PUMA POWER');
  const isNikeAlate = nameUpper.includes('ALATE') || nameUpper.includes('MINIMALIST');
  const isNikeYoga = nameUpper.includes('YOGA');
  const isReebokLux = nameUpper.includes('LUX JOGGER');

  // Asegurar que las prendas oficiales usen sus colores oficiales del catálogo packshot
  let effBaseColor = baseColor;
  if (isNikeLegend && (baseColor === '#181a20' || baseColor === '#121316' || baseColor === '#141518')) {
    effBaseColor = '#f5f6f9';
  } else if (isNikePro && (baseColor === '#f5f6f9' || baseColor === '#181a20' || baseColor === '#ffffff')) {
    effBaseColor = '#111215'; // Nike Pro 365 es negro compresión
  } else if (isReebokLux && (baseColor === '#f5f6f9' || baseColor === '#181a20' || baseColor === '#ffffff')) {
    effBaseColor = '#141518'; // Reebok Lux Jogger es carbón oscuro mate
  } else if (isPumaColorblock && (baseColor === '#f5f6f9' || baseColor === '#181a20' || baseColor === '#ffffff')) {
    effBaseColor = '#111215'; // Puma Power Colorblock es negro
  } else if (isNikeAlate && (baseColor === '#181a20' || baseColor === '#121316' || baseColor === '#141518' || baseColor === '#ffffff')) {
    effBaseColor = '#7b5c52';
  } else if (isNikeYoga && (baseColor === '#181a20' || baseColor === '#121316' || baseColor === '#141518' || baseColor === '#ffffff')) {
    effBaseColor = '#a94c42';
  } else if (isReebokVector && (baseColor === '#181a20' || baseColor === '#141518' || baseColor === '#ffffff')) {
    effBaseColor = '#111215';
  } else if (isUAUnstoppable && (baseColor === '#181a20' || baseColor === '#ffffff')) {
    effBaseColor = '#141518';
  } else if (isAdidasTiro && (baseColor === '#181a20' || baseColor === '#ffffff')) {
    effBaseColor = '#121316';
  } else if (isNikeChallenger && (baseColor === '#181a20' || baseColor === '#ffffff')) {
    effBaseColor = '#121316';
  }

  // 1. Color base textil auténtico
  ctx.fillStyle = effBaseColor;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Micro-trama deportiva sutil (Dri-FIT / mesh)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let y = 0; y < 512; y += 4) {
    for (let x = 0; x < 512; x += 4) {
      if ((x + y) % 8 === 0) ctx.fillRect(x, y, 2, 2);
    }
  }

  const isDark = getLuminance(effBaseColor) < 130;
  const contrastLogoColor = isDark ? '#ffffff' : '#111215';

  // =========================================================================
  // DISEÑO 1: REEBOK CLASSICS VECTOR (Casaca con Chevron Blanco Gigante)
  // =========================================================================
  if (isReebokVector && (garmentType === 'polo' || garmentType === 'top')) {
    // Chevron Blanco Gigante que cruza diagonalmente el pecho
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(70, 0);    // Hombro derecho
    ctx.lineTo(260, 0);   // Centro cuello
    ctx.lineTo(470, 205); // Extremo diagonal izquierdo
    ctx.lineTo(415, 260); // Vértice inferior
    ctx.lineTo(256, 145); // Ángulo interior central
    ctx.lineTo(145, 210); // Brazo izquierdo de la V
    ctx.closePath();
    ctx.fill();

    // Detalle de panel blanco en el hombro derecho
    ctx.beginPath();
    ctx.moveTo(25, 75);
    ctx.lineTo(110, 55);
    ctx.lineTo(75, 155);
    ctx.closePath();
    ctx.fill();

    // Cremallera frontal completa metálica
    ctx.strokeStyle = '#1a1d24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(256, 0); ctx.lineTo(256, 475);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tirador de cremallera metálico
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(253, 90, 6, 16);

    // Cuello alto tipo chimenea (stand collar de windbreaker)
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, 512, 34);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(512, 32); ctx.stroke();

    // Logotipo bordado Reebok Vector en blanco sobre el pecho izquierdo
    const rx = 360, ry = 175;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(rx - 20, ry - 7);
    ctx.lineTo(rx + 20, ry);
    ctx.lineTo(rx - 9, ry + 9);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reebok', rx, ry + 20);

    // Pretina elástica inferior
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 475, 512, 37);
    for (let x = 0; x < 512; x += 6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(x, 475, 1.8, 37);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 475); ctx.lineTo(512, 475); ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 2: NIKE DRI-FIT LEGEND (Polo Blanco Clásico con Swoosh Negro Nítido)
  // =========================================================================
  if (isNikeLegend && (garmentType === 'polo' || garmentType === 'top')) {
    // Ribete de cuello acanalado suave sin bib
    ctx.strokeStyle = '#d5dae2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(256, 10, 75, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    // Swoosh oficial Nike en negro atlético en el pectoral izquierdo (proporción perfecta)
    const sx = 345, sy = 175;
    ctx.fillStyle = '#111215';
    ctx.beginPath();
    ctx.moveTo(sx - 19, sy + 5);
    ctx.bezierCurveTo(sx - 6, sy + 13, sx + 10, sy + 10, sx + 19, sy - 11);
    ctx.bezierCurveTo(sx + 7, sy + 1, sx - 4, sy + 2, sx - 19, sy + 5);
    ctx.fill();

    // Sello técnico "DRI-FIT" en basta inferior derecha
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText('DRI-FIT', 145, 495);

    // Doble costura en la basta inferior
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 502); ctx.lineTo(512, 502);
    ctx.moveTo(0, 506); ctx.lineTo(512, 506);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 3: NIKE ALATE MINIMALIST (Sports Bra Marrón Espresso con Swoosh)
  // =========================================================================
  if (isNikeAlate && (garmentType === 'top_bra' || garmentType === 'top')) {
    // Banda elástica inferior de soporte bajo busto
    ctx.fillStyle = '#5c4138';
    ctx.fillRect(0, 440, 512, 72);
    for (let x = 0; x < 512; x += 6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(x, 440, 1.8, 72);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 440); ctx.lineTo(512, 440); ctx.stroke();

    // Swoosh minimalista blanco centrado en la banda de soporte bajo busto
    const sx = 256, sy = 476;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx - 14, sy + 3);
    ctx.bezierCurveTo(sx - 4, sy + 9, sx + 7, sy + 7, sx + 14, sy - 7);
    ctx.bezierCurveTo(sx + 5, sy + 1, sx - 3, sy + 1.5, sx - 14, sy + 3);
    ctx.fill();

    // Costuras de compresión ergonómicas en las copas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(175, 260, 65, -0.3, 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(337, 260, 65, Math.PI - 1.2, Math.PI + 0.3); ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 4: NIKE YOGA DRI-FIT TOP (Halter Crop Tank Terracota Coral)
  // =========================================================================
  if (isNikeYoga && (garmentType === 'top_tank' || garmentType === 'top')) {
    // Cuello alto halter acanalado
    ctx.fillStyle = '#8f3c33';
    ctx.fillRect(0, 0, 512, 36);
    for (let x = 0; x < 512; x += 5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x, 0, 1.6, 36);
    }

    // Doble costura plana en la basta crop
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 492); ctx.lineTo(512, 492);
    ctx.moveTo(0, 497); ctx.lineTo(512, 497);
    ctx.stroke();

    // Swoosh suave en el centro superior del pecho
    const sx = 256, sy = 75;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx - 15, sy + 4);
    ctx.bezierCurveTo(sx - 5, sy + 10, sx + 8, sy + 8, sx + 15, sy - 8);
    ctx.bezierCurveTo(sx + 5, sy + 1, sx - 3, sy + 1.5, sx - 15, sy + 4);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 5: ADIDAS TIRO 23 LEAGUE (Shorts con Pretina Acanalada y 3-Bars)
  // =========================================================================
  if (isAdidasTiro && garmentType === 'short') {
    // Pretina elástica acanalada superior
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, 512, 42);
    for (let x = 0; x < 512; x += 6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x, 0, 1.8, 42);
    }
    // Cordón central
    ctx.fillStyle = '#26282e';
    ctx.fillRect(253, 24, 6, 20);

    // Logotipo Adidas Performance 3-Bars en blanco sólido en pierna izquierda
    const ax = 390, ay = 430;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(-0.45); // Inclinación icónica Adidas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-22, 10, 8, 15); // barra 1
    ctx.fillRect(-8, 0, 8, 24);   // barra 2
    ctx.fillRect(6, -10, 8, 33);  // barra 3
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 6: UNDER ARMOUR UNSTOPPABLE (Buzo con Bolsillo Diagonal y Puños)
  // =========================================================================
  if (isUAUnstoppable && garmentType === 'legging') {
    // Pretina elástica con cordón
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(0, 0, 512, 38);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(250, 18, 4, 4);
    ctx.fillRect(258, 18, 4, 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(251, 22, 2, 18);
    ctx.fillRect(259, 22, 2, 18);

    // Bolsillo de carga con cremallera diagonal termosellada en el muslo derecho
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(135, 175);
    ctx.lineTo(185, 260);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(137, 178);
    ctx.lineTo(183, 257);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8'; // Tirador
    ctx.fillRect(182, 257, 5, 12);

    // Logotipo UA en cadera izquierda
    const uax = 370, uay = 85;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(uax, uay - 3, 8, 0, Math.PI, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(uax, uay + 3, 8, Math.PI, Math.PI * 2, false);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(uax - 2, uay - 6, 4, 12);

    // Puños elásticos de tobillo (cuffed ankles)
    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, 480, 512, 32);
    for (let x = 0; x < 512; x += 5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fillRect(x, 480, 1.8, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 7: NIKE PRO 365 (Leggings con Pretina Jacquard "NIKE PRO")
  // =========================================================================
  if (isNikePro && garmentType === 'legging') {
    // Pretina alta Jacquard "NIKE PRO"
    ctx.fillStyle = '#1c1e26';
    ctx.fillRect(0, 0, 512, 54);
    for (let x = 0; x < 512; x += 4) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(x, 0, 1.5, 54);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3.5px';
    ctx.fillText('NIKE PRO', 256, 35);
    ctx.fillText('NIKE PRO', 85, 35);
    ctx.fillText('NIKE PRO', 427, 35);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 54); ctx.lineTo(512, 54); ctx.stroke();

    // Costuras ergonómicas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 54); ctx.bezierCurveTo(100, 200, 110, 350, 120, 512);
    ctx.moveTo(392, 54); ctx.bezierCurveTo(412, 200, 402, 350, 392, 512);
    ctx.stroke();

    // Swoosh blanco en pantorrilla
    const npx = 385, npy = 430;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(npx - 22, npy + 6);
    ctx.bezierCurveTo(npx - 8, npy + 16, npx + 12, npy + 12, npx + 26, npy - 12);
    ctx.bezierCurveTo(npx + 8, npy + 2, npx - 4, npy + 3, npx - 22, npy + 6);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 8: PUMA POWER COLORBLOCK (Buzo Deportivo Mujer con Paneles y Cat)
  // =========================================================================
  if (isPumaColorblock && garmentType === 'legging') {
    // 1. Paneles laterales atléticos contrastantes en blanco
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 52, 512);
    ctx.fillRect(460, 0, 52, 512);

    // Borde de costura de panel
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, 0); ctx.lineTo(52, 512);
    ctx.moveTo(460, 0); ctx.lineTo(460, 512);
    ctx.stroke();

    // 2. Pretina elástica alta ceñida
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 0, 512, 40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 40); ctx.lineTo(512, 40);
    ctx.stroke();

    // 3. Logotipo oficial PUMA con barra en la cadera izquierda
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUMA', 372, 88);
    ctx.fillRect(352, 93, 40, 2.8);

    // 4. Iconic Puma Cat saltando en blanco en la pantorrilla derecha
    const pcx = 145, pcy = 405;
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-18, 7);
    ctx.quadraticCurveTo(-10, -5, 0, -9);
    ctx.quadraticCurveTo(8, -13, 14, -15);
    ctx.lineTo(16, -12);
    ctx.lineTo(13, -8);
    ctx.lineTo(19, -5);
    ctx.lineTo(15, -3);
    ctx.quadraticCurveTo(6, 2, -4, 6);
    ctx.lineTo(-12, 13);
    ctx.lineTo(-18, 14);
    ctx.quadraticCurveTo(-14, 9, -10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Puños elásticos inferiores
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 480, 512, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // DISEÑO 9: REEBOK LUX JOGGER (Buzo Deportivo Mujer con Cordón y Vector)
  // =========================================================================
  if (isReebokLux && garmentType === 'legging') {
    // 1. Pretina alta elástica acanalada
    ctx.fillStyle = '#111216';
    ctx.fillRect(0, 0, 512, 44);
    for (let x = 0; x < 512; x += 5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(x, 0, 1.8, 44);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(512, 44); ctx.stroke();

    // 2. Cordón central de ajuste con herretes (aglets) plateados
    ctx.fillStyle = '#22252c';
    ctx.beginPath();
    ctx.arc(248, 22, 4, 0, Math.PI * 2);
    ctx.arc(264, 22, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(248, 22);
    ctx.bezierCurveTo(246, 35, 242, 48, 240, 58);
    ctx.moveTo(264, 22);
    ctx.bezierCurveTo(266, 35, 270, 48, 272, 58);
    ctx.stroke();

    // Herretes metálicos
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(238, 56, 4, 8);
    ctx.fillRect(270, 56, 4, 8);

    // 3. Bolsillos laterales inclinados reforzados
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 44); ctx.lineTo(125, 140);
    ctx.moveTo(452, 44); ctx.lineTo(387, 140);
    ctx.stroke();

    // 4. Logotipo bordado Reebok Vector en blanco nítido sobre cadera izquierda
    const rx = 370, ry = 86;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(rx - 16, ry - 7);
    ctx.lineTo(rx + 16, ry);
    ctx.lineTo(rx - 7, ry + 7);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reebok', rx, ry + 17);

    // 5. Puños elásticos de jogger en los tobillos (cuffed ankles)
    ctx.fillStyle = '#0f1014';
    ctx.fillRect(0, 476, 512, 36);
    for (let x = 0; x < 512; x += 5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(x, 476, 1.8, 36);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 476); ctx.lineTo(512, 476); ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // =========================================================================
  // RENDERIZADOR GENERAL CON ESTILO DEPORTIVO
  // =========================================================================
  const isNike = nameUpper.includes('NIKE') || nameUpper.includes('JORDAN');
  const isReebok = nameUpper.includes('REEBOK');
  const isAdidas = nameUpper.includes('ADIDAS');
  const isPuma = nameUpper.includes('PUMA');
  const isUnderArmour = nameUpper.includes('ARMOUR') || nameUpper.includes('UA') || nameUpper.includes('UNDER');

  if (garmentType === 'polo' || garmentType === 'top' || garmentType === 'top_bra' || garmentType === 'top_tank') {
    // Cuello redondo acanalado fino (ribbed collar trim sin bib)
    if (garmentType === 'polo') {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(256, 12, 75, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();
    }

    // Ubicación en pecho
    const cx = (garmentType === 'top_bra' || garmentType === 'top_tank') ? 256 : 345;
    const cy = (garmentType === 'top_bra' || garmentType === 'top_tank') ? 200 : 175;
    ctx.fillStyle = contrastLogoColor;

    if (isNike) {
      // Swoosh nítido de Nike proporcional
      ctx.beginPath();
      ctx.moveTo(cx - 19, cy + 5);
      ctx.bezierCurveTo(cx - 6, cy + 13, cx + 10, cy + 10, cx + 19, cy - 11);
      ctx.bezierCurveTo(cx + 7, cy + 1, cx - 4, cy + 2, cx - 19, cy + 5);
      ctx.fill();
    } else if (isReebok) {
      // Vector de Reebok
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 7);
      ctx.lineTo(cx + 18, cy);
      ctx.lineTo(cx - 9, cy + 9);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Reebok', cx, cy + 18);
    } else if (isAdidas) {
      // 3 Barras Performance de Adidas
      ctx.fillRect(cx - 14, cy + 3, 5, 10);
      ctx.fillRect(cx - 3, cy - 2, 5, 15);
      ctx.fillRect(cx + 8, cy - 7, 5, 20);
    } else if (isUnderArmour) {
      // Under Armour Interlocking Logo
      ctx.lineWidth = 3;
      ctx.strokeStyle = contrastLogoColor;
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 8, 0, Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 8, Math.PI, Math.PI * 2, false);
      ctx.stroke();
      ctx.fillStyle = contrastLogoColor;
      ctx.fillRect(cx - 2, cy - 6, 4, 12);
    } else if (isPuma) {
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PUMA', cx, cy + 3);
      ctx.fillRect(cx - 18, cy + 7, 36, 2.5);
    } else {
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((brandName || 'PRO').toUpperCase(), cx, cy);
    }
  } else {
    // Pretina elástica atlética en shorts y pantalones con costuras deportivas
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, 512, 38);

    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 14); ctx.lineTo(512, 14);
    ctx.moveTo(0, 26); ctx.lineTo(512, 26);
    ctx.stroke();

    // Cordón central de ajuste
    ctx.fillStyle = isDark ? '#4b5563' : '#94a3b8';
    ctx.fillRect(252, 26, 8, 14);

    const lx = 370;
    const ly = garmentType === 'short' ? 400 : 180;
    ctx.fillStyle = contrastLogoColor;

    if (isNike) {
      // Nike Swoosh nítido en el muslo izquierdo
      ctx.beginPath();
      ctx.moveTo(lx - 20, ly + 5);
      ctx.bezierCurveTo(lx - 6, ly + 14, lx + 11, ly + 11, lx + 22, ly - 11);
      ctx.bezierCurveTo(lx + 8, ly + 1.5, lx - 4, ly + 2.5, lx - 20, ly + 5);
      ctx.fill();
    } else if (isReebok) {
      ctx.beginPath();
      ctx.moveTo(lx - 16, ly - 7);
      ctx.lineTo(lx + 16, ly);
      ctx.lineTo(lx - 7, ly + 7);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Reebok', lx, ly + 18);
    } else if (isAdidas) {
      ctx.fillRect(lx - 12, ly + 2, 5, 10);
      ctx.fillRect(lx - 2, ly - 3, 5, 15);
      ctx.fillRect(lx + 8, ly - 8, 5, 20);
    } else if (isUnderArmour) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = contrastLogoColor;
      ctx.beginPath();
      ctx.arc(lx, ly - 3, 8, 0, Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(lx, ly + 3, 8, Math.PI, Math.PI * 2, false);
      ctx.stroke();
      ctx.fillStyle = contrastLogoColor;
      ctx.fillRect(lx - 2, ly - 6, 4, 12);
    } else if (isPuma) {
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PUMA', lx, ly);
      ctx.fillRect(lx - 16, ly + 4, 32, 2);
    } else {
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((brandName || 'FIT').toUpperCase(), lx, ly);
    }

    if (garmentType === 'short') {
      // Split vent sutil lateral en basta de short de running
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(495, 512); ctx.lineTo(495, 480);
      ctx.moveTo(17, 512); ctx.lineTo(17, 480);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

interface GarmentVertex {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  sIdx?: [number, number, number, number];
  sWt?: [number, number, number, number];
  morphs?: Float32Array[];
}

type GarmentTriangle = [GarmentVertex, GarmentVertex, GarmentVertex];

function clipTriangleAgainstPlane(
  tri: GarmentTriangle,
  nx: number,
  ny: number,
  nz: number,
  d: number
): GarmentTriangle[] {
  const d0 = tri[0].x * nx + tri[0].y * ny + tri[0].z * nz + d;
  const d1 = tri[1].x * nx + tri[1].y * ny + tri[1].z * nz + d;
  const d2 = tri[2].x * nx + tri[2].y * ny + tri[2].z * nz + d;

  const in0 = d0 >= 0;
  const in1 = d1 >= 0;
  const in2 = d2 >= 0;

  if (in0 && in1 && in2) return [tri];
  if (!in0 && !in1 && !in2) return [];

  function lerpVert(a: GarmentVertex, b: GarmentVertex, da: number, db: number): GarmentVertex {
    const t = Math.max(0, Math.min(1, da / (da - db)));
    const lx = a.x + (b.x - a.x) * t;
    const ly = a.y + (b.y - a.y) * t;
    const lz = a.z + (b.z - a.z) * t;
    const inx = a.nx + (b.nx - a.nx) * t;
    const iny = a.ny + (b.ny - a.ny) * t;
    const inz = a.nz + (b.nz - a.nz) * t;
    const len = Math.hypot(inx, iny, inz) || 1;

    let morphs: Float32Array[] | undefined;
    if (a.morphs && b.morphs) {
      morphs = [];
      for (let m = 0; m < a.morphs.length; m++) {
        const ma = a.morphs[m];
        const mb = b.morphs[m];
        morphs.push(new Float32Array([
          ma[0] + (mb[0] - ma[0]) * t,
          ma[1] + (mb[1] - ma[1]) * t,
          ma[2] + (mb[2] - ma[2]) * t,
        ]));
      }
    }

    return {
      x: lx,
      y: ly,
      z: lz,
      nx: inx / len,
      ny: iny / len,
      nz: inz / len,
      sIdx: t < 0.5 ? a.sIdx : b.sIdx,
      sWt: t < 0.5 ? a.sWt : b.sWt,
      morphs,
    };
  }

  // 1 adentro, 2 afuera
  if (in0 && !in1 && !in2) {
    const v01 = lerpVert(tri[0], tri[1], d0, d1);
    const v02 = lerpVert(tri[0], tri[2], d0, d2);
    return [[tri[0], v01, v02]];
  }
  if (in1 && !in0 && !in2) {
    const v12 = lerpVert(tri[1], tri[2], d1, d2);
    const v10 = lerpVert(tri[1], tri[0], d1, d0);
    return [[tri[1], v12, v10]];
  }
  if (in2 && !in0 && !in1) {
    const v20 = lerpVert(tri[2], tri[0], d2, d0);
    const v21 = lerpVert(tri[2], tri[1], d2, d1);
    return [[tri[2], v20, v21]];
  }

  // 2 adentro, 1 afuera
  if (!in0 && in1 && in2) {
    const v10 = lerpVert(tri[1], tri[0], d1, d0);
    const v20 = lerpVert(tri[2], tri[0], d2, d0);
    return [[tri[1], tri[2], v20], [tri[1], v20, v10]];
  }
  if (!in1 && in0 && in2) {
    const v01 = lerpVert(tri[0], tri[1], d0, d1);
    const v21 = lerpVert(tri[2], tri[1], d2, d1);
    return [[tri[0], v01, v21], [tri[0], v21, tri[2]]];
  }
  if (!in2 && in0 && in1) {
    const v02 = lerpVert(tri[0], tri[2], d0, d2);
    const v12 = lerpVert(tri[1], tri[2], d1, d2);
    return [[tri[0], tri[1], v12], [tri[0], v12, v02]];
  }

  return [];
}

function clipTrianglesPlaneList(
  tris: GarmentTriangle[],
  nx: number,
  ny: number,
  nz: number,
  d: number
): GarmentTriangle[] {
  const result: GarmentTriangle[] = [];
  for (let i = 0; i < tris.length; i++) {
    const clipped = clipTriangleAgainstPlane(tris[i], nx, ny, nz, d);
    for (let k = 0; k < clipped.length; k++) {
      result.push(clipped[k]);
    }
  }
  return result;
}

function buildGarment(bodyMesh: THREE.SkinnedMesh, type: GarmentType, isFemale: boolean): THREE.SkinnedMesh {
  const geom = bodyMesh.geometry;
  const pos = geom.attributes.position.array;
  const norm = geom.attributes.normal.array;
  const factor = isFemale ? 0.1 : 1.0;

  let minY = 82, maxY = 142, maxX = 38;
  if (type === 'polo') {
    minY = isFemale ? 8.2 / 0.1 : 82;
    maxY = isFemale ? 14.0 / 0.1 : 142;
    maxX = isFemale ? 3.0 / 0.1 : 38;
  } else if (type === 'top_bra') {
    minY = 11.2 / 0.1;
    maxY = 13.85 / 0.1;
    maxX = 18.5;
  } else if (type === 'top_tank') {
    minY = 10.3 / 0.1;
    maxY = 14.0 / 0.1;
    maxX = 18.5;
  } else if (type === 'top') {
    minY = 10.8 / 0.1;
    maxY = 13.9 / 0.1;
    maxX = 20;
  } else if (type === 'short') {
    minY = isFemale ? 5.2 / 0.1 : 50;
    maxY = isFemale ? 9.8 / 0.1 : 93;
    maxX = 26;
  } else if (type === 'legging') {
    minY = isFemale ? 1.2 / 0.1 : 12;
    maxY = isFemale ? 9.8 / 0.1 : 93;
    maxX = 26;
  }

  const effMinY = minY * factor;
  const effMaxY = maxY * factor;
  const effMaxX = maxX * factor;

  const candidateTris: GarmentTriangle[] = [];
  const sIdxArr = geom.attributes.skinIndex?.array;
  const sWtArr = geom.attributes.skinWeight?.array;
  const morphAttrs = geom.morphAttributes?.position;

  for (let i = 0; i < pos.length; i += 9) {
    const y0 = pos[i + 1], y1 = pos[i + 4], y2 = pos[i + 7];
    const minY_t = Math.min(y0, y1, y2);
    const maxY_t = Math.max(y0, y1, y2);
    const x0 = Math.abs(pos[i]), x1 = Math.abs(pos[i + 3]), x2 = Math.abs(pos[i + 6]);
    const maxX_t = Math.max(x0, x1, x2);

    // Broadphase rejection
    if (maxY_t < effMinY - 0.5 * factor || minY_t > effMaxY + 0.5 * factor || maxX_t > effMaxX * 1.6) {
      continue;
    }

    // Despejar deltoides de brazos en sports bra si es femenino
    if (isFemale && type === 'top_bra') {
      const avgY = (y0 + y1 + y2) / 3;
      const avgX = (x0 + x1 + x2) / 3;
      if (avgY > 12.6 && avgX > 1.45) continue;
    }

    function makeVert(vIdx: number): GarmentVertex {
      const s = vIdx;
      let morphs: Float32Array[] | undefined;
      if (morphAttrs && morphAttrs.length > 0) {
        morphs = [];
        for (let m = 0; m < morphAttrs.length; m++) {
          const ma = morphAttrs[m].array;
          morphs.push(new Float32Array([ma[s * 3], ma[s * 3 + 1], ma[s * 3 + 2]]));
        }
      }
      return {
        x: pos[s * 3],
        y: pos[s * 3 + 1],
        z: pos[s * 3 + 2],
        nx: norm[s * 3],
        ny: norm[s * 3 + 1],
        nz: norm[s * 3 + 2],
        sIdx: sIdxArr ? [sIdxArr[s * 4], sIdxArr[s * 4 + 1], sIdxArr[s * 4 + 2], sIdxArr[s * 4 + 3]] : undefined,
        sWt: sWtArr ? [sWtArr[s * 4], sWtArr[s * 4 + 1], sWtArr[s * 4 + 2], sWtArr[s * 4 + 3]] : undefined,
        morphs,
      };
    }

    candidateTris.push([makeVert(i / 3), makeVert(i / 3 + 1), makeVert(i / 3 + 2)]);
  }

  // 1. Corte planar horizontal inferior: Y >= effMinY
  let clippedTris = clipTrianglesPlaneList(candidateTris, 0, 1, 0, -effMinY);

  // 2. Corte planar horizontal superior: Y <= effMaxY
  clippedTris = clipTrianglesPlaneList(clippedTris, 0, -1, 0, effMaxY);

  // 3. Corte planar de mangas y sisas
  if (type === 'polo') {
    clippedTris = clipTrianglesPlaneList(clippedTris, -1, 0, 0, effMaxX);
    clippedTris = clipTrianglesPlaneList(clippedTris, 1, 0, 0, effMaxX);
  } else if (type === 'top_bra' || type === 'top_tank') {
    clippedTris = clipTrianglesPlaneList(clippedTris, -1, 0, 0, effMaxX);
    clippedTris = clipTrianglesPlaneList(clippedTris, 1, 0, 0, effMaxX);
  }

  const triCount = clippedTris.length;
  const count = triCount * 3;

  const gPos = new Float32Array(count * 3);
  const gNorm = new Float32Array(count * 3);
  const gUv = new Float32Array(count * 2);
  const basePositions = new Float32Array(count * 3);
  const baseNormals = new Float32Array(count * 3);

  const defaultOffset = 0.40 * factor;

  const gIdx = sIdxArr ? new Float32Array(count * 4) : null;
  const gWt = sWtArr ? new Float32Array(count * 4) : null;
  const morphCount = (morphAttrs && morphAttrs.length > 0) ? morphAttrs.length : 0;
  const gMorphs: Float32Array[] = [];
  for (let m = 0; m < morphCount; m++) {
    gMorphs.push(new Float32Array(count * 3));
  }

  let vertIdx = 0;
  for (let t = 0; t < triCount; t++) {
    const tri = clippedTris[t];
    for (let k = 0; k < 3; k++) {
      const v = tri[k];

      basePositions[vertIdx * 3]     = v.x;
      basePositions[vertIdx * 3 + 1] = v.y;
      basePositions[vertIdx * 3 + 2] = v.z;
      baseNormals[vertIdx * 3]       = v.nx;
      baseNormals[vertIdx * 3 + 1]   = v.ny;
      baseNormals[vertIdx * 3 + 2]   = v.nz;

      gPos[vertIdx * 3]     = v.x + v.nx * defaultOffset;
      gPos[vertIdx * 3 + 1] = v.y + v.ny * defaultOffset;
      gPos[vertIdx * 3 + 2] = v.z + v.nz * defaultOffset;
      gNorm[vertIdx * 3]     = v.nx;
      gNorm[vertIdx * 3 + 1] = v.ny;
      gNorm[vertIdx * 3 + 2] = v.nz;

      let u = 0.5;
      let vCoord = 0.5;
      if (type === 'polo') {
        const halfW = (isFemale ? 2.4 : 24.0);
        u = (v.x / (halfW * 2.0)) + 0.5;
        vCoord = (v.y - effMinY) / (effMaxY - effMinY);
      } else if (type === 'top_bra' || type === 'top_tank' || type === 'top') {
        const halfW = 2.0;
        u = (v.x / (halfW * 2.0)) + 0.5;
        vCoord = (v.y - effMinY) / (effMaxY - effMinY);
      } else {
        u = (v.x / (effMaxX * 2.2)) + 0.5;
        vCoord = (v.y - effMinY) / (effMaxY - effMinY);
      }
      gUv[vertIdx * 2]     = Math.max(0, Math.min(1, u));
      gUv[vertIdx * 2 + 1] = Math.max(0, Math.min(1, vCoord));

      if (gIdx && gWt && v.sIdx && v.sWt) {
        gIdx[vertIdx * 4]     = v.sIdx[0];
        gIdx[vertIdx * 4 + 1] = v.sIdx[1];
        gIdx[vertIdx * 4 + 2] = v.sIdx[2];
        gIdx[vertIdx * 4 + 3] = v.sIdx[3];
        gWt[vertIdx * 4]     = v.sWt[0];
        gWt[vertIdx * 4 + 1] = v.sWt[1];
        gWt[vertIdx * 4 + 2] = v.sWt[2];
        gWt[vertIdx * 4 + 3] = v.sWt[3];
      }

      if (v.morphs) {
        for (let m = 0; m < morphCount; m++) {
          const ma = v.morphs[m];
          gMorphs[m][vertIdx * 3]     = ma[0];
          gMorphs[m][vertIdx * 3 + 1] = ma[1];
          gMorphs[m][vertIdx * 3 + 2] = ma[2];
        }
      }

      vertIdx++;
    }
  }

  const gGeom = new THREE.BufferGeometry();
  gGeom.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  gGeom.setAttribute('normal', new THREE.BufferAttribute(gNorm, 3));
  gGeom.setAttribute('uv', new THREE.BufferAttribute(gUv, 2));

  if (gIdx && gWt) {
    gGeom.setAttribute('skinIndex', new THREE.BufferAttribute(gIdx, 4));
    gGeom.setAttribute('skinWeight', new THREE.BufferAttribute(gWt, 4));
  }

  if (morphCount > 0) {
    gGeom.morphAttributes.position = [];
    for (let m = 0; m < morphCount; m++) {
      gGeom.morphAttributes.position.push(new THREE.BufferAttribute(gMorphs[m], 3));
    }
  }

  gGeom.userData = {
    basePositions,
    baseNormals,
    factor,
    effMinY,
    effMaxY,
    type,
  };

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#16181d'),
    roughness: 0.65,
    metalness: 0.04,
    bumpMap: getAthleticFabricBumpMap(),
    bumpScale: 0.015,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.SkinnedMesh(gGeom, mat);
  mesh.name = `garment_${type}`; // Identificador vital para proteger la prenda
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);
  mesh.morphTargetDictionary = bodyMesh.morphTargetDictionary;
  mesh.morphTargetInfluences = bodyMesh.morphTargetInfluences;
  return mesh;
}

// Actualización de drape y holgura manteniendo normales 100% suaves sin facetar
function updateGarmentEase(
  mesh: THREE.SkinnedMesh,
  fitStatus: 'demasiado_ajustado' | 'demasiado_holgado' | 'perfecto',
  fitDelta: number = 0,
  isFemale: boolean,
  isCasaca: boolean = false
) {
  if (!mesh || !mesh.geometry) return;
  const geom = mesh.geometry;
  const data = geom.userData;
  if (!data || !data.basePositions || !data.baseNormals) return;

  const basePositions = data.basePositions as Float32Array;
  const baseNormals = data.baseNormals as Float32Array;
  const posArr = geom.attributes.position.array as Float32Array;
  const count = basePositions.length / 3;
  const factor = (data.factor as number) || (isFemale ? 0.1 : 1.0);
  const effMinY = (data.effMinY as number) || (isFemale ? 5.0 : 50);
  const effMaxY = (data.effMaxY as number) || (isFemale ? 9.3 : 93);
  const type = (data.type as GarmentType) || 'polo';

  // Holgura de confección textil real (CERO efecto bodypaint / pintura sobre piel)
  let easeCm = 0.68; // Polo estándar tiene holgura y separación de tela natural
  if (type === 'top_bra') {
    easeCm = 0.32; // Sports bra de compresión
  } else if (type === 'top_tank') {
    easeCm = 0.55; // Tank top holgado
  } else if (type === 'short') {
    easeCm = 0.45;
  } else if (type === 'legging') {
    easeCm = 0.35; // Compresión
  }

  // Casaca windbreaker tiene mayor volumen textil
  if (isCasaca && type === 'polo') {
    easeCm = 1.15;
  }

  let isHolgado = false;
  let isAjustado = false;

  if (fitStatus === 'demasiado_holgado') {
    isHolgado = true;
    const deltaEffect = Math.min(fitDelta, 35) * 0.042;
    easeCm = Math.min(2.1, easeCm + 0.60 + deltaEffect);
  } else if (fitStatus === 'demasiado_ajustado') {
    isAjustado = true;
    const deltaEffect = Math.min(fitDelta, 20) * 0.008;
    easeCm = Math.max(0.10, easeCm * 0.45 - deltaEffect);
  }

  const effOffset = easeCm * factor;

  for (let j = 0; j < count; j++) {
    const bx = basePositions[j * 3];
    const by = basePositions[j * 3 + 1];
    const bz = basePositions[j * 3 + 2];
    const nx = baseNormals[j * 3];
    const ny = baseNormals[j * 3 + 1];
    const nz = baseNormals[j * 3 + 2];

    const yProgress = Math.max(0, Math.min(1, (effMaxY - by) / (effMaxY - effMinY)));

    let flare = 0;
    let ripple = 0;
    let dropY = 0;
    let forwardBridge = 0;

    if (type === 'short') {
      // SILUETA AUTÉNTICA DE RUNNING SHORT (Nike Challenger / Adidas Tiro):
      // Pretina elástica ceñida en la cadera/cintura (yProgress ≈ 0)
      // Apertura cónica/campana holgada hacia la basta (yProgress -> 1)
      const flareCurve = Math.pow(yProgress, 1.35);
      const flareMultiplier = isHolgado 
        ? Math.min(3.4, 2.0 + Math.min(fitDelta, 30) * 0.05) 
        : (isAjustado ? Math.max(0.35, 0.7 - Math.min(fitDelta, 15) * 0.02) : 1.5);
      flare = flareCurve * flareMultiplier * factor;

      if (isHolgado) {
        // Ondulaciones naturales de tela suelta de running
        const wave = Math.sin(by * (isFemale ? 140 : 14) + bx * (isFemale ? 70 : 7));
        const waveAmp = (0.16 + Math.min(fitDelta, 30) * 0.008) * factor;
        ripple = wave * waveAmp * Math.sin(yProgress * Math.PI);
        dropY = Math.pow(yProgress, 1.8) * ((0.12 + Math.min(fitDelta, 30) * 0.005) * factor);
      }
    } else if (type === 'polo') {
      // =====================================================================
      // FÍSICA TEXTIL REAL PARA POLOS Y CASACAS (CERO EFECTO BODYPAINT)
      // =====================================================================
      // 1. Puente de caída frontal (Chest-to-Waist Hanging Bridge):
      // La tela cae verticalmente desde los pectorales hasta la cintura sin colapsar en el abdomen
      if (bz > 0 && yProgress > 0.35 && yProgress < 0.92) {
        const bridgeProgress = Math.sin((yProgress - 0.35) / 0.57 * Math.PI);
        forwardBridge = bridgeProgress * (isCasaca ? 0.70 : 0.42) * factor;
      }

      // 2. Flare natural de bastas inferiores
      if (yProgress > 0.65) {
        const hemProgress = Math.pow((yProgress - 0.65) / 0.35, 1.4);
        flare = hemProgress * (isCasaca ? 0.85 : 0.48) * factor;
      }

      // 3. Micro-arrugas y ondas naturales de tela
      const fabricWave = Math.sin(by * (isFemale ? 45 : 4.5) + bx * (isFemale ? 25 : 2.5)) * 
                         Math.cos(bz * (isFemale ? 35 : 3.5));
      ripple = fabricWave * (isCasaca ? 0.16 : 0.08) * factor * Math.sin(yProgress * Math.PI);

      if (isHolgado) {
        const wave = Math.sin(by * (isFemale ? 120 : 12) + bz * (isFemale ? 60 : 6));
        const waveAmp = (0.20 + Math.min(fitDelta, 30) * 0.008) * factor;
        ripple += wave * waveAmp * Math.sin(yProgress * Math.PI);
        flare += Math.pow(yProgress, 1.2) * (1.0 + Math.min(fitDelta, 30) * 0.04) * factor;
        dropY = Math.pow(yProgress, 1.5) * ((0.16 + Math.min(fitDelta, 30) * 0.006) * factor);
      } else if (isAjustado) {
        forwardBridge *= 0.3;
        flare = -0.04 * factor;
      }
    } else if (type === 'top_tank') {
      if (bz > 0 && yProgress > 0.45) {
        const bridgeProgress = Math.sin((yProgress - 0.45) / 0.55 * Math.PI);
        forwardBridge = bridgeProgress * 0.28 * factor;
      }
      if (yProgress > 0.70) {
        flare = Math.pow((yProgress - 0.70) / 0.30, 1.3) * 0.32 * factor;
      }
      if (isHolgado) {
        ripple = Math.sin(by * 60) * 0.12 * factor * Math.sin(yProgress * Math.PI);
        flare += 0.45 * factor;
      }
    } else if (type === 'top_bra') {
      if (isAjustado) {
        easeCm = Math.max(0.08, easeCm * 0.6);
      } else if (isHolgado) {
        flare = 0.22 * factor;
      }
    } else if (type === 'legging') {
      if (isHolgado) {
        const wave = Math.sin(by * (isFemale ? 90 : 9));
        ripple = wave * (0.15 * factor) * Math.sin(yProgress * Math.PI);
        flare = (0.55 + Math.min(fitDelta, 30) * 0.02) * factor;
      }
    }

    posArr[j * 3]     = bx + nx * (effOffset + flare + ripple);
    posArr[j * 3 + 1] = by + ny * effOffset - dropY;
    posArr[j * 3 + 2] = bz + nz * (effOffset + flare + ripple) + forwardBridge;
  }

  geom.attributes.position.needsUpdate = true;
  // NOTA: No llamamos a computeVertexNormals() para preservar la superficie lisa MakeHuman
}

function useGarments(
  clonedScene: THREE.Object3D,
  bodyMesh: THREE.SkinnedMesh | null,
  isFemale: boolean,
  selectedProduct?: any,
  fitStatus: 'demasiado_ajustado' | 'demasiado_holgado' | 'perfecto' = 'perfecto',
  fitDelta: number = 0,
  customColor?: string
) {
  const garmentsRef = useRef<{
    polo?: THREE.SkinnedMesh;
    topBra?: THREE.SkinnedMesh;
    topTank?: THREE.SkinnedMesh;
    short?: THREE.SkinnedMesh;
    legging?: THREE.SkinnedMesh;
  }>({});

  const [garmentColor, setGarmentColor] = useState<string>(() => customColor || getFallbackGarmentColor(selectedProduct));

  useEffect(() => {
    if (!bodyMesh || !bodyMesh.geometry) return;

    const polo = buildGarment(bodyMesh, 'polo', isFemale);
    const topBra = buildGarment(bodyMesh, 'top_bra', isFemale);
    const topTank = buildGarment(bodyMesh, 'top_tank', isFemale);
    const short = buildGarment(bodyMesh, 'short', isFemale);
    const legging = buildGarment(bodyMesh, 'legging', isFemale);

    polo.visible = false;
    topBra.visible = false;
    topTank.visible = false;
    short.visible = false;
    legging.visible = false;

    const garmentParent = bodyMesh.parent || clonedScene;
    garmentParent.add(polo);
    garmentParent.add(topBra);
    garmentParent.add(topTank);
    garmentParent.add(short);
    garmentParent.add(legging);

    garmentsRef.current = { polo, topBra, topTank, short, legging };

    return () => {
      garmentParent.remove(polo);
      garmentParent.remove(topBra);
      garmentParent.remove(topTank);
      garmentParent.remove(short);
      garmentParent.remove(legging);
      polo.geometry.dispose();
      topBra.geometry.dispose();
      topTank.geometry.dispose();
      short.geometry.dispose();
      legging.geometry.dispose();
    };
  }, [bodyMesh, clonedScene, isFemale]);

  // Extraer el color real del catálogo desde la imagen proxied o usar color personalizado
  useEffect(() => {
    if (customColor) {
      setGarmentColor(customColor);
      return;
    }
    const fallback = getFallbackGarmentColor(selectedProduct);
    const imgUrl = selectedProduct?.imagen_url || selectedProduct?.imagenUrl || selectedProduct?.img;
    extractDominantColor(imgUrl, fallback, (extractedHex) => {
      setGarmentColor(extractedHex);
    });
  }, [selectedProduct, customColor]);

  useEffect(() => {
    const { polo, topBra, topTank, short, legging } = garmentsRef.current;
    if (!polo || !topBra || !topTank || !short || !legging) return;

    if (!selectedProduct) {
      polo.visible = false;
      topBra.visible = false;
      topTank.visible = false;
      short.visible = false;
      legging.visible = false;
      return;
    }

    const cat = (selectedProduct.categoria || '').toLowerCase();
    const nameLower = (selectedProduct.nombre || '').toLowerCase();

    const isCasaca = cat.includes('casaca') || cat.includes('polera') || nameLower.includes('vector');
    const isPolo = cat.includes('polo') || isCasaca;
    const isBra = nameLower.includes('alate') || nameLower.includes('minimalist') || nameLower.includes('bra');
    const isTank = nameLower.includes('yoga') || nameLower.includes('tank');
    const isTop = cat.includes('top') || isBra || isTank;
    const isShort = cat.includes('short');
    const isLegging = cat.includes('legging') || cat.includes('buzo') || cat.includes('pantalón') || cat.includes('pantalon');

    let activeMesh: THREE.SkinnedMesh | null = null;
    let activeGarmentType: GarmentType = 'polo';
    let secondaryMesh: THREE.SkinnedMesh | null = null;
    let secondaryType: GarmentType | null = null;

    if (isFemale) {
      if (isBra) {
        topBra.visible = true;
        topTank.visible = false;
        polo.visible = false;
        short.visible = false;
        legging.visible = true;
        activeMesh = topBra;
        activeGarmentType = 'top_bra';
        secondaryMesh = legging;
        secondaryType = 'legging';
      } else if (isTank) {
        topTank.visible = true;
        topBra.visible = false;
        polo.visible = false;
        short.visible = false;
        legging.visible = true;
        activeMesh = topTank;
        activeGarmentType = 'top_tank';
        secondaryMesh = legging;
        secondaryType = 'legging';
      } else if (isTop) {
        topBra.visible = true;
        topTank.visible = false;
        polo.visible = false;
        short.visible = false;
        legging.visible = true;
        activeMesh = topBra;
        activeGarmentType = 'top_bra';
        secondaryMesh = legging;
        secondaryType = 'legging';
      } else if (isShort) {
        short.visible = true;
        legging.visible = false;
        polo.visible = false;
        topBra.visible = true;
        topTank.visible = false;
        activeMesh = short;
        activeGarmentType = 'short';
        secondaryMesh = topBra;
        secondaryType = 'top_bra';
      } else if (isLegging) {
        legging.visible = true;
        short.visible = false;
        polo.visible = false;
        topBra.visible = true;
        topTank.visible = false;
        activeMesh = legging;
        activeGarmentType = 'legging';
        secondaryMesh = topBra;
        secondaryType = 'top_bra';
      } else if (isPolo) {
        polo.visible = true;
        topBra.visible = false;
        topTank.visible = false;
        short.visible = false;
        legging.visible = true;
        activeMesh = polo;
        activeGarmentType = 'polo';
        secondaryMesh = legging;
        secondaryType = 'legging';
      }
    } else {
      // Hombre
      if (isCasaca) {
        polo.visible = true;
        topBra.visible = false;
        topTank.visible = false;
        short.visible = false;
        legging.visible = true; // Casaca + track pant a juego
        activeMesh = polo;
        activeGarmentType = 'polo';
        secondaryMesh = legging;
        secondaryType = 'legging';
      } else if (isPolo) {
        polo.visible = true;
        topBra.visible = false;
        topTank.visible = false;
        short.visible = true;
        legging.visible = false;
        activeMesh = polo;
        activeGarmentType = 'polo';
        secondaryMesh = short;
        secondaryType = 'short';
      } else if (isShort) {
        short.visible = true;
        polo.visible = false;
        topBra.visible = false;
        topTank.visible = false;
        legging.visible = false;
        activeMesh = short;
        activeGarmentType = 'short';
        secondaryMesh = null;
      } else if (isLegging) {
        legging.visible = true;
        short.visible = false;
        polo.visible = false;
        topBra.visible = false;
        topTank.visible = false;
        activeMesh = legging;
        activeGarmentType = 'legging';
        secondaryMesh = null;
      }
    }

    if (activeMesh) {
      updateGarmentEase(activeMesh, fitStatus, fitDelta, isFemale, isCasaca);

      const activeMat = activeMesh.material as THREE.MeshStandardMaterial;
      const prodName = selectedProduct.nombre || '';
      const brandName = selectedProduct.marca || '';

      const brandTex = createBrandLogoTexture(prodName, brandName, activeGarmentType, garmentColor);
      activeMat.map = brandTex;
      activeMat.color = new THREE.Color('#ffffff');
      activeMat.bumpMap = getAthleticFabricBumpMap();
      activeMat.bumpScale = 0.02;
      activeMat.roughness = 0.65;
      activeMat.metalness = 0.04;
      if (fitStatus === 'demasiado_ajustado') {
        activeMat.emissive = new THREE.Color('#380808');
      } else {
        activeMat.emissive = new THREE.Color('#000000');
      }
      activeMat.needsUpdate = true;
    }

    if (secondaryMesh && secondaryMesh.visible) {
      updateGarmentEase(secondaryMesh, 'perfecto', 0, isFemale, false);

      const secMat = secondaryMesh.material as THREE.MeshStandardMaterial;
      if (isFemale && secondaryType === 'legging') {
        secMat.map = createBrandLogoTexture('Nike Pro 365', 'Nike', 'legging', '#111215');
        secMat.color = new THREE.Color('#ffffff');
      } else if (isFemale && secondaryType === 'top_bra') {
        secMat.map = createBrandLogoTexture('Studio Sports Bra', 'Studio', 'top_bra', '#181a20');
        secMat.color = new THREE.Color('#ffffff');
      } else {
        secMat.map = null;
        secMat.color = new THREE.Color('#141518');
      }
      secMat.bumpMap = getAthleticFabricBumpMap();
      secMat.bumpScale = 0.015;
      secMat.roughness = 0.70;
      secMat.metalness = 0.04;
      secMat.emissive = new THREE.Color('#000000');
      secMat.needsUpdate = true;
    }
  }, [selectedProduct, isFemale, fitStatus, fitDelta, garmentColor]);

  return garmentsRef;
}

// =========================================================================
// MODELO HOMBRE (MakeHuman Morph Targets Reales + Esqueleto Riggeado)
// Acabado Negro Mate Nike Studio completo, proporcional y armónico
// =========================================================================
function HombreModel({
  scales,
  selectedProduct,
  fitStatus = 'perfecto',
  fitDelta = 0,
  customColor,
}: {
  scales: BodyScales;
  selectedProduct?: any;
  fitStatus?: 'demasiado_ajustado' | 'demasiado_holgado' | 'perfecto';
  fitDelta?: number;
  customColor?: string;
}) {
  const { scene } = useGLTF('/avatar/hombre_morph.glb?v=5');
  const groupRef = useRef<THREE.Group>(null);

  // Clonación mediante SkeletonUtils para preservar al 100% los huesos y morph targets
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Mapeo indexado de los huesos
  const bonesMap = useMemo(() => {
    const map: Record<string, THREE.Bone> = {};
    clonedScene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        map[child.name] = child as THREE.Bone;
      }
    });
    return map;
  }, [clonedScene]);

  // Referencia directa a la malla del cuerpo masculino
  const bodyMesh = useMemo<THREE.SkinnedMesh | null>(() => {
    let targetMesh: THREE.SkinnedMesh | null = null;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !child.name.toLowerCase().includes('high-poly')) {
        targetMesh = child as THREE.SkinnedMesh;
      }
    });
    return targetMesh;
  }, [clonedScene]);

  // Indumentaria deportiva 3D sincronizada con drape y holgura dinámica
  const garmentsRef = useGarments(clonedScene, bodyMesh, false, selectedProduct, fitStatus, fitDelta, customColor);

  // Configuración de materiales y postura atlética en A-Pose sin torsión
  useEffect(() => {
    if (bonesMap['upperarm_l']) bonesMap['upperarm_l'].rotation.set(0, 0, -1.05);
    if (bonesMap['upperarm_r']) bonesMap['upperarm_r'].rotation.set(0, 0, 1.05);

    const matteStudioMat = createNikeMatteBlackMaterial();

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.startsWith('garment_')) return; // Prenda deportiva: mantener su propio material y color
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = matteStudioMat;
      }
    });

    clonedScene.updateMatrixWorld(true);
    clonedScene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).skeleton.update();
      }
    });
  }, [clonedScene, bonesMap]);

  // Actualización reactiva proporcional armónica según los sliders
  useEffect(() => {
    const sPecho = scales.scalePecho ?? 1.0;
    const sCintura = scales.scaleCintura ?? 1.0;
    const sCadera = scales.scaleCadera ?? 1.0;
    const sMuslo = scales.scaleMuslo ?? 1.0;
    const sHombros = scales.scaleHombros ?? 1.0;
    const sBrazo = scales.scaleBrazo ?? 1.0;
    const sAltura = scales.scaleAltura ?? 1.0;

    // 1. Índice de Complexión Global Integrado
    const sizeIndex = (sPecho * 0.30 + sCintura * 0.30 + sCadera * 0.20 + sMuslo * 0.20);

    // Separación de brazos en A-pose para acompañar complexión sin atravesar torso
    const armSpread = sizeIndex > 1.0 ? (sizeIndex - 1.0) * 0.15 : 0.0;
    if (bonesMap['upperarm_l']) bonesMap['upperarm_l'].rotation.set(0, 0, -1.05 - armSpread);
    if (bonesMap['upperarm_r']) bonesMap['upperarm_r'].rotation.set(0, 0, 1.05 + armSpread);

    // 3. Morph Targets de Hombre (Siluetas MakeHuman Reales 100% Proporcionales)
    if (bodyMesh && bodyMesh.morphTargetDictionary && bodyMesh.morphTargetInfluences) {
      const dict = bodyMesh.morphTargetDictionary;
      const inf = bodyMesh.morphTargetInfluences;

      const idxDelgada = dict['Delgada'];
      const idxGrande = dict['Grande'];
      const idxCintura = dict['Cintura_Abdomen'];
      const idxPiernas = dict['Piernas_Muslos'];
      const idxCadera = dict['Cadera_Gluteos'];
      const idxPecho = dict['Pecho_Pectoral'];
      const idxBrazo = dict['Brazo_Extra'];

      // Silueta global base armónica continua (XS -> S -> M -> L -> XL -> XXL)
      if (sizeIndex < 1.0) {
        if (idxDelgada !== undefined) inf[idxDelgada] = Math.min(Math.max((1.0 - sizeIndex) * 2.8, 0), 1.0);
        if (idxGrande !== undefined) inf[idxGrande] = 0.0;
      } else {
        if (idxDelgada !== undefined) inf[idxDelgada] = 0.0;
        // Escalamiento continuo hasta 1.0 en talla XXL (Extreme Obesity completo y armónico)
        if (idxGrande !== undefined) inf[idxGrande] = Math.min(Math.max((sizeIndex - 1.0) * 3.3, 0), 1.0);
      }

      // Morphs anatómicos complementarios por zona
      const extraCintura = Math.max(0, sCintura - sizeIndex);
      const extraPiernas = Math.max(0, sMuslo - sizeIndex);
      const extraCadera = Math.max(0, sCadera - sizeIndex);
      const extraPecho = Math.max(0, sPecho - sizeIndex);
      const extraBrazo = Math.max(0, sBrazo - sizeIndex);

      if (idxCintura !== undefined) {
        inf[idxCintura] = Math.min(Math.max(extraCintura * 3.2, 0), 1.0);
      }
      if (idxPiernas !== undefined) {
        inf[idxPiernas] = Math.min(Math.max(extraPiernas * 3.2, 0), 1.0);
      }
      if (idxCadera !== undefined) {
        inf[idxCadera] = Math.min(Math.max(extraCadera * 3.0, 0), 1.0);
      }
      if (idxPecho !== undefined) {
        inf[idxPecho] = Math.min(Math.max(extraPecho * 2.5, 0), 1.0);
      }
      if (idxBrazo !== undefined) {
        inf[idxBrazo] = Math.min(Math.max(extraBrazo * 2.5, 0), 1.0);
      }
// Sincronización instantánea de morphs anatómicos con las prendas 3D
      const gObj = garmentsRef.current;
      if (gObj) {
        [gObj.polo, gObj.topBra, gObj.topTank, gObj.short, gObj.legging].forEach((gm) => {
          if (gm && gm.morphTargetInfluences && inf) {
            for (let k = 0; k < inf.length; k++) {
              gm.morphTargetInfluences[k] = inf[k];
            }
          }
        });
      }
    }

    // Estatura vertical y centrado
    if (groupRef.current) {
      groupRef.current.scale.set(1.0, sAltura, 1.0);
      groupRef.current.position.y = -0.85 * sAltura;
    }

    clonedScene.updateMatrixWorld(true);
    clonedScene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).skeleton.update();
      }
    });
  }, [scales, bodyMesh, clonedScene, bonesMap]);

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

// =========================================================================
// MODELO MUJER (MakeHuman Morph Targets Reales + Esqueleto Riggeado)
// Interpolación anatómica pura y aislada por zonas corporales
// =========================================================================
function MujerModel({
  scales,
  selectedProduct,
  fitStatus = 'perfecto',
  fitDelta = 0,
  customColor,
}: {
  scales: BodyScales;
  selectedProduct?: any;
  fitStatus?: 'demasiado_ajustado' | 'demasiado_holgado' | 'perfecto';
  fitDelta?: number;
  customColor?: string;
}) {
  const { scene } = useGLTF('/avatar/mujer_morph.glb?v=13');
  const groupRef = useRef<THREE.Group>(null);

  // Clonación mediante SkeletonUtils para preservar al 100% los huesos y morph targets
  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Mapeo indexado de los huesos
  const bonesMap = useMemo(() => {
    const map: Record<string, THREE.Bone> = {};
    clonedScene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        map[child.name] = child as THREE.Bone;
      }
    });
    return map;
  }, [clonedScene]);

  // Referencia directa a la malla del cuerpo
  const bodyMesh = useMemo<THREE.SkinnedMesh | null>(() => {
    let targetMesh: THREE.SkinnedMesh | null = null;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name.toLowerCase().includes('generic')) {
        targetMesh = child as THREE.SkinnedMesh;
      }
    });
    return targetMesh;
  }, [clonedScene]);

  // Indumentaria deportiva 3D de mujer sincronizada con drape y holgura dinámica
  const garmentsRef = useGarments(clonedScene, bodyMesh, true, selectedProduct, fitStatus, fitDelta, customColor);

  // Configuración de materiales y postura atlética inicial (A-pose)
  useEffect(() => {
    // 1. Postura atlética natural y relajada en A-Pose (brazos a los costados sin torsión)
    if (bonesMap['upperarm_l']) bonesMap['upperarm_l'].rotation.set(0, 0, -1.15);
    if (bonesMap['upperarm_r']) bonesMap['upperarm_r'].rotation.set(0, 0, 1.15);

    // 2. Material Nike Studio Matte unificado
    const matteStudioMat = createNikeMatteBlackMaterial();

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.startsWith('garment_')) return; // Prenda deportiva: mantener su propio material y visibilidad
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.name.toLowerCase().includes('generic')) {
          mesh.material = matteStudioMat;
        } else {
          // Ocultar cualquier elemento accesorio no integrado
          mesh.visible = false;
        }
      }
    });

    clonedScene.updateMatrixWorld(true);
    clonedScene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).skeleton.update();
      }
    });
  }, [clonedScene, bonesMap]);

  // Actualización reactiva proporcional armónica continua según las tallas
  useEffect(() => {
    const sPecho = scales.scalePecho ?? 1.0;
    const sCintura = scales.scaleCintura ?? 1.0;
    const sCadera = scales.scaleCadera ?? 1.0;
    const sMuslo = scales.scaleMuslo ?? 1.0;
    const sHombros = scales.scaleHombros ?? 1.0;
    const sBrazo = scales.scaleBrazo ?? 1.0;
    const sAltura = scales.scaleAltura ?? 1.0;

    // 1. Índice de Complexión Global Integrado (talla anatómica general armoniosa)
    const sizeIndex = (sCintura * 0.35 + sCadera * 0.35 + sPecho * 0.15 + sMuslo * 0.15);

    // 3. Apertura suave de brazos en A-pose para acompañar el volumen de cadera
    const armSpread = sizeIndex > 1.0 ? (sizeIndex - 1.0) * 0.14 : 0.0;
    if (bonesMap['upperarm_l']) bonesMap['upperarm_l'].rotation.set(0, 0, -1.15 - armSpread);
    if (bonesMap['upperarm_r']) bonesMap['upperarm_r'].rotation.set(0, 0, 1.15 + armSpread);

    // 4. Morphs Continuos y Unificados (100% orgánico, proporcional tanto delgada como gordita)
    if (bodyMesh && bodyMesh.morphTargetDictionary && bodyMesh.morphTargetInfluences) {
      const dict = bodyMesh.morphTargetDictionary;
      const inf = bodyMesh.morphTargetInfluences;

      const idxDelgada = dict['Delgada'];
      const idxGordita = dict['Gordita'];
      const idxBusto = dict['Busto_Frontal'];
      const idxBrazo = dict['Brazo_Extra'];

      if (sizeIndex < 1.0) {
        // Tallas XS / S: silueta atlética esbelta, bonita y definida (brazos y piernas proporcionados)
        const factorDelgada = Math.min(Math.max((1.0 - sizeIndex) * 2.8, 0), 1.0);
        if (idxDelgada !== undefined) inf[idxDelgada] = factorDelgada;
        if (idxGordita !== undefined) inf[idxGordita] = 0.0;
      } else {
        // Tallas L / XL / XXL: Curvy Athletic Plus orgánica, continua, con curvas perfectas
        const factorGordita = Math.min(Math.max((sizeIndex - 1.0) * 2.2, 0), 0.95);
        if (idxDelgada !== undefined) inf[idxDelgada] = 0.0;
        if (idxGordita !== undefined) inf[idxGordita] = factorGordita;
      }

      // BUSTO FRONTAL ANATÓMICO (Cero espalda, redondeado tipo gota natural)
      if (idxBusto !== undefined) {
        if (sPecho > sizeIndex) {
          inf[idxBusto] = Math.min(Math.max((sPecho - sizeIndex) * 1.8, 0), 1.0);
        } else {
          inf[idxBusto] = 0.0;
        }
      }

      // Ajuste de brazos anatómicos MakeHuman
      if (idxBrazo !== undefined) {
        inf[idxBrazo] = sBrazo > 1.0 ? Math.min(Math.max((sBrazo - 1.0) * 1.8, 0), 1.0) : 0.0;
      }
// Sincronización instantánea de morphs con las prendas 3D de mujer
      const gObj = garmentsRef.current;
      if (gObj) {
        [gObj.polo, gObj.topBra, gObj.topTank, gObj.short, gObj.legging].forEach((gm) => {
          if (gm && gm.morphTargetInfluences && inf) {
            for (let k = 0; k < inf.length; k++) {
              gm.morphTargetInfluences[k] = inf[k];
            }
          }
        });
      }
    }

    // Estatura vertical y centrado
    if (groupRef.current) {
      groupRef.current.scale.set(1.0, sAltura, 1.0);
      groupRef.current.position.y = -0.82 * sAltura;
    }

    clonedScene.updateMatrixWorld(true);
    clonedScene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).skeleton.update();
      }
    });
  }, [scales, bodyMesh, clonedScene, bonesMap]);

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

// =========================================================================
// CONTROLADOR DE CÁMARA (Reset, Zoom, Rotación 360)
// =========================================================================
function CameraController({
  action,
}: {
  action?: { type: 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right'; id: number } | null;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!action) return;
    if (action.type === 'reset') {
      camera.position.set(0, 0, 3.8);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current?.reset) {
        controlsRef.current.reset();
      }
    } else if (action.type === 'zoom-in') {
      camera.position.multiplyScalar(0.85);
    } else if (action.type === 'zoom-out') {
      camera.position.multiplyScalar(1.15);
    } else if (action.type === 'rotate-left') {
      const angle = 0.35;
      const x = camera.position.x * Math.cos(angle) - camera.position.z * Math.sin(angle);
      const z = camera.position.x * Math.sin(angle) + camera.position.z * Math.cos(angle);
      camera.position.x = x;
      camera.position.z = z;
      camera.lookAt(0, 0, 0);
    } else if (action.type === 'rotate-right') {
      const angle = -0.35;
      const x = camera.position.x * Math.cos(angle) - camera.position.z * Math.sin(angle);
      const z = camera.position.x * Math.sin(angle) + camera.position.z * Math.cos(angle);
      camera.position.x = x;
      camera.position.z = z;
      camera.lookAt(0, 0, 0);
    }
  }, [action, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={1.8}
      maxDistance={6.0}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.7}
      target={[0, 0, 0]}
    />
  );
}

// =========================================================================
// COMPONENTE PRINCIPAL AVATAR 3D
// =========================================================================
interface Avatar3DProps {
  scales?: BodyScales;
  torsoScaleX?: number;
  torsoScaleY?: number;
  genero: 'Hombre' | 'Mujer';
  selectedProduct?: any;
  fitStatus?: 'demasiado_ajustado' | 'demasiado_holgado' | 'perfecto';
  fitDelta?: number;
  customColor?: string;
  cameraAction?: { type: 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right'; id: number } | null;
}

export default function Avatar3D({
  scales,
  torsoScaleX = 1,
  torsoScaleY = 1,
  genero,
  selectedProduct,
  fitStatus = 'perfecto',
  fitDelta = 0,
  customColor,
  cameraAction,
}: Avatar3DProps) {
  const settings = useStoreSettings();

  const activeScales: BodyScales = scales || {
    scalePecho: torsoScaleX,
    scaleCintura: torsoScaleX,
    scaleCadera: torsoScaleX,
    scaleMuslo: torsoScaleX,
    scaleHombros: torsoScaleX,
    scaleBrazo: torsoScaleX,
    scaleAltura: torsoScaleY,
  };

  return (
    <div className="w-full h-full min-h-[500px] relative cursor-grab active:cursor-grabbing z-20">
      <Canvas shadows={settings.hqRender} dpr={settings.hqRender ? [1, 2] : 1} camera={{ position: [0, 0, 3.8], fov: 42 }}>
        {/* Iluminación de estudio profesional neutro estilo Nike (blanco suave y natural) */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[2.5, 4, 3.5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-3, 2, 2.5]} intensity={0.9} color="#e2e8f0" />
        <directionalLight position={[0, 3, -3.5]} intensity={1.1} color="#f8fafc" />
        <pointLight position={[0, -1, 1.5]} intensity={0.35} color="#ffffff" />

        <Environment preset="studio" />
        <ContactShadows position={[0, -0.85, 0]} opacity={0.5} scale={6} blur={2.0} far={4} />

        {genero === 'Hombre' ? (
          <HombreModel
            scales={activeScales}
            selectedProduct={selectedProduct}
            fitStatus={fitStatus}
            fitDelta={fitDelta}
            customColor={customColor}
          />
        ) : (
          <MujerModel
            scales={activeScales}
            selectedProduct={selectedProduct}
            fitStatus={fitStatus}
            fitDelta={fitDelta}
            customColor={customColor}
          />
        )}

        <CameraController action={cameraAction} />
      </Canvas>
    </div>
  );
}
