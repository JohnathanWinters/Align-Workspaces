import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Users, ArrowLeft, Share2, Copy, Check, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SiteFooter } from "@/components/site-footer";
import { UserIndicator } from "@/components/user-indicator";

const CAT_COLORS: Record<string, string> = {
  therapy: "bg-[#f0ebe6] text-[#7a6e62]",
  coaching: "bg-[#f5ede3] text-[#946b4a]",
  wellness: "bg-[#eef0eb] text-[#687362]",
  workshop: "bg-[#eeebf0] text-[#706580]",
  creative: "bg-[#f2ebe8] text-[#8a6560]",
};

const CAT_LABELS: Record<string, string> = {
  therapy: "Therapy & Counseling", coaching: "Coaching & Consulting", wellness: "Wellness & Holistic",
  workshop: "Workshops & Classes", creative: "Creative Studios",
};

interface CommunityEvent {
  id: string; title: string; description: string; category: string;
  eventDate: string; eventTime: string; endTime: string | null;
  location: string | null; imageUrl: string | null; hostName: string;
  hostEmail: string | null; rsvpCount: number; approvalStatus: string;
  createdAt: string;
}

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: event, isLoading } = useQuery<CommunityEvent>({
    queryKey: [`/api/community-events/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: myRsvp } = useQuery<{ rsvped: boolean }>({
    queryKey: [`/api/community-events/${params?.id}/my-rsvp`],
    enabled: !!params?.id && isAuthenticated,
    queryFn: async () => {
      const res = await fetch(`/api/community-events/${params?.id}/my-rsvp`, { credentials: "include" });
      if (!res.ok) return { rsvped: false };
      return res.json();
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/community-events/${params?.id}/rsvp`, {
        method: "POST", credentials: "include",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community-events/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/community-events/${params?.id}/my-rsvp`] });
    },
  });

  const handleCopy = async () => {
    if (!event) return;
    const date = new Date(event.eventDate + "T00:00:00");
    const dateStr = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const timeStr = new Date(`2000-01-01T${event.eventTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const loc = event.location ? ` at ${event.location}` : "";
    const text = `Join me for "${event.title}" on ${dateStr} at ${timeStr}${loc}! Free for professionals.\n\nRSVP: ${window.location.href}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!event || !navigator.share) return;
    const date = new Date(event.eventDate + "T00:00:00");
    const dateStr = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    await navigator.share({ title: event.title, text: `${event.title}, ${dateStr}. Free for professionals.`, url: window.location.href });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">Event not found</p>
        <Link href="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  const date = new Date(event.eventDate + "T00:00:00");
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const fullDate = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = new Date(`2000-01-01T${event.eventTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endTimeStr = event.endTime ? new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <div className="min-h-screen bg-[#faf6f1]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <UserIndicator />
        </div>
      </nav>

      {/* Banner image */}
      {event.imageUrl && (
        <div className="w-full max-h-[300px] overflow-hidden">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Category badge */}
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${CAT_COLORS[event.category] || "bg-stone-100 text-stone-500"}`}>
            {CAT_LABELS[event.category] || event.category}
          </span>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 leading-tight">{event.title}</h1>

          {/* Date, time, location */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-stone-600">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#c4956a]/10 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] text-[#c4956a] font-bold leading-none">{month}</span>
                <span className="text-xl font-bold text-stone-900 leading-none">{day}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">{fullDate}</p>
                <p className="text-sm text-stone-500">{timeStr}{endTimeStr ? ` to ${endTimeStr}` : ""}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <MapPin className="w-4 h-4 text-[#c4956a]" />
                {event.location}
              </div>
            )}
          </div>

          {/* Host */}
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
              <span className="text-xs font-medium text-stone-600">{event.hostName.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
            </div>
            Hosted by <span className="font-medium text-stone-900">{event.hostName}</span>
          </div>

          {/* RSVP + Share row */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => rsvpMutation.mutate()}
                disabled={rsvpMutation.isPending}
                className={myRsvp?.rsvped
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-[#c4956a] hover:bg-[#b8845c] text-white"
                }
              >
                {rsvpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                  myRsvp?.rsvped ? <CheckCircle className="w-4 h-4 mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                {myRsvp?.rsvped ? "Going" : "RSVP"}
              </Button>
            ) : (
              <Link href="/portal">
                <Button className="bg-[#c4956a] hover:bg-[#b8845c] text-white">
                  <Users className="w-4 h-4 mr-2" /> Sign In
                </Button>
              </Link>
            )}
            <button onClick={handleCopy} className="h-10 px-3 rounded-lg border border-stone-200 hover:border-stone-300 flex items-center gap-1.5 text-xs text-stone-600 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {typeof navigator !== "undefined" && navigator.share && (
              <button onClick={handleShare} className="h-10 px-3 rounded-lg border border-stone-200 hover:border-stone-300 flex items-center gap-1.5 text-xs text-stone-600 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            )}
            {event.rsvpCount > 0 && (
              <span className="text-sm text-[#c4956a] font-medium">{event.rsvpCount} attending</span>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-stone-200 pt-6">
            <h2 className="text-sm font-medium text-stone-900 mb-3">About this event</h2>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Free badge */}
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
            <CheckCircle className="w-4 h-4" />
            This is a free event for professionals.
          </div>
        </motion.div>
      </div>

      <SiteFooter />
    </div>
  );
}
