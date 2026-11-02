export type BodyType = "slim" | "average" | "broad";

export function getInitialBodyType(user: {
  id: string;
  bodyType?: BodyType | null;
} | null): BodyType {
  if (user?.bodyType) return user.bodyType;
  if (!user) return "average";

  // Recover the shipped browser-only preference until the profile is saved.
  try {
    const legacyTypes: Record<string, BodyType> = {
      delgado: "slim",
      medio: "average",
      ancho: "broad",
    };
    return legacyTypes[localStorage.getItem(`fitlook_tipo_cuerpo_${user.id}`) || ""] || "average";
  } catch {
    return "average";
  }
}
