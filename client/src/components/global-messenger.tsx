import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  ConversationList,
  ConversationView,
  DirectConversationView,
  AdminConversationView,
  type UnifiedConversation,
  type EnrichedBooking,
  type EnrichedDirectConversation,
  type EnrichedAdminConversation,
} from "./portal-messages";

function MessengerContent({
  userId,
  isExpanded,
  onExpandToggle,
}: {
  userId: string;
  isExpanded: boolean;
  onExpandToggle: () => void;
}) {
  const [activeConversation, setActiveConversation] = useState<UnifiedConversation | null>(null);

  const { data: bookingsData, isLoading } = useQuery<{
    guestBookings: EnrichedBooking[];
    hostBookings: EnrichedBooking[];
    directConversations?: EnrichedDirectConversation[];
  }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: adminConvo } = useQuery<EnrichedAdminConversation | null>({
    queryKey: ["/api/admin-conversations/mine"],
    queryFn: async () => {
      const res = await fetch("/api/admin-conversations/mine", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 10000,
  });

  const allConversations: UnifiedConversation[] = [
    ...(adminConvo ? [{ ...adminConvo, _key: `admin-${adminConvo.id}` }] : []),
    ...(bookingsData?.guestBookings || []).map((b) => ({ ...b, type: "booking" as const, _key: `${b.id}-guest` })),
    ...(bookingsData?.hostBookings || []).map((b) => ({ ...b, type: "booking" as const, _key: `${b.id}-host` })),
    ...(bookingsData?.directConversations || []).map((c) => ({ ...c, _key: c.id })),
  ].sort((a, b) => {
    const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.createdAt!).getTime();
    const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.createdAt!).getTime();
    return bTime - aTime;
  });

  const currentConversation = activeConversation
    ? allConversations.find((c) => (c as any)._key === (activeConversation as any)?._key) || allConversations.find((c) => c.id === activeConversation.id) || activeConversation
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0 rounded-t-2xl">
        {activeConversation ? (
          <button
            onClick={() => setActiveConversation(null)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Back to all messages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Messages
          </button>
        ) : (
          <h2 className="font-serif text-base text-gray-900">Messages</h2>
        )}
        <button
          onClick={onExpandToggle}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isExpanded ? "Minimize messenger" : "Expand messenger"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {!activeConversation ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <ConversationList
                conversations={allConversations}
                activeId={null}
                onSelect={setActiveConversation}
                isLoading={isLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full messenger-conversation-view"
            >
              {currentConversation?.type === "admin" ? (
                <AdminConversationView
                  conversation={currentConversation}
                  userId={userId}
                  onBack={() => setActiveConversation(null)}
                />
              ) : currentConversation?.type === "direct" ? (
                <DirectConversationView
                  conversation={currentConversation}
                  userId={userId}
                  onBack={() => setActiveConversation(null)}
                />
              ) : currentConversation ? (
                <ConversationView
                  booking={currentConversation as EnrichedBooking & { type: "booking" }}
                  userId={userId}
                  onBack={() => setActiveConversation(null)}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Override: always show back buttons and hide the redundant conversation header back button */}
      <style>{`
        .messenger-conversation-view [data-testid="button-back-to-inbox"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default function GlobalMessenger() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get unread count from the shared React Query cache
  const { data: bookingsData } = useQuery<{
    guestBookings: EnrichedBooking[];
    hostBookings: EnrichedBooking[];
    directConversations?: EnrichedDirectConversation[];
  }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15000,
    enabled: isAuthenticated,
  });

  const { data: adminConvo } = useQuery<EnrichedAdminConversation | null>({
    queryKey: ["/api/admin-conversations/mine"],
    queryFn: async () => {
      const res = await fetch("/api/admin-conversations/mine", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 15000,
    enabled: isAuthenticated,
  });

  const totalUnread = [
    ...(bookingsData?.guestBookings || []),
    ...(bookingsData?.hostBookings || []),
    ...(bookingsData?.directConversations || []),
    ...(adminConvo ? [adminConvo] : []),
  ].reduce((sum, c) => sum + ((c as any).unreadCount || 0), 0);

  // Hide on certain pages
  const [isHiddenPage, setIsHiddenPage] = useState(false);
  useEffect(() => {
    const check = () => {
      const path = window.location.pathname;
      const tab = new URLSearchParams(window.location.search).get("tab");
      const hidden =
        (path === "/portal" && tab === "messages") ||
        path === "/" ||
        path === "/portrait-builder" ||
        path === "/workspaces" ||
        path.startsWith("/featured");
      setIsHiddenPage(hidden);
    };
    check();
    window.addEventListener("popstate", check);
    const interval = setInterval(check, 500);
    return () => {
      window.removeEventListener("popstate", check);
      clearInterval(interval);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Don't render when not authenticated
  if (authLoading || !isAuthenticated || !user) return null;

  // Don't render on public/browsing pages or portal messages tab
  if (isHiddenPage) return null;

  return (
    <>
      {/* Floating Pill Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-[9998] h-11 rounded-full bg-stone-900 text-white shadow-lg hover:bg-stone-800 hover:shadow-xl transition-all flex items-center gap-2 px-4"
        aria-label={isOpen ? "Close messages" : `Open messages${totalUnread > 0 ? ` (${totalUnread} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-controls="global-messenger-panel"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Close</span>
            </motion.div>
          ) : (
            <motion.div
              key="message"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Messages</span>
              {totalUnread > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Messenger Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            id="global-messenger-panel"
            role="dialog"
            aria-label="Messages"
            aria-modal="false"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${
              isExpanded
                ? "bottom-0 right-0 w-full h-full sm:bottom-5 sm:right-5 sm:w-[480px] sm:h-[85vh] sm:max-h-[800px] sm:rounded-2xl rounded-none"
                : "bottom-24 right-5 w-[calc(100vw-40px)] sm:w-[380px] h-[min(70vh,580px)]"
            }`}
            style={{
              maxHeight: isExpanded ? undefined : "calc(100vh - 120px)",
            }}
          >
            <MessengerContent
              userId={user.id}
              isExpanded={isExpanded}
              onExpandToggle={handleExpandToggle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
