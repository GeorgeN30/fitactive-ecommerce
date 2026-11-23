// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("local Font Awesome", () => {
  it("loads the complete pinned stylesheet locally instead of the CDN", () => {
    expect(read("../../index.html")).not.toMatch(/cdnjs\.cloudflare\.com/i);
    expect(read("../../src/main.tsx")).toContain('@fortawesome/fontawesome-free/css/all.css');
    expect(require("@fortawesome/fontawesome-free/package.json").version).toBe("6.4.0");
  });

  it("uses swap for every font face, including brands and legacy families", () => {
    const css = readFileSync(require.resolve("@fortawesome/fontawesome-free/css/all.css"), "utf8");
    const faces = [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((match) => match[0]);
    expect(faces).toHaveLength(10);
    for (const face of faces) {
      expect(face).toMatch(/font-display:\s*swap\s*;/);
      expect(face).toMatch(/\.woff2/);
    }
    for (const family of ["Font Awesome 6 Free", "Font Awesome 6 Brands", "Font Awesome 5 Free", "Font Awesome 5 Brands", "FontAwesome"]) {
      expect(faces.some((face) => face.includes(`'${family}'`))).toBe(true);
    }
    expect(css).toContain(".fa-brands");
    expect(css).toContain(".fa-solid");
    expect(css).toContain(".fa-regular");
  });
});
