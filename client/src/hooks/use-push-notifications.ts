import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushStatus = "unsupported" | "denied" | "prompt" | "subscribed" | "loading";

export function usePushNotifications(role: "client" | "admin" = "client") {
  const storageKey = `push_enabled_${role}`;

  const getInitialStatus = (): PushStatus => {
    if (typeof window === "undefined") return "loading";
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
    if (typeof Notification !== "undefined" && Notification.permission === "denied") return "denied";
    if (localStorage.getItem(storageKey) === "true") return "subscribed";
    return "prompt";
  };

  const [status, setStatus] = useState<PushStatus>(getInitialStatus);

  useEffect(() => {
    setStatus(getInitialStatus());
  }, [storageKey]);

  const subscribe = useCallback(async () => {
    localStorage.setItem(storageKey, "true");
    setStatus("subscribed");

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return true;
      }

      const vapidRes = await fetch("/api/push/vapid-key");
      const { key } = await vapidRes.json();
      if (!key) return true;

      let subscription: PushSubscription | null = null;
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      } catch {
        subscription = await reg.pushManager.getSubscription();
      }

      if (subscription) {
        const endpoint = role === "admin" ? "/api/admin/push/subscribe" : "/api/push/subscribe";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (role === "admin") {
          const token = sessionStorage.getItem("adminToken") || localStorage.getItem("adminToken");
          if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      }

      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      return true;
    }
  }, [role, storageKey]);

  return { status, subscribe };
}
