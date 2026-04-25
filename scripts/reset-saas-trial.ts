/**
 * One-off script: completely resets a user's SaaS subscription state so they
 * become trial-eligible again. Cancels any Stripe subscription, then deletes
 * all host_subscriptions rows for that user.
 *
 * Usage:
 *   npx tsx scripts/reset-saas-trial.ts <email>
 *
 * Requires DATABASE_URL and STRIPE_SECRET_KEY in env (load via dotenv).
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { hostSubscriptions, users } from "../shared/schema";
import { getUncachableStripeClient } from "../server/stripeClient";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/reset-saas-trial.ts <email>");
    process.exit(1);
  }
  if (!db) {
    console.error("DATABASE_URL not set — cannot connect to database.");
    process.exit(1);
  }

  console.log(`Resetting SaaS trial state for: ${email}\n`);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error(`No user found with email ${email}.`);
    process.exit(1);
  }
  console.log(`Found user: ${user.id} (${user.firstName ?? "?"} ${user.lastName ?? ""})`);

  const subRows = await db.select().from(hostSubscriptions).where(eq(hostSubscriptions.userId, user.id));
  console.log(`Found ${subRows.length} host_subscriptions row(s).`);

  const stripe = await getUncachableStripeClient();

  for (const row of subRows) {
    if (row.stripeSubscriptionId) {
      try {
        const current = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
        if (current.status !== "canceled") {
          await stripe.subscriptions.cancel(row.stripeSubscriptionId);
          console.log(`  Canceled Stripe subscription: ${row.stripeSubscriptionId}`);
        } else {
          console.log(`  Stripe subscription ${row.stripeSubscriptionId} already canceled.`);
        }
      } catch (err: any) {
        console.warn(`  Could not cancel Stripe subscription ${row.stripeSubscriptionId}: ${err.message}`);
      }
    }
  }

  if (subRows.length > 0 && subRows[0].stripeCustomerId) {
    const customerId = subRows[0].stripeCustomerId;
    const allSubs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    for (const s of allSubs.data) {
      if (s.metadata?.context === "saas" && s.status !== "canceled") {
        await stripe.subscriptions.cancel(s.id);
        console.log(`  Canceled lingering SaaS sub: ${s.id}`);
      }
    }
  }

  const deleted = await db.delete(hostSubscriptions).where(eq(hostSubscriptions.userId, user.id)).returning();
  console.log(`Deleted ${deleted.length} host_subscriptions row(s) from DB.`);

  console.log(`\nDone. ${email} is now trial-eligible again.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
