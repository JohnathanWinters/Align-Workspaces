import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Calendar as CalendarIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";
import {
  getAvailableTimeSlots,
  normalizeSchedule,
  formatTime,
  type WeekSchedule,
} from "@/components/availability-schedule-editor";

interface SpaceWithHost extends Space {
  hostProfile?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
}

function hexOr(hex: string | null | undefined, fallback: string): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback;
  return hex;
}

export default function PrivateSpacePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();

  const [bookingDate, setBookingDate] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingHours, setBookingHours] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<"booked" | "cancelled" | null>(null);

  const { data: space, isLoading, error } = useQuery<SpaceWithHost>({
    queryKey: [`/api/spaces/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (space?.name) {
      document.title = `${space.name} — Book`;
    }
    const p = new URLSearchParams(window.location.search);
    if (p.get("booked") === "1") setBanner("booked");
    else if (p.get("cancelled") === "1") setBanner("cancelled");
  }, [space?.name]);

  const primary = hexOr(space?.brandPrimaryColor, "#c4956a");
  const btn = hexOr(space?.brandButtonColor, "#1c1917");

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", primary);
    root.style.setProperty("--brand-btn", btn);
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-btn");
    };
  }, [primary, btn]);

  const schedule: WeekSchedule | null = useMemo(() => {
    try {
      return normalizeSchedule(space?.availabilitySchedule ? JSON.parse(space.availabilitySchedule) : null);
    } catch {
      return null;
    }
  }, [space?.availabilitySchedule]);

  const availableSlots = useMemo(() => {
    if (!schedule || !bookingDate) return [];
    return getAvailableTimeSlots(schedule, bookingDate);
  }, [schedule, bookingDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-serif text-2xl text-stone-800">Workspace not found</h1>
        <p className="text-sm text-stone-500">This booking link may be inactive.</p>
      </div>
    );
  }

  const isPrivate = space.isPrivate === 1;
  const showAlignFooter = space.hideAlignBranding !== 1;
  const hostName = [space.hostProfile?.firstName, space.hostProfile?.lastName].filter(Boolean).join(" ") || space.hostName || space.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrivate) {
      toast({
        title: "Use the marketplace booking flow",
        description: "This workspace is not a private booking page.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/spaces/${space.id}/guest-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          bookingDate,
          bookingStartTime: bookingStartTime || undefined,
          bookingHours,
          message: message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200/70 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-4 flex items-center gap-3">
          {space.brandLogoUrl ? (
            <img src={space.brandLogoUrl} alt={hostName} className="h-9 max-w-[140px] object-contain" />
          ) : (
            <div className="font-serif text-lg text-stone-900">{hostName}</div>
          )}
        </div>
      </header>

      {/* Status banners */}
      {banner === "booked" && (
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-4">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Booking confirmed</p>
              <p className="text-emerald-700/90">Check your email for details. {hostName} will reach out shortly.</p>
            </div>
          </div>
        </div>
      )}
      {banner === "cancelled" && (
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">Payment was cancelled. You can try booking again below.</p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12 grid md:grid-cols-5 gap-8">
        {/* Left: Space info */}
        <div className="md:col-span-3">
          {/* Hero image */}
          {space.imageUrls && space.imageUrls.length > 0 && (
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-6">
              <img
                src={space.imageUrls[0] as string}
                alt={space.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-3 leading-tight">{space.name}</h1>

          <div className="flex items-start gap-2 text-sm text-stone-600 mb-6">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primary }} />
            <span>{space.address}</span>
          </div>

          {space.description && (
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap mb-8">
              {space.description}
            </div>
          )}

          {/* Additional photos */}
          {space.imageUrls && space.imageUrls.length > 1 && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(space.imageUrls as string[]).slice(1, 5).map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-stone-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {space.amenities && space.amenities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-stone-500 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {(space.amenities as string[]).map(a => (
                  <span key={a} className="px-3 py-1 rounded-full bg-white border border-stone-200 text-xs text-stone-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking form */}
        <div className="md:col-span-2">
          <div className="md:sticky md:top-24">
            <div className="bg-white rounded-2xl border border-stone-200/60 p-5 sm:p-6 shadow-sm">
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif text-stone-900">${space.pricePerHour}</span>
                  <span className="text-stone-500 text-sm">/ hour</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingDate}
                    onChange={(e) => { setBookingDate(e.target.value); setBookingStartTime(""); }}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                  />
                </div>

                {bookingDate && availableSlots.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Start time</label>
                    <select
                      required
                      value={bookingStartTime}
                      onChange={(e) => setBookingStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                    >
                      <option value="">Select a time</option>
                      {availableSlots.map(slot => (
                        <option key={slot} value={slot}>{formatTime(slot)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">Duration (hours)</label>
                  <select
                    value={bookingHours}
                    onChange={(e) => setBookingHours(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} hour{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Your name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Phone <span className="text-stone-400 font-normal">(optional)</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">Message <span className="text-stone-400 font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 resize-none"
                    />
                  </div>
                </div>

                {bookingHours > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-sm">
                    <span className="text-stone-500">Total</span>
                    <span className="font-medium text-stone-900">${space.pricePerHour * bookingHours}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: btn }}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Starting checkout..." : "Book & pay"}
                </button>
                <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                  You'll be taken to a secure payment page. Payment goes directly to {hostName.split(" ")[0] || "the host"}.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {showAlignFooter && (
        <footer className="bg-white border-t border-stone-200/60 mt-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between text-xs text-stone-500">
            <span>© {hostName}</span>
            <a href="https://alignworkspaces.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-900 transition-colors">
              Powered by Align Workspaces
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
