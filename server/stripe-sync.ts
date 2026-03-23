import { getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { spaceBookings, invoicePayments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "./index";

/**
 * Syncs completed Stripe checkout sessions back into the space_bookings table.
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
        else if (feeTier === "host_referred") hostFeePercent = 0.08;

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
 * Syncs paid Stripe invoices into the invoice_payments table.
 */
async function syncInvoices(stripe: any): Promise<{ synced: number; skipped: number; errors: string[] }> {
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

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

        if (piId) {
          const [existing] = await db.select({ id: invoicePayments.id })
            .from(invoicePayments)
            .where(eq(invoicePayments.stripePaymentIntentId, piId));
          if (existing) { skipped++; continue; }
        }

        const customerEmail = invoice.customer_email || "";
        const customerName = invoice.customer_name || customerEmail.split("@")[0] || "Client";
        const amount = invoice.amount_paid || 0;
        const description = invoice.lines?.data?.[0]?.description || "Invoice payment";
        const shootId = invoice.metadata?.shootId || null;
        const paidAt = invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date();

        await db.insert(invoicePayments).values({
          stripePaymentIntentId: piId,
          stripeInvoiceId: invoice.id,
          customerEmail,
          customerName,
          amount,
          description,
          shootId,
          paidAt,
        });

        synced++;
        log(`Synced invoice ${invoice.id}: ${customerName} - $${(amount / 100).toFixed(2)}`, "stripe-sync");
      } catch (err: any) {
        errors.push(`invoice ${invoice.id}: ${err.message}`);
      }
    }

    hasMore = invoices.has_more;
    if (invoices.data.length > 0) startingAfter = invoices.data[invoices.data.length - 1].id;
  }

  return { synced, skipped, errors };
}

/**
 * Syncs all Stripe payment data (bookings + invoices).
 */
export async function syncStripeBookings() {
  const stripe = await getUncachableStripeClient();
  log("Starting Stripe sync (bookings + invoices)...", "stripe-sync");

  const bookings = await syncBookings(stripe);
  const invoices = await syncInvoices(stripe);

  const result = {
    synced: bookings.synced + invoices.synced,
    skipped: bookings.skipped + invoices.skipped,
    errors: [...bookings.errors, ...invoices.errors],
    details: {
      bookings: { synced: bookings.synced, skipped: bookings.skipped },
      invoices: { synced: invoices.synced, skipped: invoices.skipped },
    },
  };

  log(`Stripe sync complete: ${result.synced} synced (${bookings.synced} bookings, ${invoices.synced} invoices), ${result.skipped} skipped`, "stripe-sync");
  return result;
}
