import { storage } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";
import { sendPushToUser } from "./pushNotifications";
import { sendArrivalGuideEmail } from "./gmail";
import { db } from "./db";
import { arrivalGuides, arrivalGuideSteps, spaceBookings } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

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

/**
 * Auto-checkout checked-in bookings where end time + 60 min buffer has passed.
 */
export async function processAutoCheckouts(): Promise<number> {
  const bookings = await storage.getBookingsNeedingAutoCheckout();
  let count = 0;

  for (const booking of bookings) {
    try {
      const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (booking.bookingHours || 1) * 60 * 60 * 1000);
      const bufferEnd = new Date(endDateTime.getTime() + 60 * 60 * 1000); // 60 min buffer

      if (Date.now() < bufferEnd.getTime()) continue;

      const minutesPastEnd = Math.max(0, (Date.now() - endDateTime.getTime()) / (1000 * 60));
      const overtimeMinutes = minutesPastEnd > 0 ? Math.ceil(minutesPastEnd / 30) * 30 : 0;

      await storage.updateSpaceBooking(booking.id, {
        status: "completed",
        checkedOutAt: new Date(),
        checkedOutBy: "system",
        overtimeMinutes,
        updatedAt: new Date(),
      });

      await storage.createSpaceMessage({
        spaceBookingId: booking.id,
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        message: `Session auto-completed.${overtimeMinutes > 0 ? ` (${overtimeMinutes} min overtime)` : ""}`,
        messageType: "check_out",
      });

      count++;
    } catch (err) {
      console.error(`[payouts] Failed to auto-checkout booking ${booking.id}:`, (err as Error).message);
    }
  }

  if (count > 0) {
    console.log(`[payouts] Auto-checked-out ${count} bookings`);
  }
  return count;
}

/**
 * Process booking notifications on a 15-minute interval.
 * Sends reminders for upcoming bookings, check-in prompts, no-show alerts, and end-of-session reminders.
 * Each notification has a time window to ensure it fires in exactly one 15-min cycle.
 */
export async function processBookingNotifications(): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get bookings for today and tomorrow
  const todayBookings = await storage.getBookingsForCheckInNotifications(todayStr);
  const tomorrowBookings = await storage.getBookingsForCheckInNotifications(tomorrowStr);
  const checkedInToday = await storage.getBookingsNeedingEndReminder(todayStr);
  const noCheckInBookings = await storage.getBookingsNeedingNoShowAlert(todayStr);

  for (const booking of tomorrowBookings) {
    const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
    const msUntilStart = startDateTime.getTime() - now.getTime();
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
    const space = await storage.getSpaceById(booking.spaceId);
    const spaceName = space?.name || "your space";

    // 24hr before: window 23.5-24.5 hrs
    if (hoursUntilStart >= 23.5 && hoursUntilStart < 24.5) {
      if (booking.userId) {
        sendPushToUser(booking.userId, {
          title: "Booking tomorrow",
          body: `Your booking at ${spaceName} is tomorrow.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-24hr`,
        }, "booking");
      }
      if (space?.userId) {
        sendPushToUser(space.userId, {
          title: "Booking tomorrow",
          body: `You have a booking at ${spaceName} tomorrow.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-24hr`,
        }, "booking").catch(() => {});
      }
    }
  }

  for (const booking of todayBookings) {
    const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
    const msUntilStart = startDateTime.getTime() - now.getTime();
    const minUntilStart = msUntilStart / (1000 * 60);
    const space = await storage.getSpaceById(booking.spaceId);
    const spaceName = space?.name || "your space";

    // 1hr before: window 52.5-67.5 min
    if (minUntilStart >= 52.5 && minUntilStart < 67.5) {
      if (booking.userId) {
        sendPushToUser(booking.userId, {
          title: "Session starts in 1 hour",
          body: `Your booking at ${spaceName} starts in about 1 hour.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-1hr`,
        }, "booking");
      }
      if (space?.userId) {
        sendPushToUser(space.userId, {
          title: "Session starts in 1 hour",
          body: `A booking at ${spaceName} starts in about 1 hour.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-1hr`,
        }, "booking");
      }
    }

    // At start time: window -7.5 to 7.5 min from start
    if (minUntilStart >= -7.5 && minUntilStart < 7.5 && !booking.checkedInAt) {
      if (booking.userId) {
        sendPushToUser(booking.userId, {
          title: "Check in now",
          body: `Your session at ${spaceName} is starting — check in now.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-start`,
        }, "booking").catch(() => {});
      }
    }
  }

  // 30 min past start, no check-in: alert host (window 22.5-37.5 min past start)
  for (const booking of noCheckInBookings) {
    const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
    const minPastStart = (now.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (minPastStart >= 22.5 && minPastStart < 37.5) {
      const space = await storage.getSpaceById(booking.spaceId);
      if (space?.userId) {
        sendPushToUser(space.userId, {
          title: "Guest hasn't checked in",
          body: `The guest hasn't checked in for their booking at ${space.name}.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-noshow`,
        }, "booking").catch(() => {});
      }
    }
  }

  // End reminders for checked-in bookings
  for (const booking of checkedInToday) {
    const startDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (booking.bookingHours || 1) * 60 * 60 * 1000);
    const minUntilEnd = (endDateTime.getTime() - now.getTime()) / (1000 * 60);
    const space = await storage.getSpaceById(booking.spaceId);
    const spaceName = space?.name || "your space";

    // 15 min before end: window 7.5-22.5 min before end
    if (minUntilEnd >= 7.5 && minUntilEnd < 22.5) {
      if (booking.userId) {
        sendPushToUser(booking.userId, {
          title: "Session ending soon",
          body: `Your session at ${spaceName} ends in about 15 minutes.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-15min`,
        }, "booking");
      }
      if (space?.userId) {
        sendPushToUser(space.userId, {
          title: "Session ending soon",
          body: `A session at ${spaceName} ends in about 15 minutes.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-15min`,
        }, "booking");
      }
    }

    // At end time: window -7.5 to 7.5 min from end (no checkout yet)
    if (minUntilEnd >= -7.5 && minUntilEnd < 7.5 && !booking.checkedOutAt) {
      if (booking.userId) {
        sendPushToUser(booking.userId, {
          title: "Session ended",
          body: `Your session at ${spaceName} has ended — please check out.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-ended`,
        }, "booking");
      }
      if (space?.userId) {
        sendPushToUser(space.userId, {
          title: "Session ended",
          body: `The session at ${spaceName} has ended — please check out.`,
          url: "/portal?tab=messages",
          tag: `booking-${booking.id}-ended`,
        }, "booking").catch(() => {});
      }
    }
  }

  // Auto-checkout safety net
  await processAutoCheckouts();
}

/**
 * Send arrival guide emails to guests on the day of their booking.
 * Only sends if the space has an arrival guide and the email hasn't been sent yet.
 */
export async function processArrivalGuideEmails(): Promise<void> {
  const todayStr = new Date().toISOString().split("T")[0];

  // Get today's approved, paid bookings that haven't had the arrival guide email sent
  const bookings = await db.select().from(spaceBookings).where(
    and(
      eq(spaceBookings.bookingDate, todayStr),
      eq(spaceBookings.status, "approved"),
      eq(spaceBookings.paymentStatus, "paid"),
      isNull(spaceBookings.arrivalGuideSentAt),
    )
  );

  for (const booking of bookings) {
    try {
      // Check if space has an arrival guide
      const [guide] = await db.select().from(arrivalGuides).where(eq(arrivalGuides.spaceId, booking.spaceId));
      if (!guide) continue;

      // Skip if guide is completely empty
      if (!guide.wifiName && !guide.wifiPassword && !guide.doorCode && !guide.notes) {
        const stepCount = await db.select().from(arrivalGuideSteps).where(eq(arrivalGuideSteps.guideId, guide.id));
        if (stepCount.length === 0) continue;
      }

      const steps = await db.select().from(arrivalGuideSteps)
        .where(eq(arrivalGuideSteps.guideId, guide.id))
        .orderBy(arrivalGuideSteps.sortOrder);

      const space = await storage.getSpaceById(booking.spaceId);
      const spaceName = space?.name || "your space";
      const guestName = booking.userName || "Guest";
      const guestEmail = booking.userEmail;

      if (!guestEmail) continue;

      await sendArrivalGuideEmail({
        guestName,
        guestEmail,
        spaceName,
        bookingDate: booking.bookingDate || todayStr,
        bookingStartTime: booking.bookingStartTime || "TBD",
        bookingId: booking.id,
        guide: {
          wifiName: guide.wifiName,
          wifiPassword: guide.wifiPassword,
          doorCode: guide.doorCode,
          notes: guide.notes,
          steps: steps.map((s: { imageUrl: string; caption: string | null }) => ({ imageUrl: s.imageUrl, caption: s.caption || "" })),
        },
      });

      // Mark as sent to prevent duplicates
      await db.update(spaceBookings)
        .set({ arrivalGuideSentAt: new Date() })
        .where(eq(spaceBookings.id, booking.id));

      console.log(`[arrival-guide] Sent arrival guide email for booking ${booking.id}`);
    } catch (err) {
      console.error(`[arrival-guide] Failed to send for booking ${booking.id}:`, (err as Error).message);
    }
  }
}

let payoutInterval: ReturnType<typeof setInterval> | null = null;
let notificationInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the automatic payout processing loop.
 * Runs every hour: completes past bookings, then processes pending payouts.
 * Also starts a 15-minute notification loop for booking reminders.
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

  const runNotifications = async () => {
    try {
      await processBookingNotifications();
      await processArrivalGuideEmails();
    } catch (err) {
      console.error("[notifications] Processing cycle error:", (err as Error).message);
    }
  };

  // Run once on startup (delayed 30s to let server settle)
  setTimeout(run, 30_000);
  setTimeout(runNotifications, 45_000);
  payoutInterval = setInterval(run, intervalMs);
  notificationInterval = setInterval(runNotifications, 15 * 60 * 1000); // 15 minutes
  console.log("[payouts] Auto-processing started (every " + Math.round(intervalMs / 60000) + " min)");
  console.log("[notifications] Booking notifications started (every 15 min)");
}

export function stopPayoutProcessing(): void {
  if (payoutInterval) {
    clearInterval(payoutInterval);
    payoutInterval = null;
  }
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}
