import { isAxiosError } from "axios";

export function profileSaveError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return "No pudimos conectar con el servidor. Inténtalo de nuevo o continúa desde tu perfil.";
    if (error.response.status === 401 || error.response.status === 403) {
      return "Tu sesión no permite guardar estos cambios. Vuelve a iniciar sesión.";
    }
    if (error.response.status === 400) return "No pudimos guardar tus datos. Revisa los valores seleccionados e inténtalo de nuevo.";
  }
  return "No pudimos guardar tus datos. Inténtalo de nuevo o continúa desde tu perfil.";
}
