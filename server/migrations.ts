import { db } from "./db";
import { sql } from "drizzle-orm";

export async function fixPortfolioImageExtensions() {
  try {
    const result = await db.execute(
      sql`UPDATE portfolio_photos SET image_url = regexp_replace(image_url, '\.(jpg|jpeg|JPG|JPEG)$', '.webp') WHERE image_url ~* '\.(jpg|jpeg)$'`
    );
    const count = (result as any).rowCount || 0;
    if (count > 0) {
      console.log(`Fixed ${count} portfolio image URL(s) → .webp`);
    }
  } catch (err) {
    console.warn("Portfolio image extension fix skipped:", err);
  }
}
