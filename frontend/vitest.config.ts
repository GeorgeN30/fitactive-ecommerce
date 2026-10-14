import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 10000,
    maxWorkers: 2,
    coverage: {
      thresholds: { statements: 55, branches: 45, functions: 50, lines: 55 },
    },
  },
});
