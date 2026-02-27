import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

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
      }
    } catch (err) {
      console.log("Custom webhook processing skipped (signature verification or non-token event):", (err as Error).message);
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }
}
