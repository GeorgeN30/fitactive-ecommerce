import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
    coverage: {
      thresholds: { statements: 50, branches: 45, functions: 50, lines: 50 },
    },
  },
});
