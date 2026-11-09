import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/db/seed.ts"],
    },
    testTimeout: 10000,
    // Isolated, throwaway database and no real API calls during tests
    env: { AEGIS_DB_PATH: ":memory:", ANTHROPIC_API_KEY: "", JWT_SECRET: "test-secret", NODE_ENV: "test" },
  },
});
