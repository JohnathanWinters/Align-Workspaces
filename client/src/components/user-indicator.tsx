import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";
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

  if (isLoading || !isAuthenticated || !user) return null;

  const initials = user.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user.email
      ? user.email.charAt(0).toUpperCase()
      : "?";

  const isLight = variant === "light";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        data-testid="button-user-indicator"
        className="flex items-center"
        aria-label="Account menu"
      >
        <Avatar className="w-7 h-7 ring-1 ring-offset-1 ring-stone-200/40 ring-offset-transparent">
          {user.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
          )}
          <AvatarFallback
            className={
              isLight
                ? "bg-white/20 text-white text-xs font-medium"
                : "bg-stone-100 text-stone-500 text-xs font-medium"
            }
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 bg-white border border-stone-200 rounded-xl shadow-lg py-3 px-4 min-w-[220px] z-[9999]"
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
