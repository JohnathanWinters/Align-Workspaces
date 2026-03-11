import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendSpaceBookingNotification } from './gmail';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        if (session.metadata?.type === 'edit_tokens' && session.metadata?.userId) {
          const quantity = parseInt(session.metadata.quantity) || 1;
          await storage.addPurchasedTokens(session.metadata.userId, quantity);
          console.log(`Credited ${quantity} edit tokens to user ${session.metadata.userId}`);
        }
        if (session.metadata?.type === 'space_booking' && session.metadata?.bookingId) {
          const bookingId = session.metadata.bookingId;
          const booking = await storage.getSpaceBookingById(bookingId);

          await storage.updateSpaceBooking(bookingId, { paymentStatus: "paid", status: "approved" });

          const guestName = session.metadata.guestName || booking?.userName || "Guest";
          const bookingDate = session.metadata.bookingDate || booking?.bookingDate || "";
          const bookingHours = parseInt(session.metadata.bookingHours) || booking?.bookingHours || 1;

          await storage.createSpaceMessage({
            spaceBookingId: bookingId,
            senderId: session.metadata.userId || "system",
            senderName: guestName,
            senderRole: "guest",
            message: `Booked ${session.metadata.spaceName || "this space"} on ${bookingDate} for ${bookingHours} hour${bookingHours > 1 ? "s" : ""}.`,
          });

          await storage.createSpaceMessage({
            spaceBookingId: bookingId,
            senderId: "system",
            senderName: "System",
            senderRole: "system",
            message: "Payment completed — booking confirmed!",
            messageType: "system",
          });

          try {
            await sendSpaceBookingNotification({
              spaceName: session.metadata.spaceName || "a space",
              guestName,
              guestEmail: session.metadata.guestEmail || "",
              message: `Booking confirmed for ${bookingDate}, ${bookingHours} hour${bookingHours > 1 ? "s" : ""}.`,
              hostEmail: session.metadata.hostEmail || "ArmandoRamirezRomero89@gmail.com",
              bookingDate,
              bookingHours,
            });
          } catch (emailErr) {
            console.error("Failed to send booking notification:", emailErr);
          }

          console.log(`Space booking ${bookingId} paid & confirmed, host notified`);
        }
      }
    } catch (err) {
      console.log("Custom webhook processing skipped (signature verification or non-token event):", (err as Error).message);
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }
}
