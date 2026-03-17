import webpush from "web-push";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { sendUnreadMessageEmail } from "./gmail";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:armando@alignworkspaces.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

type PushPayload = { title: string; body: string; url?: string; tag?: string };

async function getUserNotifPrefs(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const prefs = (user?.notificationPreferences as any) || {};
  return {
    pushMessages: prefs.pushMessages !== false,
    pushBookings: prefs.pushBookings !== false,
    emailMessages: prefs.emailMessages !== false,
    emailBookings: prefs.emailBookings !== false,
    email: user?.email || null,
    firstName: user?.firstName || null,
  };
}

export async function sendPushToUser(userId: string, payload: PushPayload, type: "message" | "booking" = "message") {
  const prefs = await getUserNotifPrefs(userId);

  const pushAllowed = type === "booking" ? prefs.pushBookings : prefs.pushMessages;
  if (pushAllowed) {
    const subs = await storage.getPushSubscriptionsByUser(userId);
    await sendToSubscriptions(subs, payload);
  }

  // Email fallback: if email notifications enabled and user has email
  const emailAllowed = type === "booking" ? prefs.emailBookings : prefs.emailMessages;
  if (emailAllowed && prefs.email) {
    scheduleEmailFallback(userId, prefs.email, prefs.firstName, payload, type);
  }
}

export async function sendPushToRole(role: string, payload: PushPayload) {
  const subs = await storage.getPushSubscriptionsByRole(role);
  await sendToSubscriptions(subs, payload);
}

async function sendToSubscriptions(subs: { endpoint: string; p256dh: string; auth: string }[], payload: PushPayload) {
  const data = JSON.stringify(payload);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        data
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await storage.deletePushSubscription(sub.endpoint).catch(() => {});
      }
    }
  }
}

// Email fallback: send email if message goes unread after 10 minutes
const pendingEmails = new Map<string, NodeJS.Timeout>();

function scheduleEmailFallback(userId: string, email: string, firstName: string | null, payload: PushPayload, type: string) {
  const key = `${userId}-${payload.tag || payload.title}`;
  // Clear any existing timer for this conversation
  if (pendingEmails.has(key)) {
    clearTimeout(pendingEmails.get(key)!);
  }

  const timer = setTimeout(async () => {
    pendingEmails.delete(key);
    try {
      await sendUnreadMessageEmail({
        to: email,
        recipientName: firstName || "there",
        subject: payload.title,
        previewText: payload.body,
        url: payload.url || "/portal?tab=messages",
      });
    } catch (err) {
      console.error("Failed to send email fallback:", err);
    }
  }, 10 * 60 * 1000); // 10 minutes

  pendingEmails.set(key, timer);
}

// Cancel email fallback when user reads messages (call this from read routes)
export function cancelEmailFallback(userId: string, tag?: string) {
  const keys = Array.from(pendingEmails.keys());
  for (const key of keys) {
    if (key.startsWith(userId + "-")) {
      if (!tag || key.includes(tag)) {
        clearTimeout(pendingEmails.get(key)!);
        pendingEmails.delete(key);
      }
    }
  }
}
