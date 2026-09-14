import api from "./api";
import type { InventoryMovement } from "../data/types";

export interface InventoryMovementInput {
  productoTallaId?: string;
  productoId?: string;
  talla?: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string;
}

export interface InventoryMovementResponse {
  movement: InventoryMovement;
}

export async function createInventoryMovement(
  input: InventoryMovementInput,
): Promise<InventoryMovementResponse> {
  const { data } = await api.post<InventoryMovementResponse>(
    "/inventory/movements",
    input,
  );
  return data;
}
