// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL not found in environment");
export default defineConfig({
  dialect: "postgresql",
  schema: "./app/db/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
  out: "./drizzle",
});

// Generate migration files: pnpm drizzle-kit generate
// push to cloud: pnpm drizzle-kit push --strict --verbose
