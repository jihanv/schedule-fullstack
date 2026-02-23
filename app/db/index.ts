/// app/db/index.ts

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { Courses, Holidays, Lessons, TimePeriod, Users } from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be a Neon postgres connection string");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({
  client: pool,
  ws,
  schema: { Users, TimePeriod, Holidays, Courses, Lessons },
});
