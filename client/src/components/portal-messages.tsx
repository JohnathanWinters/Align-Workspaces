import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
  CalendarDays,
  RefreshCw,
  CalendarPlus,
  Bell,
  BellRing,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import {
  type WeekSchedule,
  getDayOfWeek,
  getAvailableTimeSlots,
  getMaxHoursFromSlot,
  formatTime,
} from "./availability-schedule-editor";
import type { SpaceBooking, SpaceMessage, DirectMessage } from "@shared/schema";

interface EnrichedBooking extends SpaceBooking {
  spaceName: string;
  spaceType?: string;
  otherPartyName: string;
  latestMessage: { message: string; createdAt: string; senderRole: string; messageType: string } | null;
  unreadCount: number;
  role: "guest" | "host";
  spaceSchedule?: string;
  spaceBufferMinutes?: number;
}

interface EnrichedDirectConversation {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceSlug: string;
  guestId: string;
  hostId: string;
  otherPartyName: string;
  latestMessage: { message: string; createdAt: string; senderRole: string } | null;
  unreadCount: number;
  role: "guest" | "host";
  createdAt: string;
  type: "direct";
}

type UnifiedConversation =
  | (EnrichedBooking & { type: "booking" })
  | EnrichedDirectConversation;

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  awaiting_payment: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Awaiting Payment" },
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  approved: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Confirmed" },
  rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, label: "Declined" },
  cancelled: { color: "bg-gray-100 text-gray-500 border-gray-200", icon: Ban, label: "Cancelled" },
  completed: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Completed" },
};

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  requested: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Payment Requested" },
  pending: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Payment Processing" },
  paid: { color: "bg-green-50 text-green-700 border-green-200", label: "Paid" },
};

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMessagePreview(msg: { message: string; messageType?: string; senderRole: string } | null): string {
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
  conversations: UnifiedConversation[];
  activeId: string | null;
  onSelect: (c: UnifiedConversation) => void;
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
          When you book a space or message a host, conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100" data-testid="conversation-list">
      {conversations.map((c) => {
        const isDirect = c.type === "direct";
        const status = isDirect ? null : (statusConfig[(c as EnrichedBooking).status || "pending"] || statusConfig.pending);
        const StatusIcon = status?.icon;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
              activeId === c.id ? "bg-stone-50 border-l-2 border-gray-900" : ""
            }`}
            data-testid={`conversation-item-${c.id}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDirect ? "bg-amber-50" : "bg-gray-100"}`}>
                {isDirect ? <MessageCircle className="w-4 h-4 text-amber-600" /> : <Building2 className="w-4 h-4 text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-sm truncate ${c.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {c.otherPartyName}
                    </span>
                    <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0 rounded-full border flex-shrink-0 ${
                      isDirect
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : c.role === "host"
                          ? "bg-violet-50 text-violet-600 border-violet-200"
                          : "bg-sky-50 text-sky-600 border-sky-200"
                    }`}>
                      {isDirect ? "Inquiry" : c.role === "host" ? "Hosting" : "Renting"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {c.latestMessage ? formatRelativeTime(c.latestMessage.createdAt) : ""}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{c.spaceName}</p>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {getMessagePreview(c.latestMessage)}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.unreadCount > 0 && (
                      <span className="w-4.5 h-4.5 min-w-[18px] rounded-full bg-gray-900 text-white text-[9px] flex items-center justify-center font-bold" data-testid={`unread-badge-${c.id}`}>
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                    {isDirect ? null : status && StatusIcon ? (
                      <span className={`text-[10px] font-medium flex items-center gap-0.5 ${status.color.includes("emerald") ? "text-emerald-600" : status.color.includes("blue") ? "text-blue-600" : status.color.includes("amber") ? "text-amber-600" : "text-gray-500"}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    ) : null}
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
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleHours, setRescheduleHours] = useState(booking.bookingHours || 1);
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

  const spaceSchedule: import("./availability-schedule-editor").WeekSchedule | null = (() => {
    try { return booking.spaceSchedule ? JSON.parse(booking.spaceSchedule) : null; } catch { return null; }
  })();
  const bufferMins = booking.spaceBufferMinutes ?? 15;

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      await apiRequest("POST", `/api/space-bookings/${booking.id}/messages`, { message: text });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings", booking.id, "messages"] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/space-bookings/${booking.id}/reschedule`, {
        newDate: rescheduleDate,
        newStartTime: rescheduleTime,
        newHours: rescheduleHours,
      });
    },
    onSuccess: () => {
      setShowReschedule(false);
      setRescheduleDate("");
      setRescheduleTime("");
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings", booking.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
      toast({ title: "Reschedule request sent" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rescheduleRespondMutation = useMutation({
    mutationFn: async ({ messageId, action }: { messageId: string; action: "accept" | "decline" }) => {
      await apiRequest("POST", `/api/space-bookings/${booking.id}/reschedule-respond`, { messageId, action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings", booking.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
      toast({ title: "Reschedule response sent" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
  const status = statusConfig[booking.status || "pending"] || statusConfig.pending;
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
            </p>
          </div>
        </div>

        {booking.bookingDate && (
          <>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="bg-stone-50 rounded-lg p-3 flex items-center gap-3" data-testid="booking-info-card">
                <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium leading-none">
                    {(() => { try { return new Date(booking.bookingDate + "T12:00:00").toLocaleDateString("en-US", { month: "short" }); } catch { return ""; } })()}
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {(() => { try { return new Date(booking.bookingDate + "T12:00:00").getDate(); } catch { return ""; } })()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {(() => { try { return new Date(booking.bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); } catch { return booking.bookingDate; } })()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.bookingStartTime ? (() => {
                      const [h, m] = booking.bookingStartTime.split(":").map(Number);
                      const period = h >= 12 ? "PM" : "AM";
                      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      const timeStr = m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
                      return `${timeStr} · `;
                    })() : ""}
                    {booking.bookingHours} hour{booking.bookingHours > 1 ? "s" : ""}
                    {booking.paymentAmount ? ` · $${(booking.paymentAmount / 100).toFixed(2)} paid` : ""}
                  </p>
                </div>
                {booking.status === "approved" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setShowReschedule(!showReschedule)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                      data-testid="button-reschedule"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(!showCancelConfirm)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                      data-testid="button-cancel-booking"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {booking.status === "approved" && (
              <button
                onClick={async () => {
                  try {
                    const res = await apiRequest("GET", `/api/space-bookings/${booking.id}/calendar-url`);
                    const data = await res.json();
                    if (data.url) window.open(data.url, "_blank");
                  } catch {
                    toast({ title: "Could not generate calendar link", variant: "destructive" });
                  }
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 py-1.5 rounded-md hover:bg-stone-50 transition-colors border border-stone-200"
                data-testid="button-add-to-calendar"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Add to Google Calendar
              </button>
            )}

            {showCancelConfirm && booking.status === "approved" && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2" data-testid="cancel-confirm-panel">
                {(() => {
                  const bookingDateTime = new Date(`${booking.bookingDate}T${booking.bookingStartTime || "00:00"}:00`);
                  const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
                  const isRefundable = hoursUntil >= 24;
                  return (
                    <>
                      <div className={`rounded-lg p-3 text-xs space-y-1.5 ${isRefundable ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                        <p className={`font-medium ${isRefundable ? "text-emerald-800" : "text-amber-800"}`}>
                          {isRefundable ? "You're eligible for a full refund" : "This cancellation is non-refundable"}
                        </p>
                        <p className={`${isRefundable ? "text-emerald-600" : "text-amber-600"}`}>
                          {isRefundable
                            ? "Your booking is 24+ hours away. You'll receive a full refund to your original payment method within 3–5 business days."
                            : "Your booking is within 24 hours. Per our cancellation policy, this cancellation is non-refundable."
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCancelConfirm(false)}
                          className="text-xs"
                        >
                          Keep Booking
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            statusMutation.mutate("cancelled");
                            setShowCancelConfirm(false);
                          }}
                          disabled={statusMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs flex-1"
                          data-testid="button-confirm-cancel"
                        >
                          {statusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          {isRefundable ? "Cancel & Refund" : "Cancel Anyway"}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {showReschedule && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3" data-testid="reschedule-panel">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Propose new date & time
              </p>
              <button onClick={() => setShowReschedule(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {!spaceSchedule ? (
              <div className="text-center py-3">
                <p className="text-xs text-gray-500">This space doesn't have a set schedule. Contact the host to arrange a new time.</p>
                <Button size="sm" variant="outline" onClick={() => setShowReschedule(false)} className="mt-2 text-xs">Close</Button>
              </div>
            ) : !rescheduleDate ? (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={(date) => {
                    if (date) {
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, "0");
                      const dd = String(date.getDate()).padStart(2, "0");
                      setRescheduleDate(`${yyyy}-${mm}-${dd}`);
                      setRescheduleTime("");
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    if (!spaceSchedule) return false;
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    const dayKey = getDayOfWeek(`${yyyy}-${mm}-${dd}`);
                    return dayKey ? spaceSchedule[dayKey] === null : true;
                  }}
                  className="rounded-lg border border-stone-200 bg-white"
                  data-testid="reschedule-calendar"
                />
              </div>
            ) : !rescheduleTime ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setRescheduleDate("")} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
                  <p className="text-xs text-gray-500">
                    {new Date(rescheduleDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(spaceSchedule ? getAvailableTimeSlots(spaceSchedule, rescheduleDate, bufferMins) : []).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setRescheduleTime(slot)}
                      className="px-2 py-2 rounded-lg text-xs font-medium bg-white border border-stone-200 text-gray-700 hover:border-gray-400 transition-colors"
                      data-testid={`reschedule-slot-${slot}`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 border border-stone-200 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">New date</span>
                    <span className="font-medium">{new Date(rescheduleDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">New time</span>
                    <span className="font-medium">{formatTime(rescheduleTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Duration</span>
                    <select
                      value={rescheduleHours}
                      onChange={(e) => setRescheduleHours(parseInt(e.target.value))}
                      className="h-7 rounded-md border border-input bg-white px-2 text-xs"
                      data-testid="reschedule-hours"
                    >
                      {Array.from({ length: spaceSchedule ? getMaxHoursFromSlot(spaceSchedule, rescheduleDate, rescheduleTime, bufferMins) : 8 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRescheduleTime(""); }}
                    className="text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => rescheduleMutation.mutate()}
                    disabled={rescheduleMutation.isPending}
                    className="bg-gray-900 text-white hover:bg-black text-xs flex-1"
                    data-testid="button-send-reschedule"
                  >
                    {rescheduleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                    Send Reschedule Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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

            if (msg.messageType === "reschedule_request" || msg.messageType === "reschedule_accepted" || msg.messageType === "reschedule_declined") {
              let data: any = {};
              try { data = JSON.parse(msg.message); } catch {}
              const isRequest = msg.messageType === "reschedule_request";
              const isAccepted = msg.messageType === "reschedule_accepted";
              const isPending = isRequest && !data.resolved;
              const canRespond = isPending && !isOwn;

              let dateDisplay = data.newDate || "";
              try { dateDisplay = new Date(data.newDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); } catch {}

              return (
                <div key={msg.id} className="flex justify-center" data-testid={`message-reschedule-${msg.id}`}>
                  <div className={`rounded-xl px-4 py-3 max-w-[85%] border ${
                    isAccepted ? "bg-emerald-50 border-emerald-200" :
                    msg.messageType === "reschedule_declined" ? "bg-red-50 border-red-200" :
                    "bg-blue-50 border-blue-200"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">
                        {isRequest ? `${msg.senderName} proposed a reschedule` :
                         isAccepted ? "Reschedule accepted" : "Reschedule declined"}
                      </span>
                    </div>
                    {isRequest && (
                      <div className="text-sm text-gray-800 space-y-0.5">
                        <p>{dateDisplay}{data.newStartTime ? ` at ${formatTime(data.newStartTime)}` : ""}</p>
                        <p className="text-xs text-gray-500">{data.newHours} hour{data.newHours > 1 ? "s" : ""}</p>
                      </div>
                    )}
                    {isAccepted && <p className="text-xs text-emerald-700">Booking updated to {dateDisplay}{data.newStartTime ? ` at ${formatTime(data.newStartTime)}` : ""}</p>}
                    {msg.messageType === "reschedule_declined" && <p className="text-xs text-red-700">Original booking kept</p>}
                    {canRespond && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => rescheduleRespondMutation.mutate({ messageId: msg.id, action: "accept" })}
                          disabled={rescheduleRespondMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3"
                          data-testid={`button-accept-reschedule-${msg.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rescheduleRespondMutation.mutate({ messageId: msg.id, action: "decline" })}
                          disabled={rescheduleRespondMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-3"
                          data-testid={`button-decline-reschedule-${msg.id}`}
                        >
                          <X className="w-3 h-3 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(msg.createdAt!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
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

function DirectConversationView({
  conversation,
  userId,
  onBack,
}: {
  conversation: EnrichedDirectConversation;
  userId: string;
  onBack: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<DirectMessage[]>({
    queryKey: ["/api/direct-conversations", conversation.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/direct-conversations/${conversation.id}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    fetch(`/api/direct-conversations/${conversation.id}/read`, { method: "POST", credentials: "include" }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
  }, [conversation.id, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      await apiRequest("POST", `/api/direct-conversations/${conversation.id}/messages`, { message: text });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/direct-conversations", conversation.id, "messages"] });
    },
  });

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  return (
    <div className="flex flex-col h-full" data-testid={`dm-view-${conversation.id}`}>
      <div className="border-b border-gray-100 px-4 py-3 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden text-gray-500 hover:text-gray-700" data-testid="button-back-to-inbox">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">{conversation.otherPartyName}</h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                Inquiry
              </Badge>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {conversation.spaceName} &middot; {conversation.role === "host" ? "You're the host" : "You're inquiring"}
            </p>
          </div>
        </div>
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
            data-testid="input-dm-message"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            size="sm"
            className="bg-gray-900 text-white hover:bg-black h-9 w-9 p-0"
            data-testid="button-send-dm"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PortalMessagesSection({ userId }: { userId: string }) {
  const [activeConversation, setActiveConversation] = useState<UnifiedConversation | null>(null);
  const { status: pushStatus, subscribe: subscribePush } = usePushNotifications("client");

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

  const allConversations: UnifiedConversation[] = [
    ...(bookingsData?.guestBookings || []).map((b) => ({ ...b, type: "booking" as const })),
    ...(bookingsData?.hostBookings || []).map((b) => ({ ...b, type: "booking" as const })),
    ...(bookingsData?.directConversations || []),
  ].sort((a, b) => {
    const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.createdAt!).getTime();
    const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.createdAt!).getTime();
    return bTime - aTime;
  });

  const totalUnread = allConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const currentConversation = activeConversation
    ? allConversations.find((c) => c.id === activeConversation.id) || activeConversation
    : null;

  return (
    <div className="space-y-3" data-testid="messages-section">
      {pushStatus === "prompt" && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Bell className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">Get notified when you receive a message</p>
            <p className="text-xs text-blue-600">Receive push notifications on this device</p>
          </div>
          <Button
            size="sm"
            onClick={subscribePush}
            data-testid="button-enable-notifications"
            className="bg-blue-600 text-white hover:bg-blue-700 shrink-0"
          >
            <BellRing className="w-3.5 h-3.5 mr-1.5" />
            Enable
          </Button>
        </div>
      )}
    <div className="h-[calc(100vh-180px)] min-h-[500px]">
      <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden flex">
        <div className={`w-full lg:w-[340px] lg:border-r border-gray-100 flex-shrink-0 overflow-y-auto ${
          activeConversation ? "hidden lg:block" : ""
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
            activeId={activeConversation?.id || null}
            onSelect={setActiveConversation}
            isLoading={isLoading}
          />
        </div>

        <div className={`flex-1 flex flex-col ${!activeConversation ? "hidden lg:flex" : ""}`}>
          {currentConversation ? (
            currentConversation.type === "direct" ? (
              <DirectConversationView
                conversation={currentConversation}
                userId={userId}
                onBack={() => setActiveConversation(null)}
              />
            ) : (
              <ConversationView
                booking={currentConversation}
                userId={userId}
                onBack={() => setActiveConversation(null)}
              />
            )
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
    </div>
  );
}

export function useUnreadCount() {
  const { data } = useQuery<{
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
  });

  const all = [
    ...(data?.guestBookings || []),
    ...(data?.hostBookings || []),
    ...(data?.directConversations || []),
  ];
  return all.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}
