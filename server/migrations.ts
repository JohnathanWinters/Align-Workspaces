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

// Snap legacy recurring_discount_after values to the current dropdown
// options {0, 2, 3, 4, 8, 12} so the host form renders correctly.
export async function normalizeRecurringDiscountAfter() {
  try {
    const result = await db.execute(sql`
      UPDATE spaces SET recurring_discount_after = CASE
        WHEN recurring_discount_after IN (0, 2, 3, 4, 8, 12) THEN recurring_discount_after
        WHEN recurring_discount_after < 3 THEN 2
        WHEN recurring_discount_after BETWEEN 3 AND 6 THEN 4
        WHEN recurring_discount_after BETWEEN 7 AND 10 THEN 8
        ELSE 12
      END
      WHERE recurring_discount_after NOT IN (0, 2, 3, 4, 8, 12)
    `);
    const count = (result as any).rowCount || 0;
    if (count > 0) {
      console.log(`Normalized ${count} space(s) recurring_discount_after value(s)`);
    }
  } catch (err) {
    console.warn("recurring_discount_after normalization skipped:", err);
  }
}
