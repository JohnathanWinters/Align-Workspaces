import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
  Building2,
  Check,
  X,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SpaceBooking, SpaceMessage } from "@shared/schema";

interface EnrichedBooking extends SpaceBooking {
  spaceName: string;
  spaceType?: string;
  otherPartyName: string;
  latestMessage: { message: string; createdAt: string; senderRole: string; messageType: string } | null;
  unreadCount: number;
  role: "guest" | "host";
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  approved: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, label: "Declined" },
  cancelled: { color: "bg-gray-100 text-gray-500 border-gray-200", icon: Ban, label: "Cancelled" },
};

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  requested: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Payment Requested" },
  pending: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Payment Processing" },
  paid: { color: "bg-green-50 text-green-700 border-green-200", label: "Paid" },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMessagePreview(msg: { message: string; messageType: string; senderRole: string } | null): string {
  if (!msg) return "No messages yet";
  if (msg.messageType === "system") return msg.message;
  if (msg.messageType === "payment_request") {
    try {
      const data = JSON.parse(msg.message);
      return `Payment requested: $${(data.amount / 100).toFixed(2)}`;
    } catch { return "Payment requested"; }
  }
  return msg.message.length > 60 ? msg.message.slice(0, 60) + "..." : msg.message;
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  isLoading,
}: {
  conversations: EnrichedBooking[];
  activeId: string | null;
  onSelect: (b: EnrichedBooking) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="font-serif text-lg text-gray-900 mb-1">No conversations yet</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          When you book a space or receive a booking request, conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100" data-testid="conversation-list">
      {conversations.map((c) => {
        const status = statusConfig[c.status || "pending"];
        const StatusIcon = status.icon;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
              activeId === c.id ? "bg-stone-50 border-l-2 border-gray-900" : ""
            }`}
            data-testid={`conversation-item-${c.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${c.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {c.otherPartyName}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {c.latestMessage ? formatTime(c.latestMessage.createdAt) : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1.5">
                    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded-full border ${
                      c.role === "host"
                        ? "bg-violet-50 text-violet-600 border-violet-200"
                        : "bg-sky-50 text-sky-600 border-sky-200"
                    }`}>
                      {c.role === "host" ? "Hosting" : "Renting"}
                    </span>
                    <span className="truncate">{c.spaceName}</span>
                  </p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs truncate max-w-[70%] ${c.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                    {getMessagePreview(c.latestMessage)}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center font-medium" data-testid={`unread-badge-${c.id}`}>
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${status.color}`}>
                      <StatusIcon className="w-3 h-3 mr-0.5" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PaymentRequestMessage({ message, booking, userId }: { message: SpaceMessage & { messageType?: string }; booking: EnrichedBooking; userId: string }) {
  const { toast } = useToast();
  let data = { amount: 0, description: "" };
  try { data = JSON.parse(message.message); } catch {}

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/space-bookings/${booking.id}/checkout`);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isGuest = booking.userId === userId;
  const isPaid = booking.paymentStatus === "paid";

  return (
    <div className="bg-gradient-to-br from-stone-50 to-amber-50/50 rounded-xl p-4 border border-stone-200 max-w-[280px]">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="w-4 h-4 text-stone-600" />
        <span className="text-xs font-medium text-stone-600">Payment Request</span>
      </div>
      <p className="text-2xl font-serif text-gray-900 mb-1">${(data.amount / 100).toFixed(2)}</p>
      {data.description && <p className="text-xs text-gray-500 mb-3">{data.description}</p>}
      {isPaid ? (
        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Paid
        </div>
      ) : isGuest ? (
        <Button
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
          size="sm"
          className="w-full bg-gray-900 text-white hover:bg-black text-xs"
          data-testid={`button-pay-booking-${booking.id}`}
        >
          {checkoutMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
          Pay Now
        </Button>
      ) : (
        <p className="text-xs text-gray-400">Waiting for payment...</p>
      )}
    </div>
  );
}

function ConversationView({
  booking,
  userId,
  onBack,
}: {
  booking: EnrichedBooking;
  userId: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDesc, setPaymentDesc] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<(SpaceMessage & { messageType?: string })[]>({
    queryKey: ["/api/space-bookings", booking.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/space-bookings/${booking.id}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    fetch(`/api/space-bookings/${booking.id}/read`, { method: "POST", credentials: "include" }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
  }, [booking.id, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      await apiRequest("POST", `/api/space-bookings/${booking.id}/messages`, { message: text });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings", booking.id, "messages"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/space-bookings/${booking.id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings", booking.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
      toast({ title: "Booking updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/space-bookings/${booking.id}/request-payment`, {
        amount: paymentAmount,
        description: paymentDesc,
      });
    },
    onSuccess: () => {
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentDesc("");
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings", booking.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
      toast({ title: "Payment request sent" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  const isHost = booking.role === "host";
  const status = statusConfig[booking.status || "pending"];
  const StatusIcon = status.icon;
  const paymentInfo = booking.paymentStatus ? paymentStatusConfig[booking.paymentStatus] : null;

  return (
    <div className="flex flex-col h-full" data-testid={`conversation-view-${booking.id}`}>
      <div className="border-b border-gray-100 px-4 py-3 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="lg:hidden text-gray-500 hover:text-gray-700"
            data-testid="button-back-to-inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">{booking.otherPartyName}</h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-0.5" />
                {status.label}
              </Badge>
              {paymentInfo && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${paymentInfo.color}`}>
                  {paymentInfo.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {booking.spaceName} · {isHost ? "You're the host" : "You're the guest"}
              {booking.bookingDate && ` · ${booking.bookingDate}`}
              {booking.bookingHours && ` · ${booking.bookingHours}hr${booking.bookingHours > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {isHost && booking.status === "pending" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-gray-600 flex-1">This booking request is awaiting your response.</span>
            <Button
              size="sm"
              onClick={() => statusMutation.mutate("approved")}
              disabled={statusMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3"
              data-testid="button-approve-booking"
            >
              <Check className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate("rejected")}
              disabled={statusMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-3"
              data-testid="button-reject-booking"
            >
              <X className="w-3 h-3 mr-1" />
              Decline
            </Button>
          </div>
        )}

        {isHost && booking.status === "approved" && !booking.paymentAmount && booking.paymentStatus !== "paid" && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {!showPaymentForm ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPaymentForm(true)}
                className="text-xs h-7"
                data-testid="button-show-payment-form"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                Request Payment
              </Button>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 mb-0.5 block">Amount ($)</label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                    data-testid="input-payment-amount"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 mb-0.5 block">Description</label>
                  <Input
                    value={paymentDesc}
                    onChange={(e) => setPaymentDesc(e.target.value)}
                    placeholder="e.g. 4 hours on March 15"
                    className="h-8 text-sm"
                    data-testid="input-payment-description"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => paymentMutation.mutate()}
                  disabled={!paymentAmount || paymentMutation.isPending}
                  className="bg-gray-900 text-white hover:bg-black h-8 text-xs"
                  data-testid="button-send-payment-request"
                >
                  {paymentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(false)} className="h-8 text-xs text-gray-400">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#faf9f7]">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === userId;
            const isSystem = msg.messageType === "system";
            const isPayment = msg.messageType === "payment_request";

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center" data-testid={`message-system-${msg.id}`}>
                  <div className="bg-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    {msg.message}
                  </div>
                </div>
              );
            }

            if (isPayment) {
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid={`message-payment-${msg.id}`}>
                  <PaymentRequestMessage message={msg} booking={booking} userId={userId} />
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
                <div className={`max-w-[75%] ${isOwn
                  ? "bg-gray-900 text-white rounded-2xl rounded-br-md"
                  : "bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100"
                } px-4 py-2.5 shadow-sm`}>
                  {!isOwn && (
                    <p className="text-[10px] font-medium text-gray-400 mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-gray-400" : "text-gray-300"}`}>
                    {new Date(msg.createdAt!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-100 px-4 py-3 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border-gray-200 text-sm"
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            size="sm"
            className="bg-gray-900 text-white hover:bg-black h-9 w-9 p-0"
            data-testid="button-send-message"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PortalMessagesSection({ userId }: { userId: string }) {
  const [activeBooking, setActiveBooking] = useState<EnrichedBooking | null>(null);

  const { data: bookingsData, isLoading } = useQuery<{ guestBookings: EnrichedBooking[]; hostBookings: EnrichedBooking[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const allConversations = [
    ...(bookingsData?.guestBookings || []),
    ...(bookingsData?.hostBookings || []),
  ].sort((a, b) => {
    const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.createdAt!).getTime();
    const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.createdAt!).getTime();
    return bTime - aTime;
  });

  const totalUnread = allConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const currentBooking = activeBooking
    ? allConversations.find((c) => c.id === activeBooking.id) || activeBooking
    : null;

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px]" data-testid="messages-section">
      <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden flex">
        <div className={`w-full lg:w-[340px] lg:border-r border-gray-100 flex-shrink-0 overflow-y-auto ${
          activeBooking ? "hidden lg:block" : ""
        }`}>
          <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-gray-900">Messages</h3>
              {totalUnread > 0 && (
                <span className="bg-gray-900 text-white text-xs rounded-full px-2 py-0.5 font-medium" data-testid="total-unread-badge">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          <ConversationList
            conversations={allConversations}
            activeId={activeBooking?.id || null}
            onSelect={setActiveBooking}
            isLoading={isLoading}
          />
        </div>

        <div className={`flex-1 flex flex-col ${!activeBooking ? "hidden lg:flex" : ""}`}>
          {currentBooking ? (
            <ConversationView
              booking={currentBooking}
              userId={userId}
              onBack={() => setActiveBooking(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useUnreadCount() {
  const { data } = useQuery<{ guestBookings: EnrichedBooking[]; hostBookings: EnrichedBooking[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const all = [...(data?.guestBookings || []), ...(data?.hostBookings || [])];
  return all.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}
