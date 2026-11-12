// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const adminFonts = "../../src/components/admin/fonts.css";

describe("self-hosted typography", () => {
  it("uses local fonts without Google CDN references", () => {
    const html = read("../../index.html");
    const globalCss = read("../../src/index.css");
    expect(html + globalCss + read(adminFonts)).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    expect(globalCss).toContain('@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2');
    expect(globalCss).toContain('"Plus Jakarta Sans Variable"');
    expect(globalCss).toContain('"Inter Variable"');
  });

  it("loads admin fonts only through lazy admin and inventory routes", () => {
    const app = read("../../src/App.tsx");
    expect(app).toMatch(/lazy\(\(\) => import\("\.\/components\/admin\/AdminLayout"\)\)/);
    expect(app).toMatch(/lazy\(\(\) => import\("\.\/pages\/inventory\/InventoryDashboard"\)\)/);
    expect(read("../../src/components/admin/AdminLayout.tsx")).toContain('import "./fonts.css"');
    expect(read("../../src/pages/inventory/InventoryDashboard.tsx")).toContain('import "../../components/admin/fonts.css"');
    expect(read("../../src/index.css")).not.toContain('@fontsource/barlow-condensed');
    expect(read("../../src/index.css")).not.toContain('@fontsource-variable/inter');
  });

  it("provides Latin WOFF2 with swap for all required weights", () => {
    for (const css of [read("../../src/index.css"), read(adminFonts)]) {
      expect(css).toMatch(/font-display:\s*swap\s*;/);
    }
    for (const path of [
      "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
      "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
    ]) {
      expect(readFileSync(require.resolve(path)).length).toBeGreaterThan(0);
    }
    for (const weight of [400, 500, 600, 700, 800, 900]) {
      const path = `@fontsource/barlow-condensed/latin-${weight}.css`;
      const css = readFileSync(require.resolve(path), "utf8");
      expect(css).toMatch(/font-display:\s*swap\s*;/);
      expect(css).toMatch(/\.woff2/);
      expect(css).toMatch(new RegExp(`font-weight:\\s*${weight}\\s*;`));
      expect(read(adminFonts)).toContain(path);
    }
    expect(read(adminFonts)).toContain('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
  });
});
