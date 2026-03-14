import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : (null as any);

export const db = process.env.DATABASE_URL
  ? drizzle(pool, { schema })
  : (null as any);
