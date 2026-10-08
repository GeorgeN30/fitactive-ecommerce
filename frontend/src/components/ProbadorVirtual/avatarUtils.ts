export interface AvatarMeasures {
  pecho: number;
  cintura: number;
  cadera: number;
}

export function calculateAvatarScales(
  medidas: AvatarMeasures,
  genero: "Hombre" | "Mujer"
) {
  const isFemale = genero === "Mujer";

  const scalePecho =
    medidas.pecho / (isFemale ? 90 : 100);

  const scaleCintura =
    medidas.cintura / (isFemale ? 70 : 85);

  const scaleCadera =
    medidas.cadera / 95;

  const clamp = (
    value: number,
    min: number,
    max: number
  ) => Math.min(Math.max(value, min), max);

  const baseTorsoScale = clamp(
    scalePecho * 0.4 +
      scaleCintura * 0.4 +
      scaleCadera * 0.2,
    0.85,
    1.25
  );

  const torsoScaleX = baseTorsoScale;

  const torsoScaleY =
    1 + (torsoScaleX - 1) * 0.4;

  return {
    torsoScaleX,
    torsoScaleY,
  };
}