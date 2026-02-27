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
  const [status, setStatus] = useState<PushStatus>("loading");
  const storageKey = `push_subscribed_${role}`;

  const checkStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    const perm = Notification.permission;
    if (perm === "denied") {
      setStatus("denied");
      return;
    }

    if (perm === "granted") {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            localStorage.setItem(storageKey, "true");
            setStatus("subscribed");
            return;
          }
        }
      } catch {}

      if (localStorage.getItem(storageKey) === "true") {
        setStatus("subscribed");
        return;
      }
    }

    setStatus("prompt");
  }, [storageKey]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const subscribe = useCallback(async () => {
    try {
      setStatus("loading");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return false;
      }

      const vapidRes = await fetch("/api/push/vapid-key");
      const { key } = await vapidRes.json();
      if (!key) {
        setStatus("prompt");
        return false;
      }

      let subscription: PushSubscription;
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      } catch (pushErr) {
        console.error("PushManager.subscribe failed:", pushErr);
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          subscription = existing;
        } else {
          setStatus("prompt");
          return false;
        }
      }

      const endpoint = role === "admin" ? "/api/admin/push/subscribe" : "/api/push/subscribe";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (role === "admin") {
        const token = sessionStorage.getItem("adminToken") || localStorage.getItem("adminToken");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) {
        console.error("Push subscribe API failed:", res.status, await res.text().catch(() => ""));
      }

      localStorage.setItem(storageKey, "true");
      setStatus("subscribed");
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      localStorage.setItem(storageKey, "true");
      if (Notification.permission === "granted") {
        setStatus("subscribed");
        return true;
      }
      setStatus("prompt");
      return false;
    }
  }, [role, storageKey]);

  return { status, subscribe };
}
