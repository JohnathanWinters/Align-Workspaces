import { storage } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";

/**
 * Mark bookings as "completed" when their booking date has passed.
 * Only processes bookings that are currently "approved" and paid.
 */
export async function processCompletedBookings(): Promise<number> {
  const bookings = await storage.getBookingsReadyForCompletion();
  let count = 0;

  for (const booking of bookings) {
    try {
      await storage.updateSpaceBooking(booking.id, {
        status: "completed",
        updatedAt: new Date(),
      });
      count++;
    } catch (err) {
      console.error(`Failed to complete booking ${booking.id}:`, (err as Error).message);
    }
  }

  if (count > 0) {
    console.log(`[payouts] Marked ${count} bookings as completed`);
  }
  return count;
}

/**
 * Process payouts for completed bookings.
 * Creates Stripe Transfers from the platform account to host connected accounts.
 * Target: within 24 hours of booking completion.
 */
export async function processPendingPayouts(): Promise<number> {
  const bookings = await storage.getBookingsPendingPayout();
  let count = 0;

  for (const booking of bookings) {
    try {
      const space = await storage.getSpaceById(booking.spaceId);
      if (!space?.userId) {
        console.warn(`[payouts] Booking ${booking.id}: space has no host userId, skipping`);
        continue;
      }

      const hostUser = await storage.getUserById(space.userId);
      if (!hostUser?.stripeAccountId || hostUser.stripeOnboardingComplete !== "true") {
        console.warn(`[payouts] Booking ${booking.id}: host ${space.userId} has no active Stripe Connect account, skipping`);
        continue;
      }

      // Use the new tier-aware payout amount, falling back to legacy field
      const payoutAmount = booking.hostPayoutAmount ?? booking.hostEarnings;
      if (!payoutAmount || payoutAmount <= 0) {
        console.warn(`[payouts] Booking ${booking.id}: no payout amount, skipping`);
        continue;
      }

      await storage.updateSpaceBooking(booking.id, {
        payoutStatus: "processing",
        updatedAt: new Date(),
      });

      const stripe = await getUncachableStripeClient();
      const transfer = await stripe.transfers.create({
        amount: payoutAmount,
        currency: "usd",
        destination: hostUser.stripeAccountId,
        metadata: {
          bookingId: booking.id,
          spaceId: booking.spaceId,
          hostUserId: space.userId,
        },
        description: `Payout for booking ${booking.id}`,
      });

      await storage.updateSpaceBooking(booking.id, {
        stripeTransferId: transfer.id,
        payoutStatus: "paid",
        updatedAt: new Date(),
      });

      count++;
    } catch (err) {
      console.error(`[payouts] Failed to process payout for booking ${booking.id}:`, (err as Error).message);
      // Revert to pending so it retries next cycle
      await storage.updateSpaceBooking(booking.id, {
        payoutStatus: "pending",
        updatedAt: new Date(),
      }).catch(() => {});
    }
  }

  if (count > 0) {
    console.log(`[payouts] Processed ${count} payouts`);
  }
  return count;
}

/**
 * Hold a payout (e.g. due to dispute). Prevents automatic payout processing.
 */
export async function holdPayout(bookingId: string): Promise<void> {
  await storage.updateSpaceBooking(bookingId, {
    payoutStatus: "held",
    updatedAt: new Date(),
  });
  console.log(`[payouts] Held payout for booking ${bookingId}`);
}

/**
 * Release a held payout back to pending so it gets processed next cycle.
 */
export async function releasePayout(bookingId: string): Promise<void> {
  const booking = await storage.getSpaceBookingById(bookingId);
  if (!booking || booking.payoutStatus !== "held") {
    throw new Error("Booking not found or payout is not held");
  }
  await storage.updateSpaceBooking(bookingId, {
    payoutStatus: "pending",
    updatedAt: new Date(),
  });
  console.log(`[payouts] Released payout for booking ${bookingId}`);
}

/**
 * Reverse a payout that was already transferred (e.g. for post-completion disputes).
 */
export async function reversePayout(bookingId: string): Promise<void> {
  const booking = await storage.getSpaceBookingById(bookingId);
  if (!booking?.stripeTransferId) {
    throw new Error("No transfer to reverse");
  }

  const stripe = await getUncachableStripeClient();
  await stripe.transfers.createReversal(booking.stripeTransferId, {
    metadata: { bookingId, reason: "dispute_or_cancellation" },
  });

  await storage.updateSpaceBooking(bookingId, {
    payoutStatus: "reversed",
    updatedAt: new Date(),
  });
  console.log(`[payouts] Reversed transfer ${booking.stripeTransferId} for booking ${bookingId}`);
}

/**
 * Calculate refund amount based on cancellation policy.
 *
 * - Guest cancels within 24hrs of BOOKING creation: full refund including guest fee
 * - Guest cancels 48+ hours before booking date: full refund minus guest fee
 * - Guest cancels under 48 hours before booking date: 50% refund minus guest fee
 * - Host cancels: full refund including guest fee
 */
export function calculateRefundAmount(booking: {
  createdAt: Date | null;
  bookingDate: string | null;
  bookingStartTime: string | null;
  totalGuestCharged: number | null;
  paymentAmount: number | null;
  guestFeeAmount: number | null;
  renterFeeAmount: number | null;
}, cancelledBy: "guest" | "host"): { amount: number; reason: string } {
  const totalCharged = booking.totalGuestCharged ?? booking.paymentAmount ?? 0;
  const guestFee = booking.guestFeeAmount ?? booking.renterFeeAmount ?? 0;

  if (totalCharged <= 0) return { amount: 0, reason: "No payment to refund" };

  // Host cancels → full refund including guest fee
  if (cancelledBy === "host") {
    return { amount: totalCharged, reason: "Host cancelled — full refund issued" };
  }

  // Check 24-hour grace period from booking creation
  const createdAt = booking.createdAt ? new Date(booking.createdAt).getTime() : 0;
  const hoursSinceBooking = (Date.now() - createdAt) / (1000 * 60 * 60);

  if (hoursSinceBooking <= 24) {
    return { amount: totalCharged, reason: "Cancelled within 24-hour grace period — full refund issued" };
  }

  // Check time until booking date
  const bookingDateTime = new Date(
    `${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`
  );
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const refundableBase = totalCharged - guestFee;

  if (hoursUntilBooking >= 48) {
    return {
      amount: refundableBase,
      reason: "Cancelled 48+ hours before booking — full refund minus service fee",
    };
  }

  // Under 48 hours: 50% of (subtotal + tax), guest fee non-refundable
  const halfRefund = Math.round(refundableBase * 0.5);
  return {
    amount: halfRefund,
    reason: "Cancelled under 48 hours before booking — 50% refund, service fee non-refundable",
  };
}

let payoutInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the automatic payout processing loop.
 * Runs every hour: completes past bookings, then processes pending payouts.
 */
export function startPayoutProcessing(intervalMs = 60 * 60 * 1000): void {
  if (payoutInterval) return;

  const run = async () => {
    try {
      await processCompletedBookings();
      await processPendingPayouts();
    } catch (err) {
      console.error("[payouts] Processing cycle error:", (err as Error).message);
    }
  };

  // Run once on startup (delayed 30s to let server settle)
  setTimeout(run, 30_000);
  payoutInterval = setInterval(run, intervalMs);
  console.log("[payouts] Auto-processing started (every " + Math.round(intervalMs / 60000) + " min)");
}

export function stopPayoutProcessing(): void {
  if (payoutInterval) {
    clearInterval(payoutInterval);
    payoutInterval = null;
  }
}
