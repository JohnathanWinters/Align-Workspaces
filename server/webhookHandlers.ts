import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendSpaceBookingNotification } from './gmail';
import { createBookingCalendarEvent } from './googleCalendar';
import { sendPushToUser } from './pushNotifications';

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

          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
          // With destination charges, host is paid directly by Stripe at charge time
          const hasTransfer = !!(session as any).transfer_data?.destination;
          await storage.updateSpaceBooking(bookingId, {
            paymentStatus: "paid",
            status: "approved",
            ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
            ...(hasTransfer ? { payoutStatus: "paid" } : {}),
            updatedAt: new Date(),
          });

          const guestName = session.metadata.guestName || booking?.userName || "Guest";
          const bookingDate = session.metadata.bookingDate || booking?.bookingDate || "";
          const bookingStartTime = session.metadata.bookingStartTime || booking?.bookingStartTime || "";
          const bookingHours = parseInt(session.metadata.bookingHours) || booking?.bookingHours || 1;

          const formatTimeStr = (t: string) => {
            if (!t) return "";
            const [h, m] = t.split(":").map(Number);
            const period = h >= 12 ? "PM" : "AM";
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
          };
          const timeStr = bookingStartTime ? ` at ${formatTimeStr(bookingStartTime)}` : "";

          let dateDisplay = bookingDate;
          try {
            const d = new Date(bookingDate + "T12:00:00");
            dateDisplay = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          } catch {}

          await storage.createSpaceMessage({
            spaceBookingId: bookingId,
            senderId: session.metadata.userId || "system",
            senderName: guestName,
            senderRole: "guest",
            message: `Booked ${session.metadata.spaceName || "this space"} — ${dateDisplay}${timeStr}, ${bookingHours} hour${bookingHours > 1 ? "s" : ""}.`,
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
              hostEmail: session.metadata.hostEmail || "armando@alignworkspaces.com",
              bookingDate,
              bookingHours,
            });
          } catch (emailErr) {
            console.error("Failed to send booking notification:", emailErr);
          }

          try {
            const space = await storage.getSpaceById(booking?.spaceId || session.metadata.spaceId);
            const calendarEventId = await createBookingCalendarEvent({
              spaceName: session.metadata.spaceName || space?.name || "Space",
              guestName,
              guestEmail: session.metadata.guestEmail || booking?.userEmail || "",
              hostEmail: session.metadata.hostEmail || "armando@alignworkspaces.com",
              bookingDate,
              bookingStartTime,
              bookingHours,
              spaceAddress: space?.address || "",
              bookingId,
            });
            if (calendarEventId) {
              await storage.updateSpaceBooking(bookingId, { googleCalendarEventId: calendarEventId });
            }
          } catch (calErr) {
            console.error("Failed to create calendar event:", calErr);
          }

          // Push notification to host about new paid booking
          try {
            const space = await storage.getSpaceById(booking?.spaceId || session.metadata.spaceId);
            if (space?.userId) {
              sendPushToUser(space.userId, {
                title: `New booking: ${space.name}`,
                body: `${guestName} booked ${dateDisplay}${timeStr}, ${bookingHours} hour${bookingHours > 1 ? "s" : ""}`,
                url: "/portal?tab=messages",
                tag: `booking-${bookingId}`,
              });
            }
          } catch (pushErr) {
            console.error("Failed to send booking push:", pushErr);
          }

          console.log(`Space booking ${bookingId} paid & confirmed, host notified`);
        }
      }
    } catch (err) {
      console.log("Custom webhook processing skipped (signature verification or non-token event):", (err as Error).message);
    }

  }
}
