// Import the Vitest configuration helper
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run the tests in a Node.js environment
    environment: "node",
    // Only pick up files inside the tests folder
    include: ["tests/**/*.test.js"],
    // Environment variables injected before any module is imported.
    // dotenv never overrides existing variables, so these win over .env.
    env: {
      // config.js uses this value to select the TEST_DB_* variables
      NODE_ENV: "test",
      DIALECT: "postgres",
      API_KEY: "test-api-key",
      AUTH_API_JWT_SECRET_KEY: "test-jwt-secret",
      // 64 hex chars = 32 bytes, required by messageCipher
      MESSAGE_ENCRYPTION_KEY:
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
      CORS_ORIGIN: "http://localhost:3355",
      TRUST_PROXY_HOPS: "0",
    },
  },
});
