import webpush from "web-push";
import { storage } from "./storage";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:armando@alignworkspaces.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  const subs = await storage.getPushSubscriptionsByUser(userId);
  await sendToSubscriptions(subs, payload);
}

export async function sendPushToRole(role: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  const subs = await storage.getPushSubscriptionsByRole(role);
  await sendToSubscriptions(subs, payload);
}

async function sendToSubscriptions(subs: { endpoint: string; p256dh: string; auth: string }[], payload: { title: string; body: string; url?: string; tag?: string }) {
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
