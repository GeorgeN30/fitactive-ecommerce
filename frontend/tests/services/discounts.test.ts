import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/services/api", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
import api from "../../src/services/api";
import { createDiscountRequest, fetchDiscountRequests, fetchMyDiscountRequests, revertDiscountRequest, reviewDiscountRequest } from "../../src/services/discounts";
describe("discount API service", () => {
  beforeEach(() => vi.clearAllMocks());
  it("sends quick/custom validity and returns created requests", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { requests: [{ id: "r1" }] } });
    expect(await createDiscountRequest(["s1"], 20, "Temporada", { duracionHoras: 24 })).toEqual([{ id: "r1" }]);
    expect(api.post).toHaveBeenCalledWith("/inventory/discount-requests", { productoTallaIds: ["s1"], porcentaje: 20, motivo: "Temporada", duracionHoras: 24 });
    await createDiscountRequest(["s2"], 15, "Fin de campaña", { fechaFin: "2099-01-01T00:00:00Z" });
    expect(api.post).toHaveBeenLastCalledWith("/inventory/discount-requests", expect.objectContaining({ fechaFin: "2099-01-01T00:00:00Z" }));
  });
  it("loads requester/admin lists and sends review/revert decisions", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { requests: [] } }); vi.mocked(api.put).mockResolvedValue({ data: { request: { id: "r1" } } });
    await fetchMyDiscountRequests(); await fetchDiscountRequests("PENDING"); await fetchDiscountRequests();
    expect(api.get).toHaveBeenNthCalledWith(2, "/admin/discount-requests", { params: { status: "PENDING" } });
    expect(api.get).toHaveBeenNthCalledWith(3, "/admin/discount-requests", { params: undefined });
    expect(await reviewDiscountRequest("r1", "APPROVED", "ok")).toEqual({ id: "r1" });
    expect(await revertDiscountRequest("r1")).toEqual({ id: "r1" });
    expect(api.put).toHaveBeenNthCalledWith(1, "/admin/discount-requests/r1/review", { decision: "APPROVED", comment: "ok" });
    expect(api.put).toHaveBeenNthCalledWith(2, "/admin/discount-requests/r1/revert");
  });
});
