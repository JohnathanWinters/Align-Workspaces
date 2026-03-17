import { useEffect, useRef } from "react";

function getSessionId(): string {
  let sid = sessionStorage.getItem("_align_sid");
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("_align_sid", sid);
  }
  return sid;
}

export function trackEvent(
  eventType: string,
  metadata: Record<string, any> = {},
  userId?: string
) {
  const sessionId = getSessionId();
  const path = window.location.pathname;
  fetch("/api/track/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId, eventType, metadata, path }),
    keepalive: true,
  }).catch(() => {});
}

export function useAnalytics(userId?: string) {
  const startTime = useRef(Date.now());
  const lastPath = useRef("");
  const lastViewId = useRef("");
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    const sessionId = getSessionId();

    function sendDuration() {
      if (lastPath.current && lastViewId.current) {
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        if (duration > 0) {
          const blob = new Blob(
            [JSON.stringify({ viewId: lastViewId.current, duration })],
            { type: "application/json" }
          );
          navigator.sendBeacon("/api/track/duration", blob);
        }
      }
    }

    function trackPage() {
      const path = window.location.pathname;

      if (path.startsWith("/admin") || path.startsWith("/api/")) return;
      if (path === lastPath.current) return;

      sendDuration();

      lastPath.current = path;
      startTime.current = Date.now();
      const viewId = Math.random().toString(36).substring(2);
      lastViewId.current = viewId;

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userId: userIdRef.current || null,
          viewId,
          path,
          referrer: document.referrer || null,
        }),
        keepalive: true,
      }).catch(() => {});
    }

    trackPage();

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setTimeout(trackPage, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setTimeout(trackPage, 0);
    };

    window.addEventListener("popstate", trackPage);
    window.addEventListener("beforeunload", sendDuration);

    return () => {
      window.removeEventListener("popstate", trackPage);
      window.removeEventListener("beforeunload", sendDuration);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
}
