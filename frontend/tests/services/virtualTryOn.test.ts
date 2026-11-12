import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import api from "../../src/services/api";
import { fetchVirtualTryOnSummary, getVirtualTryOnSessionId, hasVirtualTryOnProduct, markVirtualTryOnProduct, trackVirtualTryOnEvent } from "../../src/services/virtualTryOn";
describe("virtual try-on frontend service", () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
  it("creates one secure per-tab session id and safely parses tracked products", () => {
    const sessionId = getVirtualTryOnSessionId(); expect(sessionId.length).toBeGreaterThanOrEqual(8);
    expect(getVirtualTryOnSessionId()).toBe(sessionId);
    markVirtualTryOnProduct("product-a"); markVirtualTryOnProduct("product-a");
    expect(hasVirtualTryOnProduct("product-a")).toBe(true);
    expect(hasVirtualTryOnProduct("product-b")).toBe(false);
    sessionStorage.setItem("fitlook:virtual-tryon-products", "bad-json"); expect(hasVirtualTryOnProduct("product-a")).toBe(false);
  });
  it("sends telemetry and summarizes the selected period", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} }); vi.mocked(api.get).mockResolvedValue({ data: { summary: { totalTests: 3 } } });
    await trackVirtualTryOnEvent({ sessionId: "session-qa-1234", type: "session_started" });
    expect(await fetchVirtualTryOnSummary("week", "2026-10-08")).toEqual({ totalTests: 3 });
    expect(api.get).toHaveBeenCalledWith("/admin/virtual-tryon/summary", { params: { period: "week", date: "2026-10-08" } });
  });
});
