import { config as loadEnv } from "dotenv";

loadEnv();

const isProduction = process.env.NODE_ENV === "production";
const DEV_JWT_SECRET = "aegis-dev-only-secret";

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    // A public default secret would let anyone mint admin tokens.
    throw new Error("JWT_SECRET must be set in production");
  }
  return DEV_JWT_SECRET;
}

/** Single source of truth for runtime configuration. */
export const appConfig = {
  isProduction,
  port: parseInt(process.env.PORT ?? "3001", 10),
  jwtSecret: jwtSecret(),
  /** Path to the SQLite file, or ":memory:" (used by tests). */
  dbPath: process.env.AEGIS_DB_PATH,
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || undefined,
    model: process.env.AEGIS_MODEL ?? "claude-sonnet-5-5",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST ?? "16000", 10),
    dailyRequestLimit: parseInt(process.env.AI_DAILY_REQUEST_LIMIT ?? "1000", 10),
  },
  corsOrigins: isProduction
    ? (process.env.CORS_ORIGINS ?? "https://aegis-web-xi.vercel.app").split(",")
    : ["http://localhost:5173", "http://localhost:3000"],
} as const;
