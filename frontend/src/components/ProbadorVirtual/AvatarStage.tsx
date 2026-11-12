import { useState } from 'react';
import Avatar3D, { type BodyScales } from './Avatar3D';
import { useAuth } from '../../context/AuthContext';
import type { BodyType } from '../../utils/bodyType';

interface AvatarStageProps {
  selectedProduct: any;
  genero: 'Hombre' | 'Mujer';
  activeSize: string;
  customColor?: string | null;
}

const BASE_BODY_SCALES: BodyScales = {
  scalePecho: 1,
  scaleCintura: 1,
  scaleCadera: 1,
  scaleMuslo: 1,
  scaleHombros: 1,
  scaleBrazo: 1,
  scaleAltura: 1,
};

// Body shape is independent of the selected garment size.
const BODY_TYPE_SCALES: Record<BodyType, BodyScales> = {
  slim: {
    scalePecho: 0.88,
    scaleCintura: 0.88,
    scaleCadera: 0.92,
    scaleMuslo: 0.90,
    scaleHombros: 0.94,
    scaleBrazo: 0.90,
    scaleAltura: 1,
  },
  average: BASE_BODY_SCALES,
  broad: {
    scalePecho: 1.12,
    scaleCintura: 1.12,
    scaleCadera: 1.08,
    scaleMuslo: 1.10,
    scaleHombros: 1.10,
    scaleBrazo: 1.10,
    scaleAltura: 1,
  },
};

const BODY_TYPE_LABELS: Record<BodyType, string> = {
  slim: 'Delgado / Atlético',
  average: 'Medio / Proporcionado',
  broad: 'Robusto / Amplio',
};

type CameraAction = 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right';

const CAMERA_CONTROLS: { action: CameraAction; label: string; icon: string }[] = [
  { action: 'reset', label: 'Reiniciar cámara', icon: 'fa-expand' },
  { action: 'zoom-in', label: 'Acercar cámara', icon: 'fa-magnifying-glass-plus' },
  { action: 'zoom-out', label: 'Alejar cámara', icon: 'fa-magnifying-glass-minus' },
  { action: 'rotate-left', label: 'Girar a la izquierda', icon: 'fa-arrow-rotate-left' },
  { action: 'rotate-right', label: 'Girar a la derecha', icon: 'fa-arrow-rotate-right' },
];

export default function AvatarStage({
  selectedProduct,
  genero,
  activeSize,
  customColor,
}: AvatarStageProps) {
  const { user } = useAuth();
  const [cameraAction, setCameraAction] = useState<{ type: CameraAction; id: number } | null>(null);
  const normalizedSize = activeSize.trim().toUpperCase();
  const size = normalizedSize === 'S' || normalizedSize === 'L' ? normalizedSize : 'M';
  const currentBodyType: BodyType = user?.bodyType || 'average';
  const scales = BODY_TYPE_SCALES[currentBodyType] || BASE_BODY_SCALES;
  const bodyTypeLabel = BODY_TYPE_LABELS[currentBodyType] || BODY_TYPE_LABELS.average;

  return (
    <section
      aria-label="Vista previa del avatar"
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[2rem] border border-gray-200/70 bg-gradient-to-b from-white/60 to-brand-green/5 dark:border-white/10 dark:from-white/[0.02]"
    >
      {/* Indicador de tipo de cuerpo actualizado de la cuenta */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/85 px-3 py-1.5 text-xs shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/75">
        <span className="font-medium text-gray-500 dark:text-gray-400">Tipo de cuerpo:</span>
        <span className="font-semibold text-brand-green">{bodyTypeLabel}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-80 w-56 rounded-full bg-brand-green/10 blur-3xl" />
      </div>
      <div className="relative min-h-0 w-full flex-1">
        <Avatar3D
          scales={scales}
          genero={genero}
          selectedProduct={selectedProduct}
          activeSize={size}
          customColor={customColor || undefined}
          cameraAction={cameraAction}
        />
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-center gap-3 border-t border-gray-200/60 bg-white/75 px-4 py-4 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/65">
        <div role="group" aria-label="Controles de cámara" className="flex max-w-full flex-wrap justify-center gap-2">
          {CAMERA_CONTROLS.map(({ action, label, icon }) => (
            <button
              key={action}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => setCameraAction((current) => ({ type: action, id: (current?.id || 0) + 1 }))}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-600 transition-colors hover:border-brand-green hover:bg-brand-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            >
              <i aria-hidden="true" className={`fa-solid ${icon}`} />
            </button>
          ))}
        </div>
        <p className="max-w-full text-center text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          Arrastra para girar. Usa los controles para acercar o alejar la vista.
        </p>
      </div>
    </section>
  );
}