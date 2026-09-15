import api from "./api";

export type DiscountRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVERTED";

export interface DiscountRequest {
  id: string;
  status: DiscountRequestStatus;
  percent: number;
  reason: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewComment: string | null;
  product: {
    id: string;
    name: string;
    sizeId: string;
    size: string;
    basePrice: number;
    currentDiscountPercent: number;
    salePrice: number;
  };
  requester: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export async function createDiscountRequest(
  productoTallaIds: string[],
  porcentaje: number,
  motivo: string,
): Promise<DiscountRequest[]> {
  const { data } = await api.post("/inventory/discount-requests", {
    productoTallaIds,
    porcentaje,
    motivo,
  });
  return data.requests as DiscountRequest[];
}

export async function fetchMyDiscountRequests(): Promise<DiscountRequest[]> {
  const { data } = await api.get("/inventory/discount-requests");
  return data.requests as DiscountRequest[];
}

export async function fetchDiscountRequests(
  status?: DiscountRequestStatus,
): Promise<DiscountRequest[]> {
  const { data } = await api.get("/admin/discount-requests", {
    params: status ? { status } : undefined,
  });
  return data.requests as DiscountRequest[];
}

export async function reviewDiscountRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  comment?: string,
): Promise<DiscountRequest> {
  const { data } = await api.put(`/admin/discount-requests/${id}/review`, {
    decision,
    comment,
  });
  return data.request as DiscountRequest;
}

export async function revertDiscountRequest(id: string): Promise<DiscountRequest> {
  const { data } = await api.put(`/admin/discount-requests/${id}/revert`);
  return data.request as DiscountRequest;
}
