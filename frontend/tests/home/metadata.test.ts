// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Home document metadata", () => {
  it("provides an accurate Spanish description without a misleading SPA-wide canonical", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    expect(html).toMatch(/<html\s+lang="es"/);
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{50,160}"/);
    expect(html).not.toMatch(/rel=["']canonical["']/i);
  });

  it("serves a valid robots file instead of the SPA fallback", () => {
    const robots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    expect(robots).toMatch(/^User-agent: \*\s*$/m);
    expect(robots).toMatch(/^Allow: \/\s*$/m);
    expect(robots).not.toMatch(/<html/i);
  });
});
