import { getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { spaceBookings, invoicePayments } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "./index";

/**
 * Syncs completed Stripe checkout sessions into the space_bookings table.
 * Only inserts bookings that don't already exist (by ID).
 */
async function syncBookings(stripe: any): Promise<{ synced: number; skipped: number; errors: string[] }> {
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

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
      if (meta.type !== "space_booking" || !meta.bookingId) continue;

      try {
        const [existing] = await db.select({ id: spaceBookings.id })
          .from(spaceBookings)
          .where(eq(spaceBookings.id, meta.bookingId));
        if (existing) { skipped++; continue; }

        const bookingHours = parseInt(meta.bookingHours) || 1;
        const feeTier = meta.feeTier || "standard";
        const amountTotal = session.amount_total || 0;
        const paymentIntent = typeof session.payment_intent === "object" ? session.payment_intent : null;

        let guestFeePercent = 0.07, hostFeePercent = 0.125;
        const taxRate = 0.07;
        if (feeTier === "repeat_guest") guestFeePercent = 0.05;
        else if (feeTier === "host_referred") hostFeePercent = 0.105;

        const totalMultiplier = 1 + guestFeePercent + taxRate;
        const basePriceCents = Math.round(amountTotal / totalMultiplier);
        const guestFeeAmount = Math.round(basePriceCents * guestFeePercent);
        const hostFeeAmount = Math.round(basePriceCents * hostFeePercent);
        const taxAmount = Math.round(basePriceCents * taxRate);
        const hostPayoutAmount = basePriceCents - hostFeeAmount;
        const platformRevenue = hostFeeAmount + guestFeeAmount;

        await db.insert(spaceBookings).values({
          id: meta.bookingId, spaceId: meta.spaceId || "", userId: meta.userId || "",
          userName: meta.guestName || "Guest", userEmail: meta.guestEmail || "",
          status: "approved", bookingDate: meta.bookingDate || "",
          bookingStartTime: meta.bookingStartTime || null, bookingHours,
          paymentAmount: amountTotal, renterFeeAmount: guestFeeAmount,
          hostFeeAmount, hostEarnings: hostPayoutAmount,
          feeTier, hostFeePercent: String(hostFeePercent), guestFeePercent: String(guestFeePercent),
          guestFeeAmount, taxRate: String(taxRate), taxAmount,
          totalGuestCharged: amountTotal, hostPayoutAmount, platformRevenue,
          paymentStatus: "paid", payoutStatus: "paid",
          stripeSessionId: session.id, stripePaymentIntentId: paymentIntent?.id || null,
        });

        synced++;
        log(`Synced booking ${meta.bookingId}: ${meta.guestName} - ${meta.bookingDate} ($${(amountTotal / 100).toFixed(2)})`, "stripe-sync");
      } catch (err: any) {
        errors.push(`booking ${meta.bookingId}: ${err.message}`);
      }
    }

    hasMore = sessions.has_more;
    if (sessions.data.length > 0) startingAfter = sessions.data[sessions.data.length - 1].id;
  }

  return { synced, skipped, errors };
}

/**
 * Collects all Stripe payments (invoices + checkout downpayments) into a
 * deduplicated list keyed by payment_intent ID, then replaces the
 * invoice_payments table entirely. No duplicates possible.
 */
async function syncInvoicePayments(stripe: any): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];

  // Collect all payments keyed by payment_intent to deduplicate
  const paymentMap = new Map<string, {
    stripePaymentIntentId: string | null;
    stripeInvoiceId: string | null;
    customerEmail: string;
    customerName: string;
    amount: number;
    description: string;
    shootId: string | null;
    paidAt: Date;
  }>();

  // 1. Fetch paid invoices
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const invoices = await stripe.invoices.list({
      status: "paid",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const invoice of invoices.data) {
      try {
        const piId = typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id || null;
        const key = piId || `inv-${invoice.id}`;

        paymentMap.set(key, {
          stripePaymentIntentId: piId,
          stripeInvoiceId: invoice.id,
          customerEmail: invoice.customer_email || "",
          customerName: invoice.customer_name || (invoice.customer_email || "").split("@")[0] || "Client",
          amount: invoice.amount_paid || 0,
          description: invoice.lines?.data?.[0]?.description || "Invoice payment",
          shootId: invoice.metadata?.shootId || null,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
        });
      } catch (err: any) {
        errors.push(`invoice ${invoice.id}: ${err.message}`);
      }
    }

    hasMore = invoices.has_more;
    if (invoices.data.length > 0) startingAfter = invoices.data[invoices.data.length - 1].id;
  }

  // 2. Fetch checkout sessions for portrait downpayments
  hasMore = true;
  startingAfter = undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      status: "complete",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
      expand: ["data.payment_intent"],
    });

    for (const session of sessions.data) {
      const meta = session.metadata || {};
      // Only portrait downpayments (has leadId, no type)
      if (!meta.leadId || meta.type) continue;

      try {
        const piId = typeof session.payment_intent === "object"
          ? session.payment_intent?.id
          : session.payment_intent || null;
        const key = piId || `session-${session.id}`;

        // Don't overwrite if invoice already captured this payment
        if (paymentMap.has(key)) continue;

        paymentMap.set(key, {
          stripePaymentIntentId: piId,
          stripeInvoiceId: null,
          customerEmail: session.customer_email || "",
          customerName: (session.customer_email || "").split("@")[0] || "Client",
          amount: session.amount_total || 0,
          description: "Portrait session downpayment (50%)",
          shootId: null,
          paidAt: session.created ? new Date(session.created * 1000) : new Date(),
        });
      } catch (err: any) {
        errors.push(`downpayment ${meta.leadId}: ${err.message}`);
      }
    }

    hasMore = sessions.has_more;
    if (sessions.data.length > 0) startingAfter = sessions.data[sessions.data.length - 1].id;
  }

  // 3. Clear existing invoice_payments and insert fresh
  await db.delete(invoicePayments).where(sql`1=1`);

  for (const payment of paymentMap.values()) {
    try {
      await db.insert(invoicePayments).values(payment);
    } catch (err: any) {
      errors.push(`insert: ${err.message}`);
    }
  }

  log(`Synced ${paymentMap.size} invoice payments (cleared and rebuilt)`, "stripe-sync");
  return { synced: paymentMap.size, errors };
}

/**
 * Syncs all Stripe payment data (bookings + invoices).
 */
export async function syncStripeBookings() {
  const stripe = await getUncachableStripeClient();
  log("Starting Stripe sync (bookings + invoices)...", "stripe-sync");

  const bookings = await syncBookings(stripe);
  const invoiceResult = await syncInvoicePayments(stripe);

  const result = {
    synced: bookings.synced + invoiceResult.synced,
    skipped: bookings.skipped,
    errors: [...bookings.errors, ...invoiceResult.errors],
    details: {
      bookings: { synced: bookings.synced, skipped: bookings.skipped },
      invoices: { synced: invoiceResult.synced },
    },
  };

  log(`Stripe sync complete: ${bookings.synced} bookings, ${invoiceResult.synced} invoice payments`, "stripe-sync");
  return result;
}
