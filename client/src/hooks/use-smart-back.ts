import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const NAV_DEPTH_KEY = "align_nav_depth";

/**
 * Tracks internal SPA navigation depth and provides a smart back function.
 * - If the user navigated here from another page in the app, goes back in history.
 * - If the user landed directly via URL (new tab / external link), navigates to the fallback route.
 */
export function useSmartBack(fallback: string) {
  const [, navigate] = useLocation();
  const depthOnMount = useRef(getDepth());

  // Increment depth whenever this hook mounts on a new page
  useEffect(() => {
    setDepth(getDepth() + 1);
    return () => {
      // Don't decrement on unmount — history.back() handles that naturally
    };
  }, []);

  return () => {
    if (depthOnMount.current > 0) {
      // User has navigated within the app before reaching this page
      window.history.back();
    } else {
      // Direct landing — go to the logical parent
      navigate(fallback);
    }
  };
}

function getDepth(): number {
  try {
    return parseInt(sessionStorage.getItem(NAV_DEPTH_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function setDepth(n: number) {
  try {
    sessionStorage.setItem(NAV_DEPTH_KEY, String(n));
  } catch {}
}
