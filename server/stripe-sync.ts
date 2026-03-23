import { getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { spaceBookings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "./index";

/**
 * Syncs completed Stripe checkout sessions back into the space_bookings table.
 * Use this to reconstruct booking records after a database migration/loss.
 */
export async function syncStripeBookings(): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const stripe = await getUncachableStripeClient();
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  log("Starting Stripe booking sync...", "stripe-sync");

  // Fetch all completed checkout sessions (paginated)
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      status: "complete",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
      expand: ["data.payment_intent"],
    });

    for (const session of sessions.data) {
      const meta = session.metadata || {};

      // Only process space bookings
      if (meta.type !== "space_booking" || !meta.bookingId) {
        continue;
      }

      try {
        // Check if booking already exists
        const [existing] = await db.select({ id: spaceBookings.id })
          .from(spaceBookings)
          .where(eq(spaceBookings.id, meta.bookingId));

        if (existing) {
          skipped++;
          continue;
        }

        const bookingHours = parseInt(meta.bookingHours) || 1;
        const spaceId = meta.spaceId || "";
        const userId = meta.userId || "";
        const bookingDate = meta.bookingDate || "";
        const bookingStartTime = meta.bookingStartTime || null;
        const guestName = meta.guestName || "Guest";
        const guestEmail = meta.guestEmail || "";
        const feeTier = meta.feeTier || "standard";

        // Reconstruct amounts from the session
        const amountTotal = session.amount_total || 0; // in cents
        const paymentIntent = typeof session.payment_intent === "object" ? session.payment_intent : null;
        const applicationFee = paymentIntent?.application_fee_amount || 0;

        // Try to reverse-engineer the fee breakdown
        // totalGuestCharged = amountTotal
        // applicationFee = guestFee + hostFee + tax
        // We know the tier, so we can recalculate
        let guestFeePercent = 0.07;
        let hostFeePercent = 0.125;
        const taxRate = 0.07;

        if (feeTier === "repeat_guest") {
          guestFeePercent = 0.05;
          hostFeePercent = 0.125;
        } else if (feeTier === "host_referred") {
          guestFeePercent = 0.07;
          hostFeePercent = 0.08;
        }

        // totalGuestCharged = basePriceCents * (1 + guestFeePercent + taxRate)
        const totalMultiplier = 1 + guestFeePercent + taxRate;
        const basePriceCents = Math.round(amountTotal / totalMultiplier);
        const guestFeeAmount = Math.round(basePriceCents * guestFeePercent);
        const hostFeeAmount = Math.round(basePriceCents * hostFeePercent);
        const taxAmount = Math.round(basePriceCents * taxRate);
        const totalGuestCharged = amountTotal;
        const hostPayoutAmount = basePriceCents - hostFeeAmount;
        const platformRevenue = hostFeeAmount + guestFeeAmount;

        await db.insert(spaceBookings).values({
          id: meta.bookingId,
          spaceId,
          userId,
          userName: guestName,
          userEmail: guestEmail,
          status: "approved",
          bookingDate,
          bookingStartTime,
          bookingHours,
          paymentAmount: totalGuestCharged,
          renterFeeAmount: guestFeeAmount,
          hostFeeAmount,
          hostEarnings: hostPayoutAmount,
          feeTier,
          hostFeePercent: String(hostFeePercent),
          guestFeePercent: String(guestFeePercent),
          guestFeeAmount,
          taxRate: String(taxRate),
          taxAmount,
          totalGuestCharged,
          hostPayoutAmount,
          platformRevenue,
          paymentStatus: "paid",
          payoutStatus: "paid",
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntent?.id || null,
        });

        synced++;
        log(`Synced booking ${meta.bookingId}: ${guestName} - ${bookingDate} ($${(amountTotal / 100).toFixed(2)})`, "stripe-sync");
      } catch (err: any) {
        errors.push(`${meta.bookingId}: ${err.message}`);
        log(`Error syncing ${meta.bookingId}: ${err.message}`, "stripe-sync");
      }
    }

    hasMore = sessions.has_more;
    if (sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    }
  }

  log(`Stripe sync complete: ${synced} synced, ${skipped} skipped, ${errors.length} errors`, "stripe-sync");
  return { synced, skipped, errors };
}
