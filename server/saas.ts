import type Stripe from 'stripe';
import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import type { User, HostSubscription } from '@shared/schema';

export type SaasTier = 'starter' | 'growth' | 'studio';

export const TIER_LIMITS: Record<SaasTier, {
  workspaces: number;              // -1 = unlimited
  activeRenters: number;           // -1 = unlimited
  teamSeats: number;
  customBranding: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}> = {
  starter: {
    workspaces: 1,
    activeRenters: 5,
    teamSeats: 1,
    customBranding: false,
    customDomain: false,
    whiteLabel: false,
    apiAccess: false,
  },
  growth: {
    workspaces: 3,
    activeRenters: -1,
    teamSeats: 3,
    customBranding: true,
    customDomain: true,
    whiteLabel: false,
    apiAccess: false,
  },
  studio: {
    workspaces: -1,
    activeRenters: -1,
    teamSeats: -1,
    customBranding: true,
    customDomain: true,
    whiteLabel: true,
    apiAccess: true,
  },
};

const TRIAL_DAYS = 14;

function getPriceIdForTier(tier: SaasTier): string {
  const envKey = `STRIPE_PRICE_SAAS_${tier.toUpperCase()}`;
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} is not configured`);
  }
  return priceId;
}

function getTierFromPriceId(priceId: string): SaasTier | null {
  if (priceId === process.env.STRIPE_PRICE_SAAS_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_SAAS_GROWTH) return 'growth';
  if (priceId === process.env.STRIPE_PRICE_SAAS_STUDIO) return 'studio';
  return null;
}

async function getOrCreateSaasCustomer(stripe: Stripe, user: User): Promise<string> {
  const existing = await storage.getHostSubscriptionByUserId(user.id);
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  if (!user.email) {
    throw new Error('User email required to create Stripe customer');
  }

  const matches = await stripe.customers.list({ email: user.email, limit: 1 });
  if (matches.data.length > 0) {
    return matches.data[0].id;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
    metadata: { userId: user.id, context: 'saas' },
  });
  return customer.id;
}

export async function createSubscriptionCheckout(
  user: User,
  tier: SaasTier,
  opts: { successUrl: string; cancelUrl: string }
): Promise<string> {
  const existing = await storage.getHostSubscriptionByUserId(user.id);
  if (existing && ['active', 'trialing', 'past_due'].includes(existing.status)) {
    throw new Error('User already has an active subscription. Use the customer portal to change plans.');
  }

  const stripe = await getUncachableStripeClient();
  const priceId = getPriceIdForTier(tier);
  const customerId = await getOrCreateSaasCustomer(stripe, user);

  const hasUsedTrial = await hasEverHadSaasSubscription(user.id, customerId, stripe);

  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: { userId: user.id, tier, context: 'saas' },
  };
  if (!hasUsedTrial) {
    subscriptionData.trial_period_days = TRIAL_DAYS;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: subscriptionData,
    payment_method_collection: 'always',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { userId: user.id, tier, type: 'saas_subscription' },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }
  return session.url;
}

/**
 * Returns true if this user (by app userId OR Stripe customer email) has ever held
 * a SaaS subscription. Used to prevent trial-abuse via cancel-and-resubscribe.
 *
 * Checks both:
 *   1. Our DB — any host_subscriptions row for this userId, regardless of status.
 *   2. Stripe — any prior subscription on the customer with our SaaS context.
 *      Catches edge cases where the DB row was deleted but Stripe still remembers.
 */
async function hasEverHadSaasSubscription(
  userId: string,
  stripeCustomerId: string,
  stripe: Stripe
): Promise<boolean> {
  const dbSub = await storage.getHostSubscriptionByUserId(userId);
  if (dbSub) return true;

  try {
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 20,
    });
    return subs.data.some(s => s.metadata?.context === 'saas');
  } catch (err) {
    console.warn('Trial eligibility check (Stripe lookup) failed; defaulting to allow trial.', err);
    return false;
  }
}

export async function isUserTrialEligible(user: User): Promise<boolean> {
  const stripe = await getUncachableStripeClient();
  const customerId = await getOrCreateSaasCustomer(stripe, user);
  return !(await hasEverHadSaasSubscription(user.id, customerId, stripe));
}

export async function createCustomerPortalSession(
  user: User,
  returnUrl: string
): Promise<string> {
  const sub = await storage.getHostSubscriptionByUserId(user.id);
  if (!sub?.stripeCustomerId) {
    throw new Error('No subscription found for this user');
  }
  const stripe = await getUncachableStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

function toDate(unixSeconds: number | null | undefined): Date | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000);
}

function tierFromSubscription(sub: Stripe.Subscription): SaasTier | null {
  const item = sub.items.data[0];
  if (!item) return null;
  return getTierFromPriceId(item.price.id);
}

async function upsertSubscriptionRecord(sub: Stripe.Subscription): Promise<void> {
  const userId = (sub.metadata?.userId) || null;
  if (!userId) {
    console.warn(`SaaS webhook: subscription ${sub.id} has no userId metadata — skipping.`);
    return;
  }

  const tier = tierFromSubscription(sub);
  if (!tier) {
    console.warn(`SaaS webhook: subscription ${sub.id} has unrecognized price ID.`);
    return;
  }

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const existing = await storage.getHostSubscriptionByStripeSubscriptionId(sub.id);

  const record = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    tier,
    status: sub.status,
    currentPeriodStart: toDate((sub as any).current_period_start),
    currentPeriodEnd: toDate((sub as any).current_period_end),
    trialEndsAt: toDate(sub.trial_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
  };

  if (existing) {
    await storage.updateHostSubscription(existing.id, record);
  } else {
    await storage.createHostSubscription(record);
  }
}

/**
 * Returns the user's currently-enforceable subscription (trialing, active, or past_due),
 * or null if they don't have one.
 */
export async function getActiveSubscription(userId: string): Promise<HostSubscription | null> {
  const sub = await storage.getHostSubscriptionByUserId(userId);
  if (!sub) return null;
  if (!['trialing', 'active', 'past_due'].includes(sub.status)) return null;
  return sub;
}

/**
 * Checks whether the user can mark another workspace as private based on their tier.
 * Throws with a descriptive error if they cannot. Returns silently if allowed.
 */
export async function assertCanSetPrivate(userId: string, excludeSpaceId?: string): Promise<void> {
  const sub = await getActiveSubscription(userId);
  if (!sub) {
    const err: any = new Error('An active subscription is required to enable private workspaces.');
    err.statusCode = 402;
    err.code = 'NO_SUBSCRIPTION';
    throw err;
  }

  const tier = sub.tier as SaasTier;
  const limits = TIER_LIMITS[tier];
  if (!limits) {
    throw new Error(`Unknown subscription tier: ${tier}`);
  }

  if (limits.workspaces === -1) return;

  const userSpaces = await storage.getSpacesByUser(userId);
  const privateCount = userSpaces.filter(s => s.isPrivate === 1 && s.id !== excludeSpaceId).length;

  if (privateCount >= limits.workspaces) {
    const err: any = new Error(
      `Your ${tier} plan allows ${limits.workspaces} private workspace${limits.workspaces === 1 ? '' : 's'}. Upgrade to enable more.`
    );
    err.statusCode = 402;
    err.code = 'TIER_LIMIT_REACHED';
    throw err;
  }
}

export async function handleSaasWebhookEvent(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.metadata?.context !== 'saas') return false;
      await upsertSubscriptionRecord(sub);
      return true;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.metadata?.context !== 'saas') return false;
      const existing = await storage.getHostSubscriptionByStripeSubscriptionId(sub.id);
      if (!existing) return true;
      await upsertSubscriptionRecord(sub);
      return true;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription;
      if (!subId || typeof subId !== 'string') return false;
      const existing = await storage.getHostSubscriptionByStripeSubscriptionId(subId);
      if (!existing) return false;
      await storage.updateHostSubscription(existing.id, { status: 'past_due' });
      return true;
    }
    default:
      return false;
  }
}
