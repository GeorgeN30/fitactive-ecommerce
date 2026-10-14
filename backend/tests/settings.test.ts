import { describe, expect, it, vi } from "vitest";
vi.mock("../src/config/prisma", () => ({ prisma: {} }));
import { validateSettings } from "../src/services/settings";
describe("store settings validation", () => {
  it("accepts supported real settings", () => { expect(validateSettings({ storeName: "FitLook", tolerance: "Flexible", timeout: 60 })).toMatchObject({ timeout: 60 }); });
  it("rejects unsupported payment gateways and invalid limits", () => {
    for (const data of [{ gateway: "Stripe" }, { limit: 0 }, { timeout: 0 }, { tax: NaN }, { twoFactor: "true" }, { storeName: "" }, { email: "bad" }]) expect(() => validateSettings(data)).toThrow(/INVALID_/);
  });
  it("rejects inherited/prototype keys instead of persisting them", () => {
    expect(() => validateSettings(JSON.parse('{"__proto__":{"admin":true}}'))).toThrow("INVALID_SETTINGS");
    expect(() => validateSettings(JSON.parse('{"constructor":"payload"}'))).toThrow("INVALID_SETTINGS");
  });
});
