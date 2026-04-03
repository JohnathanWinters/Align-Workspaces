import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, ChevronDown, LifeBuoy, FileText } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface UserIndicatorProps {
  variant?: "light" | "dark";
}

export function UserIndicator({ variant = "dark" }: UserIndicatorProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    const isLight = variant === "light";
    return (
      <Link
        href="/portal"
        className={`flex items-center gap-2 text-xs tracking-wide font-semibold px-4 py-2 rounded-full transition-all duration-200 ${
          isLight
            ? "border border-white/25 text-[#d4c4a8] hover:text-white hover:border-white/50 hover:bg-white/10"
            : "border border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50"
        }`}
        data-testid="link-sign-in"
      >
        <User className="w-3.5 h-3.5" />
        Sign In
      </Link>
    );
  }

  const isLight = variant === "light";

  return (
    <div ref={ref} className="relative">
      {isLight ? (
        <button
          onClick={() => setOpen(!open)}
          data-testid="button-user-indicator"
          className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-semibold transition-colors duration-300 px-3 py-2"
          aria-label="Account menu"
          style={{ color: "#d4c4a8" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#f0e6d0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#d4c4a8"; }}
        >
          <User className="w-4 h-4" />
          {user.firstName || "Account"}
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          data-testid="button-user-indicator"
          className="flex items-center gap-1.5 text-foreground/40 hover:text-foreground/70 transition-colors"
          aria-label="Account menu"
        >
          <div className="w-7 h-7 rounded-full border border-foreground/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 bg-white border border-stone-200 rounded-xl shadow-lg py-3 px-4 min-w-[220px] z-[9999] ${isLight ? "left-0" : "right-0"}`}
          >
            <div className="mb-3">
              <p className="text-sm font-medium text-stone-900 truncate" data-testid="text-user-name">
                {user.firstName || "User"}
              </p>
              {user.email && (
                <p className="text-xs text-stone-400 truncate mt-0.5" data-testid="text-user-email">
                  {user.email}
                </p>
              )}
            </div>
            <div className="border-t border-stone-100 pt-2 flex flex-col gap-1">
              <Link
                href="/portal"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg px-2 py-2 transition-colors"
                data-testid="link-user-portal"
              >
                <User className="w-3.5 h-3.5" />
                Client Portal
              </Link>
              <Link
                href="/support"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg px-2 py-2 transition-colors"
                data-testid="link-user-support"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                Support
              </Link>
              <Link
                href="/terms"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg px-2 py-2 transition-colors"
                data-testid="link-user-terms"
              >
                <FileText className="w-3.5 h-3.5" />
                Terms of Service
              </Link>
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg px-2 py-2 transition-colors w-full text-left"
                data-testid="button-user-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
