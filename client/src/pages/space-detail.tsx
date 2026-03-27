import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { UserIndicator } from "@/components/user-indicator";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Send,
  Loader2,
  X,
  Camera,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Palette,
  Heart,
  Share2,
  Wifi,
  Sun,
  Car,
  Volume2,
  Coffee,
  Wind,
  Droplets,
  Sparkles,
  Mail,
  MessageCircle,
  Star,
  Shield,
  ExternalLink,
  Copy,
  Award,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import type { Space } from "@shared/schema";
import {
  type WeekSchedule,
  getDayOfWeek,
  getAvailableTimeSlots,
  getMaxHoursFromSlot,
  formatTime,
} from "@/components/availability-schedule-editor";
import { SiteFooter } from "@/components/site-footer";
import { trackEvent } from "@/hooks/use-analytics";
import { useSmartBack } from "@/hooks/use-smart-back";

function parseColorPalette(raw: string | null | undefined): { colors: { hex: string; name: string }[]; feel?: string; explanation?: string } | null {
  if (!raw) return null;
  try {
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed = { colors: parsed };
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.colors)) return null;
    const colors = parsed.colors
      .filter((c: unknown): c is { hex: string; name: string } =>
        c != null && typeof c === "object" && typeof (c as any).hex === "string" && typeof (c as any).name === "string"
      );
    if (colors.length === 0) return null;
    return {
      colors,
      feel: typeof parsed.feel === "string" ? parsed.feel : undefined,
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : undefined,
    };
  } catch { return null; }
}

const TYPE_LABELS: Record<string, string> = {
  therapy: "Therapy & Counseling",
  coaching: "Coaching & Consulting",
  wellness: "Wellness & Holistic",
  workshop: "Workshops & Classes",
  creative: "Creative Studio",
  office: "Office",
  studio: "Creative Studio",
  gym: "Training Studio",
  meeting: "Meeting Room",
  art_studio: "Art Studio",
  photo_studio: "Photo/Video Studio",
};

const TYPE_COLORS: Record<string, string> = {
  therapy: "bg-blue-50 text-blue-700",
  coaching: "bg-amber-50 text-amber-700",
  wellness: "bg-emerald-50 text-emerald-700",
  workshop: "bg-purple-50 text-purple-700",
  creative: "bg-rose-50 text-rose-700",
  office: "bg-blue-50 text-blue-700",
  studio: "bg-rose-50 text-rose-700",
  gym: "bg-emerald-50 text-emerald-700",
  meeting: "bg-amber-50 text-amber-700",
  art_studio: "bg-purple-50 text-purple-700",
  photo_studio: "bg-rose-50 text-rose-700",
};

const BADGE_COLORS: Record<string, string> = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-200",
  superhost: "bg-amber-50 text-amber-700 border-amber-200",
  verified: "bg-blue-50 text-blue-700 border-blue-200",
  top_rated: "bg-purple-50 text-purple-700 border-purple-200",
  responsive: "bg-teal-50 text-teal-700 border-teal-200",
  experienced: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-stone-200 fill-stone-200"
          }`}
        />
      ))}
    </div>
  );
}

function ClickableStarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hovered || rating)
                ? "text-amber-400 fill-amber-400"
                : "text-stone-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function getAmenityIcon(amenity: string) {
  const l = amenity.toLowerCase();
  if (l.includes("wifi") || l.includes("wi-fi") || l.includes("internet")) return Wifi;
  if (l.includes("natural light") || l.includes("sunlight") || l.includes("window")) return Sun;
  if (l.includes("parking") || l.includes("car")) return Car;
  if (l.includes("restroom") || l.includes("bathroom") || l.includes("toilet")) return Droplets;
  if (l.includes("dressing") || l.includes("changing") || l.includes("locker")) return Sparkles;
  if (l.includes("sound") || l.includes("speaker") || l.includes("audio") || l.includes("music")) return Volume2;
  if (l.includes("kitchen") || l.includes("coffee") || l.includes("tea") || l.includes("refreshment")) return Coffee;
  if (l.includes("air") || l.includes("hvac") || l.includes("heating") || l.includes("cooling")) return Wind;
  return Check;
}

function getSpaceHighlights(space: Space) {
  const items: { icon: typeof Check; text: string }[] = [];
  const a = (space.amenities || []).map((x) => x.toLowerCase());

  if (space.capacity) items.push({ icon: Users, text: `Up to ${space.capacity} people` });
  if (a.some((x) => x.includes("parking"))) items.push({ icon: Car, text: "Free parking" });
  if (a.some((x) => x.includes("natural light") || x.includes("window"))) items.push({ icon: Sun, text: "Abundant natural light" });
  if (a.some((x) => x.includes("sound") || x.includes("speaker") || x.includes("audio"))) items.push({ icon: Volume2, text: "Sound system available" });
  if (a.some((x) => x.includes("dressing") || x.includes("changing"))) items.push({ icon: Sparkles, text: "Private dressing room" });
  if (a.some((x) => x.includes("wifi") || x.includes("internet"))) items.push({ icon: Wifi, text: "High-speed WiFi" });
  if (space.capacity && space.capacity >= 8) items.push({ icon: Building2, text: "Large private space" });
  if (a.some((x) => x.includes("kitchen") || x.includes("coffee"))) items.push({ icon: Coffee, text: "Kitchen & refreshments" });

  return items.slice(0, 6);
}

function PhotoCarousel({ images, spaceName, onClose, initialIndex = 0 }: { images: string[]; spaceName: string; onClose: () => void; initialIndex?: number }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      data-testid="photo-carousel-overlay"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        data-testid="button-close-carousel"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="absolute top-4 left-4 text-white/70 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>
      <div
        className="relative w-full h-full flex items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${spaceName} - Photo ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            data-testid="img-carousel-photo"
          />
        </AnimatePresence>
        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-white" : "bg-white/30"}`}
              data-testid={`button-carousel-dot-${i}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MagicLinkModal({ spaceSlug, onClose, onSuccess, intent = "book" }: { spaceSlug: string; onClose: () => void; onSuccess: () => void; intent?: "book" | "contact" }) {
  const [magicEmail, setMagicEmail] = useState("");
  const [magicName, setMagicName] = useState("");
  const [magicStep, setMagicStep] = useState<"email" | "name" | "sent">("email");
  const [magicError, setMagicError] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  const sendMagicLink = async (email: string, firstName?: string) => {
    setMagicLoading(true);
    setMagicError("");
    try {
      const returnTo = `/spaces/${encodeURIComponent(spaceSlug)}?${intent === "contact" ? "contact" : "book"}=1`;
      if (firstName) {
        await fetch("/api/auth/magic-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName }),
        });
      }
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, returnTo }),
      });
      const data = await res.json();
      if (data.needsName) {
        setMagicStep("name");
      } else if (data.sent) {
        setMagicStep("sent");
      } else {
        setMagicError(data.message || "Something went wrong");
      }
    } catch {
      setMagicError("Failed to send sign-in link. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center" onClick={onClose}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div
          className="relative bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-stone-100 transition-colors" data-testid="button-close-auth">
            <X className="w-4 h-4 text-stone-400" />
          </button>
          {magicStep === "email" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-serif text-lg font-semibold">{intent === "contact" ? "Sign in to message" : "Sign in to book"}</h3>
                <p className="text-sm text-stone-500 mt-1">Enter your email and we'll send you a sign-in link</p>
              </div>
              {magicError && <p className="text-xs text-red-500 text-center">{magicError}</p>}
              <form onSubmit={e => { e.preventDefault(); sendMagicLink(magicEmail); }} className="space-y-3">
                <Input type="email" placeholder="your@email.com" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} required autoFocus data-testid="input-magic-email" />
                <button type="submit" disabled={magicLoading || !magicEmail} className="w-full py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors" data-testid="button-magic-submit">
                  {magicLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Continue"}
                </button>
              </form>
            </div>
          )}
          {magicStep === "name" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-serif text-lg font-semibold">Welcome!</h3>
                <p className="text-sm text-stone-500 mt-1">What's your first name?</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); sendMagicLink(magicEmail, magicName); }} className="space-y-3">
                <Input placeholder="First name" value={magicName} onChange={e => setMagicName(e.target.value)} required autoFocus data-testid="input-magic-name" />
                <button type="submit" disabled={magicLoading || !magicName} className="w-full py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors" data-testid="button-magic-name-submit">
                  {magicLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Link"}
                </button>
              </form>
            </div>
          )}
          {magicStep === "sent" && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Check your email</h3>
              <p className="text-sm text-stone-500 max-w-xs mx-auto">
                We sent a sign-in link to <span className="font-medium text-stone-700">{magicEmail}</span>. Tap the link to continue.
              </p>
              <p className="text-xs text-stone-400">The link expires in 15 minutes.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function StepCheckmark({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 350);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <motion.div className="flex items-center justify-center py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
      <motion.div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        <Check className="w-7 h-7 text-emerald-500" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}

function AnimatedPrice({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = value;
    const duration = 300;
    const steps = 12;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      setDisplay(current);
      if (step >= steps) { clearInterval(timer); setDisplay(target); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{(display / 100).toFixed(2)}</span>;
}

function BookingPopup({ space, onClose, schedule, bufferMinutes, bookMutation }: {
  space: Space; onClose: () => void; schedule: WeekSchedule | null; bufferMinutes: number; bookMutation: any;
}) {
  const [step, setStep] = useState<"date" | "time" | "time-check" | "confirm">("date");
  const [bookingDates, setBookingDates] = useState<string[]>([]);
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingHours, setBookingHours] = useState(1);
  const [direction, setDirection] = useState(1);
  const [bookingIndex, setBookingIndex] = useState(0);
  const { toast } = useToast();

  // Use first selected date for time slot calculations
  const bookingDate = bookingDates[0] || "";
  const dateCount = bookingDates.length;

  // Recurring discount from host settings
  const discountPercent = (space as any).recurringDiscountPercent || 0;
  const discountAfter = (space as any).recurringDiscountAfter || 0;
  const hasRecurringDiscount = discountPercent > 0 && dateCount > 1;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const DEFAULT_SCHEDULE: WeekSchedule = {
    mon: { open: "09:00", close: "17:00" },
    tue: { open: "09:00", close: "17:00" },
    wed: { open: "09:00", close: "17:00" },
    thu: { open: "09:00", close: "17:00" },
    fri: { open: "09:00", close: "17:00" },
    sat: { open: "10:00", close: "15:00" },
    sun: null,
  };
  const effectiveSchedule = schedule || DEFAULT_SCHEDULE;

  // Fetch booked slots for the first selected date (used for time picker)
  const { data: bookedData } = useQuery<{ bookedSlots: Array<{ startMin: number; endMin: number }> }>({
    queryKey: ["/api/spaces", space.id, "booked-slots", bookingDate],
    queryFn: () => fetch(`/api/spaces/${space.id}/booked-slots?date=${bookingDate}`).then(r => r.json()),
    enabled: !!bookingDate,
  });

  const allSlots = bookingDate ? getAvailableTimeSlots(effectiveSchedule, bookingDate, bufferMinutes) : [];

  const availableSlots = allSlots.filter(slot => {
    if (!bookedData?.bookedSlots?.length) return true;
    const [h, m] = slot.split(":").map(Number);
    const slotStart = h * 60 + m;
    const slotEnd = slotStart + 60;
    return !bookedData.bookedSlots.some(b => slotStart < b.endMin && slotEnd > b.startMin);
  });

  const maxHours = bookingDate && bookingStartTime ? (() => {
    const scheduleMax = getMaxHoursFromSlot(effectiveSchedule, bookingDate, bookingStartTime, bufferMinutes);
    if (!bookedData?.bookedSlots?.length) return scheduleMax;
    const [h, m] = bookingStartTime.split(":").map(Number);
    const startMin = h * 60 + m;
    let maxMin = startMin + scheduleMax * 60;
    for (const b of bookedData.bookedSlots) {
      if (b.startMin > startMin && b.startMin < maxMin) {
        maxMin = b.startMin - bufferMinutes;
      }
    }
    return Math.max(1, Math.floor((maxMin - startMin) / 60));
  })() : 8;

  // Pricing: per-date base price
  const perDateBase = space.pricePerHour * 100 * bookingHours;

  // Fetch real fee breakdown from API
  const { data: feeData } = useQuery<{
    basePriceCents: number; guestFeeAmount: number;
    taxAmount: number; totalGuestCharged: number;
    isRepeatGuest: boolean; isHostReferred: boolean;
  }>({
    queryKey: ["/api/spaces", space.id, "booking-fees", bookingHours],
    queryFn: () => fetch(`/api/spaces/${space.id}/booking-fees?hours=${bookingHours}`).then(r => r.json()),
    enabled: bookingHours >= 1,
  });

  // Calculate per-date pricing
  const perDateGuestFee = feeData?.guestFeeAmount ?? Math.round(perDateBase * 0.07);
  const perDateTax = feeData?.taxAmount ?? Math.round(perDateBase * 0.07);
  const perDateTotal = feeData?.totalGuestCharged ?? (perDateBase + perDateGuestFee + perDateTax);
  const isRepeatGuest = feeData?.isRepeatGuest ?? false;
  const standardFee = Math.round(perDateBase * 0.07);
  const loyaltySavings = isRepeatGuest ? standardFee - perDateGuestFee : 0;

  // Multi-date totals
  const allDatesBase = perDateBase * dateCount;
  const allDatesTotal = perDateTotal * dateCount;

  // Recurring discount: how many dates qualify for the discount
  const discountEligibleCount = hasRecurringDiscount ? Math.max(0, dateCount - discountAfter) : 0;
  const discountSavings = discountEligibleCount > 0 ? Math.round(perDateBase * (discountPercent / 100) * discountEligibleCount) : 0;
  const grandTotal = allDatesTotal - discountSavings;

  const isDateAvailable = (date: Date): boolean => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayKey = getDayOfWeek(dateStr);
    return dayKey ? effectiveSchedule[dayKey] !== null : false;
  };

  const toDateStr = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const stepIndex = step === "date" ? 0 : step === "time" || step === "time-check" ? 1 : 2;
  const steps = [
    { label: dateCount > 1 ? `Dates (${dateCount})` : "Date", icon: CalendarDays },
    { label: "Time", icon: Clock },
    { label: "Confirm", icon: CreditCard },
  ];

  const goBack = () => {
    setDirection(-1);
    if (step === "time") { setStep("date"); setBookingStartTime(""); }
    else if (step === "confirm") { setStep("time"); setBookingStartTime(""); }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-testid="booking-popup"
    >
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-28 sm:h-32 overflow-hidden flex-shrink-0">
          {space.imageUrls && space.imageUrls[0] ? (
            <img src={space.imageUrls[0]} alt={space.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors" data-testid="button-close-booking-popup">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-white font-serif text-lg font-semibold truncate">{space.name}</h3>
            <p className="text-white/70 text-xs flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> {space.neighborhood || space.address}
              <span className="mx-1">&middot;</span>
              <span className="text-white font-medium">${space.pricePerHour}/hr</span>
            </p>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                      i < stepIndex ? "bg-emerald-500 text-white" :
                      i === stepIndex ? "bg-[#c4956a] text-white shadow-lg shadow-[#c4956a]/30" :
                      "bg-stone-100 text-stone-400"
                    }`}
                    animate={i === stepIndex ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {i < stepIndex ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </motion.div>
                  <span className={`text-[10px] mt-1 font-medium ${i <= stepIndex ? "text-stone-700" : "text-stone-400"}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full overflow-hidden bg-stone-100">
                    <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: "0%" }} animate={{ width: i < stepIndex ? "100%" : "0%" }} transition={{ duration: 0.4, ease: "easeOut" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-[320px]">
          <AnimatePresence mode="wait" custom={direction}>
            {step === "date" && (
              <motion.div key="date" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15, ease: "easeOut" }} className="space-y-3">
                <p className="text-sm font-medium text-stone-600 text-center">
                  {dateCount === 0 ? "When would you like to visit?" : `${dateCount} date${dateCount !== 1 ? "s" : ""} selected`}
                </p>
                {discountPercent > 0 && dateCount <= 1 && (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 mx-auto bg-emerald-50/80 rounded-full border border-emerald-100 w-fit">
                    <Repeat className="w-3 h-3 text-emerald-600" />
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Select multiple dates to save {discountPercent}%
                    </span>
                  </div>
                )}
                <div className="flex justify-center">
                  <Calendar
                    mode="multiple"
                    selected={bookingDates.map(d => new Date(d + "T12:00:00"))}
                    onSelect={(dates) => {
                      if (dates) {
                        const sorted = dates
                          .map(d => toDateStr(d))
                          .sort();
                        setBookingDates(sorted);
                      } else {
                        setBookingDates([]);
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      return !isDateAvailable(date);
                    }}
                    className="rounded-xl border border-stone-200 bg-white shadow-sm"
                    data-testid="popup-calendar"
                  />
                </div>
                <div className="space-y-3">
                  {dateCount > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {bookingDates.map(d => (
                        <span key={d} className="text-[11px] bg-[#c4956a]/10 text-[#c4956a] px-2 py-1 rounded-full font-medium">
                          {new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      ))}
                    </div>
                  )}
                  {dateCount > 1 && discountPercent > 0 && discountEligibleCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <Repeat className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">
                        {discountPercent}% off {discountEligibleCount} of {dateCount} dates
                      </span>
                    </div>
                  )}
                  <motion.button
                    onClick={() => {
                      setBookingStartTime("");
                      setBookingHours(1);
                      setDirection(1);
                      setStep("time");
                    }}
                    disabled={dateCount === 0}
                    animate={dateCount > 0
                      ? { backgroundColor: "#c4956a", color: "#ffffff", scale: [0.97, 1.02, 1] }
                      : { backgroundColor: "#e7e5e4", color: "#a8a29e", scale: 1 }
                    }
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                      dateCount > 0
                        ? "hover:bg-[#b8845c] shadow-lg shadow-[#c4956a]/30"
                        : "cursor-not-allowed"
                    }`}
                    data-testid="button-next-to-time"
                  >
                    <AnimatePresence mode="wait">
                      {dateCount === 0 ? (
                        <motion.span key="pick" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
                          Pick a Date
                          <CalendarDays className="w-4 h-4" />
                        </motion.span>
                      ) : (
                        <motion.span key="next" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
                          Next — Pick a Time
                          <ChevronRight className="w-5 h-5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            )}
            {step === "time" && (
              <motion.div key="time" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15, ease: "easeOut" }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={goBack} className="p-1.5 rounded-full hover:bg-stone-100 transition-colors" data-testid="button-booking-back">
                    <ArrowLeft className="w-4 h-4 text-stone-500" />
                  </button>
                  <p className="text-sm font-medium text-stone-600">Pick a time slot</p>
                </div>
                <p className="text-xs text-stone-400 -mt-2">
                  {dateCount > 1 ? (
                    <>{dateCount} dates selected &middot; same time for all</>
                  ) : (
                    new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                  )}
                </p>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-4">No available time slots for this date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => {
                          setBookingStartTime(slot);
                          setBookingHours(1);
                          setDirection(1);
                          setStep("time-check");
                        }}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                          bookingStartTime === slot ? "bg-[#c4956a] text-white shadow-md" : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
                        }`}
                        data-testid={`button-slot-${slot}`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {step === "time-check" && (
              <motion.div key="time-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StepCheckmark onComplete={() => setStep("confirm")} />
              </motion.div>
            )}
            {step === "confirm" && (
              <motion.div key="confirm" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.15, ease: "easeOut" }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={goBack} className="p-1.5 rounded-full hover:bg-stone-100 transition-colors" data-testid="button-booking-back-confirm">
                    <ArrowLeft className="w-4 h-4 text-stone-500" />
                  </button>
                  <p className="text-sm font-medium text-stone-600">Confirm your booking{dateCount > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                  {/* Selected dates */}
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">{dateCount > 1 ? "Dates" : "Date"}</span>
                    <div className="text-right">
                      {dateCount <= 3 ? (
                        bookingDates.map(d => (
                          <p key={d} className="font-medium text-stone-800 text-xs">
                            {new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                        ))
                      ) : (
                        <span className="font-medium text-stone-800">{dateCount} dates selected</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Time</span>
                    <span className="font-medium text-stone-800">{formatTime(bookingStartTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-stone-500">Duration</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setBookingHours(Math.max(1, bookingHours - 1))} className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold" data-testid="button-hours-minus">&minus;</button>
                      <span className="font-medium text-stone-800 w-12 text-center">{bookingHours} hr{bookingHours > 1 ? "s" : ""}</span>
                      <button onClick={() => setBookingHours(Math.min(maxHours, bookingHours + 1))} className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold" data-testid="button-hours-plus">+</button>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">
                        ${space.pricePerHour}/hr &times; {bookingHours} hr{bookingHours > 1 ? "s" : ""}
                        {dateCount > 1 && <> &times; {dateCount} dates</>}
                      </span>
                      <span className="text-stone-700"><AnimatedPrice value={allDatesBase} /></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Service fee{dateCount > 1 && ` (${dateCount}x)`}</span>
                      <span className="text-stone-700"><AnimatedPrice value={perDateGuestFee * dateCount} /></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Taxes{dateCount > 1 && ` (${dateCount}x)`}</span>
                      <span className="text-stone-700"><AnimatedPrice value={perDateTax * dateCount} /></span>
                    </div>
                    {isRepeatGuest && loyaltySavings > 0 && (
                      <div className="bg-emerald-50 rounded-lg px-3 py-2 -mx-1">
                        <div className="flex justify-between text-sm text-emerald-700">
                          <span className="flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Loyalty discount
                          </span>
                          <span className="font-semibold">-<AnimatedPrice value={loyaltySavings * dateCount} /></span>
                        </div>
                      </div>
                    )}
                    {hasRecurringDiscount && discountEligibleCount > 0 && (
                      <div className="bg-emerald-50 rounded-lg px-3 py-2 -mx-1">
                        <div className="flex justify-between text-sm text-emerald-700">
                          <span className="flex items-center gap-1 font-medium">
                            <Repeat className="w-3 h-3" /> Recurring discount ({discountPercent}%)
                          </span>
                          <span className="font-semibold">-<AnimatedPrice value={discountSavings} /></span>
                        </div>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          Applied to {discountEligibleCount} of {dateCount} dates
                          {discountAfter > 0 && <> (kicks in after {discountAfter})</>}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-stone-200">
                      <span className="text-stone-800">Total</span>
                      <span className="text-[#c4956a]"><AnimatedPrice value={grandTotal} /></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    // Book each date sequentially
                    setBookingIndex(0);
                    for (let i = 0; i < bookingDates.length; i++) {
                      setBookingIndex(i);
                      await new Promise<void>((resolve, reject) => {
                        bookMutation.mutate(
                          { bookingDate: bookingDates[i], bookingStartTime, bookingHours },
                          { onSuccess: () => resolve(), onError: (err: any) => reject(err) }
                        );
                      }).catch(() => {});
                    }
                  }}
                  disabled={bookMutation.isPending}
                  className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  data-testid="button-confirm-booking"
                >
                  {bookMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking {bookingIndex + 1} of {dateCount}...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {dateCount > 1 ? `Pay & Book ${dateCount} Dates` : "Pay & Book"}
                    </>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  {dateCount > 1 ? "Each date creates a separate booking. You'll be redirected to Stripe." : "You'll be redirected to Stripe for secure payment"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Contact Host Modal ─── */
function ContactHostModal({ space, onClose }: { space: Space; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await apiRequest("POST", `/api/spaces/${space.id}/inquire`, { message: message.trim() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send");
      }
      setSent(true);
      trackEvent("space_inquiry", { spaceId: space.id });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center" onClick={onClose}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div
          className="relative bg-white w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4 text-stone-400" />
          </button>

          {sent ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Message sent!</h3>
              <p className="text-sm text-stone-500 max-w-xs mx-auto">
                {space.userId ? (
                  <>{space.hostName || "The host"} will be notified. Check your{" "}
                  <a href="/portal?tab=messages" className="text-[#c4956a] font-medium hover:underline">portal messages</a>{" "}
                  for replies.</>
                ) : (
                  <>Your inquiry about {space.name} has been sent. We'll get back to you soon.</>
                )}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-semibold">Contact {space.hostName || "the host"}</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Ask about {space.name} — availability, amenities, or anything else
                </p>
              </div>
              <Textarea
                placeholder="Hi! I'm interested in your space for..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
                autoFocus
                data-testid="input-contact-message"
              />
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="w-full py-2.5 rounded-lg bg-[#c4956a] text-white text-sm font-semibold hover:bg-[#b8845c] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                data-testid="button-send-inquiry"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send message
              </button>
              <p className="text-[10px] text-stone-400 text-center">
                You'll be able to continue the conversation in your portal
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── Booking card content (shared between desktop sidebar & mobile inline) ─── */
function BookingCard({
  space,
  onBookClick,
  user,
  favStatus,
  onToggleFavorite,
  onShare,
}: {
  space: Space;
  onBookClick: () => void;
  user: any;
  favStatus: { favorited: boolean } | undefined;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-stone-900">${space.pricePerHour}</span>
        <span className="text-base text-stone-500">/hr</span>
      </div>
      {space.pricePerDay && (
        <p className="text-sm text-stone-400 mb-1">${space.pricePerDay}/day also available</p>
      )}
      {(space as any).recurringDiscountPercent > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 mb-4 px-2.5 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
          <Repeat className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="text-xs text-emerald-700 font-medium">
            Save {(space as any).recurringDiscountPercent}% with a recurring booking
            {(space as any).recurringDiscountAfter > 0 && (
              <span className="text-emerald-600 font-normal"> (after {(space as any).recurringDiscountAfter} booking{(space as any).recurringDiscountAfter !== 1 ? "s" : ""})</span>
            )}
          </span>
        </div>
      )}
      {!space.pricePerDay && !((space as any).recurringDiscountPercent > 0) && <div className="mb-5" />}

      {/* Hours & capacity */}
      <div className="space-y-3 mb-5 pb-5 border-b border-stone-100">
        {space.availableHours && (
          <div className="flex items-center gap-2.5 text-sm text-stone-600">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>{space.availableHours}</span>
          </div>
        )}
        {space.capacity && (
          <div className="flex items-center gap-2.5 text-sm text-stone-600">
            <Users className="w-4 h-4 text-stone-400" />
            <span>Up to {space.capacity} people</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onBookClick}
        className="w-full py-3 rounded-xl bg-[#c4956a] text-white text-sm font-semibold hover:bg-[#b8845c] flex items-center justify-center gap-2 shadow-sm transition-colors"
        data-testid="button-book-space"
      >
        <Send className="w-4 h-4" />
        Request to book
      </button>

      {/* Save & Share */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {user && (
          <button
            onClick={onToggleFavorite}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
            data-testid="button-toggle-favorite"
          >
            <Heart className={`w-4 h-4 ${favStatus?.favorited ? "text-stone-600 fill-stone-600" : "text-stone-500"}`} strokeWidth={2.5} />
            Save
          </button>
        )}
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          data-testid="button-share-space"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════  MAIN PAGE  ═══════════════════════════════ */

export default function SpaceDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [, navigate] = useLocation();
  const smartBack = useSmartBack("/workspaces?type=all");

  /* ── state ── */
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [portfolioCarouselOpen, setPortfolioCarouselOpen] = useState(false);
  const [portfolioCarouselIndex, setPortfolioCarouselIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [authIntent, setAuthIntent] = useState<"book" | "contact">("book");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  /* ── queries ── */
  const { data: space, isLoading, error } = useQuery<Space>({
    queryKey: ["/api/spaces", slug],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${slug}`);
      if (!res.ok) throw new Error("Space not found");
      return res.json();
    },
  });

  // Track referral link clicks — set cookie on server when ?ref= param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      fetch("/api/referral/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: refCode }),
        credentials: "include",
      }).catch(() => {}); // Fire and forget
    }
  }, []);

  const { data: portfolioPhotos = [] } = useQuery<Array<{ id: string; imageUrl: string; category?: string; title?: string; cropPosition?: { x: number; y: number; zoom: number } }>>({
    queryKey: ["/api/portfolio-photos/by-space", space?.id],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio-photos/by-space/${space!.id}`);
      if (!res.ok) return [];
      const photos = await res.json();
      return photos.filter((p: any) => p.category === "people");
    },
    enabled: !!space?.id,
  });

  const { data: favStatus } = useQuery<{ favorited: boolean }>({
    queryKey: ["/api/space-favorites/check", space?.id],
    queryFn: async () => {
      const res = await fetch(`/api/space-favorites/check/${space!.id}`, { credentials: "include" });
      if (!res.ok) return { favorited: false };
      return res.json();
    },
    enabled: !!space?.id && !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (favStatus?.favorited) {
        await apiRequest("DELETE", `/api/space-favorites/${space!.id}`);
      } else {
        await apiRequest("POST", `/api/space-favorites/${space!.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/space-favorites/check", space?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-favorites"] });
    },
  });

  /* ── reviews ── */
  const { data: reviewsData } = useQuery<{ reviews: Array<{ id: string; guestName: string; rating: number; title?: string; comment: string; createdAt: string; hostResponse?: string }>; averageRating: number; reviewCount: number }>({
    queryKey: ["/api/spaces", space?.id, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${space!.id}/reviews`);
      if (!res.ok) return { reviews: [], averageRating: 0, reviewCount: 0 };
      return res.json();
    },
    enabled: !!space?.id,
  });

  /* ── host badges ── */
  const { data: hostBadges = [] } = useQuery<Array<{ key: string; label: string; description: string }>>({
    queryKey: ["/api/spaces", space?.id, "badges"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${space!.id}/badges`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!space?.id,
  });

  /* ── similar spaces ── */
  const { data: similarSpaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/spaces", space?.id, "similar"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${space!.id}/similar`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!space?.id,
  });

  /* ── host response metrics ── */
  const { data: hostMetrics } = useQuery<{ avgMinutes: number; responseRate: number; responseLabel: string }>({
    queryKey: ["/api/spaces", space?.id, "host-metrics"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${space!.id}/host-metrics`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!space?.id,
  });

  /* ── cancellation policy ── */
  const { data: cancellationPolicy } = useQuery<{ policy: string; name: string; description: string }>({
    queryKey: ["/api/spaces", space?.id, "cancellation-policy"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${space!.id}/cancellation-policy`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!space?.id,
  });

  /* ── portfolio (work created here) ── */
  const { data: portfolioWork = [] } = useQuery<Array<{ id: string; imageUrl: string; title?: string; category?: string }>>({
    queryKey: ["/api/spaces", space?.id, "portfolio"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${space!.id}/portfolio`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!space?.id,
  });

  /* ── user bookings for review eligibility ── */
  const { data: userBookings = [] } = useQuery<Array<{ id: string; spaceId: string; status: string; hasReview?: boolean }>>({
    queryKey: ["/api/space-bookings", "review-check", space?.id],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      // Endpoint returns { guest: [...], host: [...] } — flatten to array
      const all = [...(data?.guest || []), ...(data?.host || [])];
      return Array.isArray(all) ? all : [];
    },
    enabled: !!user && !!space?.id,
  });

  const reviewableBooking = Array.isArray(userBookings) ? userBookings.find(
    (b) => b.spaceId === space?.id && b.status === "completed" && !b.hasReview
  ) : undefined;

  /* ── review submission ── */
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/space-bookings/${reviewableBooking!.id}/review`, {
        rating: reviewRating,
        title: reviewTitle || undefined,
        comment: reviewComment,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thank you for your feedback!" });
      setReviewRating(0);
      setReviewTitle("");
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", space?.id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  /* ── booking ── */
  const bookMutation = useMutation({
    mutationFn: async (params: { bookingDate: string; bookingStartTime: string; bookingHours: number }) => {
      const res = await apiRequest("POST", `/api/spaces/${space!.id}/book`, params);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: "Booking created", description: "Check your portal for updates." });
        setShowBooking(false);
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (space) {
      trackEvent("space_view", { spaceId: space.id, spaceName: space.name });
    }
  }, [space?.id]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("book") === "1" && isAuthenticated) {
      setShowBooking(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (p.get("contact") === "1" && isAuthenticated) {
      setShowContact(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isAuthenticated]);

  const handleBookClick = () => {
    if (!isAuthenticated) { setAuthIntent("book"); setShowAuth(true); return; }
    setShowBooking(true);
  };

  const handleContactClick = () => {
    trackEvent("contact_host_click", { spaceId: space!.id, spaceName: space!.name });
    if (!isAuthenticated) { setAuthIntent("contact"); setShowAuth(true); return; }
    setShowContact(true);
  };

  /* ── share ── */
  const handleShare = async () => {
    if (!space) return;
    const url = `${window.location.origin}/spaces/${space.slug}`;
    const shareData = { title: space.name, text: `Check out ${space.name} on Align Workspaces`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Space link copied to clipboard" });
    }
  };

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  /* ── loading / error ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c4956a]" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center gap-4 px-4">
        <Building2 className="w-12 h-12 text-stone-300" />
        <h1 className="font-serif text-xl font-semibold text-stone-700">Space not found</h1>
        <p className="text-sm text-stone-500 text-center">This space may no longer be available.</p>
        <Link href="/workspaces" className="text-sm text-[#c4956a] font-medium hover:underline" data-testid="link-back-browse">
          Back to Browse
        </Link>
      </div>
    );
  }

  /* ── derived data ── */
  const paletteData = parseColorPalette(space.colorPalette);
  const images = space.imageUrls || [];
  const highlights = getSpaceHighlights(space);
  const descriptionParagraphs = space.description.split(/\n\n+/);
  const hasMoreDescription = descriptionParagraphs.length > 1;
  const primaryTag = space.tags && space.tags.length > 0 ? space.tags[space.tags.length - 1] : space.type;

  const schedule: WeekSchedule | null = (() => {
    try { return space.availabilitySchedule ? JSON.parse(space.availabilitySchedule) : null; } catch { return null; }
  })();
  const bufferMinutes = space.bufferMinutes ?? 15;

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-20 lg:pb-0" data-testid="space-detail-page">
      {/* ─── Sticky header ─── */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIndicator />
            <button
              onClick={smartBack}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* ─── Hero image ─── */}
        {images.length > 0 && (
          <div className="relative">
            <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
              <img
                src={images[0]}
                alt={space.name}
                className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-500"
                onClick={() => { setCarouselIndex(0); setCarouselOpen(true); }}
                data-testid="img-space-hero"
              />
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {images.slice(1, 4).map((url, i) => (
                  <div key={i} className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={url}
                      alt={`${space.name} ${i + 2}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => { setCarouselIndex(i + 1); setCarouselOpen(true); }}
                      data-testid={`img-space-thumb-${i}`}
                    />
                    {i === 2 && images.length > 4 && (
                      <button
                        onClick={() => { setCarouselIndex(3); setCarouselOpen(true); }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-semibold hover:bg-black/50 transition-colors"
                        data-testid="button-show-all-photos"
                      >
                        +{images.length - 4} more
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Single primary category tag — frosted glass (top-left) */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-[8px] text-white shadow-sm">
                {TYPE_LABELS[primaryTag] || primaryTag}
              </span>
            </div>
            {/* Verified badge — frosted glass (top-right) */}
            {!space.isSample && (
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/20 backdrop-blur-[8px] text-xs font-semibold text-white px-2.5 py-1.5 rounded-full shadow-sm" data-testid="badge-verified">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </div>
            )}
          </div>
        )}

        {/* ─── Two-column content ─── */}
        <div className="px-4 py-6 sm:px-6">
          <div className="lg:flex lg:gap-10">
            {/* ── Left column ── */}
            <div className="lg:flex-1 min-w-0">
              {/* Title + location */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-2" data-testid="text-space-name">
                {space.name}
              </h1>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-stone-500 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{space.address}</span>
                </div>
                {/* Social Sharing */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors p-1.5 rounded-lg hover:bg-stone-100"
                    data-testid="button-share-trigger"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-stone-200 shadow-lg p-2 z-20 min-w-[180px]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({ title: "Link copied", description: "Space link copied to clipboard" });
                          setShowShareMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                        data-testid="button-share-copy"
                      >
                        <Copy className="w-4 h-4 text-stone-400" />
                        Copy link
                      </button>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${space.name} on Align Workspaces`)}&url=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                        data-testid="button-share-twitter"
                      >
                        <ExternalLink className="w-4 h-4 text-stone-400" />
                        Share on X
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                        data-testid="button-share-facebook"
                      >
                        <ExternalLink className="w-4 h-4 text-stone-400" />
                        Share on Facebook
                      </a>
                      <a
                        href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(images[0] || "")}&description=${encodeURIComponent(space.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                        data-testid="button-share-pinterest"
                      >
                        <ExternalLink className="w-4 h-4 text-stone-400" />
                        Share on Pinterest
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {space.targetProfession && (
                <p className="text-sm text-[#c4956a] font-medium mb-4">
                  Ideal for: {space.targetProfession}
                </p>
              )}

              {/* Mobile-only price/meta row */}
              <div className="mb-6 pb-6 border-b border-stone-200/60 lg:hidden">
                <div className="flex items-center gap-5 text-sm">
                  <div className="flex items-center gap-1.5 text-stone-800">
                    <DollarSign className="w-4 h-4 text-[#c4956a]" />
                    <span className="font-semibold">${space.pricePerHour}/hr</span>
                  </div>
                  {space.pricePerDay && (
                    <div className="text-stone-500">${space.pricePerDay}/day</div>
                  )}
                  {space.capacity && (
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Users className="w-4 h-4" />
                      Up to {space.capacity}
                    </div>
                  )}
                  {space.availableHours && (
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Clock className="w-4 h-4" />
                      <span>{space.availableHours}</span>
                    </div>
                  )}
                </div>
                {(space as any).recurringDiscountPercent > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs text-emerald-700 font-medium">
                      Save {(space as any).recurringDiscountPercent}% with a recurring booking
                      {(space as any).recurringDiscountAfter > 0 && (
                        <span className="text-emerald-600 font-normal"> (after {(space as any).recurringDiscountAfter} booking{(space as any).recurringDiscountAfter !== 1 ? "s" : ""})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Amenities (moved up, with icons) ── */}
              {space.amenities && space.amenities.length > 0 && (
                <div className="mb-6 pb-6 border-b border-stone-200/60">
                  <h2 className="text-sm font-semibold text-stone-800 mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                    {space.amenities.map((amenity, i) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                          <Icon className="w-4 h-4 text-[#c4956a]" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── About this space ── */}
              <div className="mb-6 pb-6 border-b border-stone-200/60">
                <h2 className="text-sm font-semibold text-stone-800 mb-4">About this space</h2>

                {/* Highlights grid */}
                {highlights.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-stone-700">
                        <div className="w-8 h-8 rounded-lg bg-[#c4956a]/10 flex items-center justify-center flex-shrink-0">
                          <h.icon className="w-4 h-4 text-[#c4956a]" />
                        </div>
                        <span>{h.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description with Read more */}
                <div className="text-sm text-stone-600 leading-relaxed">
                  <p>{descriptionParagraphs[0]}</p>
                  {hasMoreDescription && (
                    <>
                      <AnimatePresence>
                        {showFullDescription && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-3">
                              {descriptionParagraphs.slice(1).map((p, i) => (
                                <p key={i}>{p}</p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-[#c4956a] font-medium text-sm inline-flex items-center gap-1 hover:underline"
                      >
                        {showFullDescription ? "Show less" : "Read more"}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFullDescription ? "rotate-180" : ""}`} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Host card ── */}
              {(space.hostName || (space as any).hostProfile) && (() => {
                const profile = (space as any).hostProfile;
                const displayName = profile ? `${profile.firstName || ""} ${(profile.lastName || "")[0] || ""}`.trim() + "." : space.hostName;
                const initials = displayName ? displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "";
                return (
                  <div className="mb-6 pb-6 border-b border-stone-200/60">
                    <div className="flex items-center gap-3">
                      {profile?.profileImageUrl ? (
                        <img src={profile.profileImageUrl} alt={displayName || ""} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#c4956a]/15 flex items-center justify-center text-[#c4956a] font-semibold text-sm">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-stone-800">Hosted by {displayName}</p>
                        <p className="text-xs text-stone-400">Verified host</p>
                      </div>
                    </div>
                    {/* Host Badges */}
                    {hostBadges.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3" data-testid="host-badges">
                        {hostBadges.map((badge) => (
                          <span
                            key={badge.key}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              BADGE_COLORS[badge.key] || "bg-stone-50 text-stone-600 border-stone-200"
                            }`}
                            title={badge.description}
                          >
                            <Award className="w-3 h-3" />
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Host Response Metrics */}
                    {hostMetrics?.responseLabel && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-stone-500" data-testid="host-response-metrics">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{hostMetrics.responseLabel}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Mobile inline booking card ── */}
              <div className="lg:hidden mb-6">
                <BookingCard
                  space={space}
                  onBookClick={handleBookClick}
                  user={user}
                  favStatus={favStatus}
                  onToggleFavorite={() => toggleFavorite.mutate()}
                  onShare={handleShare}
                />
              </div>

              {/* ── Cancellation Policy ── */}
              {cancellationPolicy && (
                <div className="mb-6 pb-6 border-b border-stone-200/60" data-testid="cancellation-policy">
                  <div className="p-4 bg-stone-50/80 rounded-xl border border-stone-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-[#c4956a]" />
                      <h2 className="text-sm font-semibold text-stone-800">{cancellationPolicy.name}</h2>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{cancellationPolicy.description}</p>
                  </div>
                </div>
              )}

              {/* ── Sessions at this space (portfolio photos) ── */}
              {portfolioPhotos.length > 0 && (
                <div className="mb-6 pb-6 border-b border-stone-200/60">
                  <h2 className="text-sm font-semibold text-stone-800 mb-1 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#c4956a]" />
                    Sessions at this space
                  </h2>
                  <p className="text-xs text-stone-400 mb-3">
                    {portfolioPhotos.length} photo{portfolioPhotos.length !== 1 ? "s" : ""} from real sessions held here
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {portfolioPhotos.map((photo, i) => {
                      const crop = photo.cropPosition;
                      const cx = crop?.x ?? 50;
                      const cy = crop?.y ?? 50;
                      const zoom = crop?.zoom ?? 1;
                      const inset = zoom > 1 ? ((1 - 1 / zoom) / 2) * 100 : 0;
                      return (
                        <div key={photo.id} className="group cursor-pointer" onClick={() => { setPortfolioCarouselIndex(i); setPortfolioCarouselOpen(true); }}>
                          <div className="aspect-[3/4] overflow-hidden rounded-xl relative" data-testid={`img-portfolio-${photo.id}`}>
                            <img
                              src={photo.imageUrl}
                              alt={photo.title || `Photo ${i + 1} taken at ${space.name}`}
                              className="absolute object-cover group-hover:scale-105 transition-transform duration-300"
                              style={{
                                objectPosition: `${cx}% ${cy}%`,
                                top: `-${inset}%`,
                                left: `-${inset}%`,
                                width: `${100 + inset * 2}%`,
                                height: `${100 + inset * 2}%`,
                              }}
                              loading="lazy"
                            />
                          </div>
                          {photo.title && (
                            <p className="text-xs text-stone-500 mt-1.5 truncate">{photo.title}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Color palette (trimmed — no explanation paragraph) ── */}
              {paletteData && paletteData.colors?.length > 0 && (
                <div className="mb-6 p-4 bg-stone-50/80 rounded-xl border border-stone-100" data-testid="space-color-palette">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-[#c4956a]" />
                    <h2 className="text-sm font-semibold text-stone-800">Space Color Palette</h2>
                  </div>
                  <div className="flex items-center gap-5 mb-2">
                    {paletteData.colors.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: c.hex }} />
                        <span className="text-[10px] text-stone-500 font-medium">{c.name}</span>
                      </div>
                    ))}
                  </div>
                  {paletteData.feel && (
                    <p className="text-xs text-stone-500 italic leading-relaxed">{paletteData.feel}</p>
                  )}
                </div>
              )}

              {/* ── Contact CTA (replaces newsletter) ── */}
              {(!user || space.userId !== user.id) && (
                <div className="mb-6 p-5 bg-white rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Questions about this space?</p>
                    <p className="text-xs text-stone-500 mt-0.5">Send a message to the host</p>
                  </div>
                  <button
                    onClick={handleContactClick}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#c4956a] text-white text-sm font-medium hover:bg-[#b8845c] transition-colors flex-shrink-0"
                    data-testid="button-contact-host"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact host
                  </button>
                </div>
              )}

              {/* ── Reviews Section ── */}
              <div className="mb-6 pb-6 border-b border-stone-200/60" data-testid="reviews-section">
                <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">Reviews</h2>
                {reviewsData && reviewsData.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <StarRating rating={reviewsData.averageRating} size="md" />
                      <span className="text-sm font-semibold text-stone-800">{reviewsData.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-stone-500">({reviewsData.reviewCount} review{reviewsData.reviewCount !== 1 ? "s" : ""})</span>
                    </div>
                    <div className="space-y-4">
                      {reviewsData.reviews.map((review) => (
                        <div key={review.id} className="p-4 bg-white rounded-xl border border-stone-200/80">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#c4956a]/15 flex items-center justify-center text-[#c4956a] font-semibold text-xs">
                                {review.guestName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-stone-800">{review.guestName}</p>
                                <p className="text-xs text-stone-400">{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                              </div>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          {review.title && (
                            <p className="text-sm font-semibold text-stone-800 mb-1">{review.title}</p>
                          )}
                          <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
                          {review.hostResponse && (
                            <div className="mt-3 pl-3 border-l-2 border-[#c4956a]/30">
                              <p className="text-xs font-medium text-stone-700 mb-0.5">Host response</p>
                              <p className="text-xs text-stone-500 leading-relaxed">{review.hostResponse}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 py-4">
                    <p className="text-sm text-stone-500">No reviews yet</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                      New
                    </span>
                  </div>
                )}
              </div>

              {/* ── Leave a Review (for eligible users) ── */}
              {reviewableBooking && (
                <div className="mb-6 pb-6 border-b border-stone-200/60" data-testid="review-form">
                  <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">Leave a Review</h2>
                  <div className="p-4 bg-white rounded-xl border border-stone-200/80 space-y-4">
                    <div>
                      <p className="text-sm text-stone-600 mb-2">Your rating</p>
                      <ClickableStarRating rating={reviewRating} onRate={setReviewRating} />
                    </div>
                    <div>
                      <Input
                        placeholder="Review title (optional)"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="text-sm"
                        data-testid="input-review-title"
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Share your experience..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                        data-testid="input-review-comment"
                      />
                    </div>
                    <button
                      onClick={() => submitReviewMutation.mutate()}
                      disabled={submitReviewMutation.isPending || reviewRating === 0 || !reviewComment.trim()}
                      className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                      data-testid="button-submit-review"
                    >
                      {submitReviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                      Submit Review
                    </button>
                  </div>
                </div>
              )}

              {/* ── Work Created Here (Portfolio) ── */}
              {portfolioWork.length > 0 && (
                <div className="mb-6 pb-6 border-b border-stone-200/60" data-testid="portfolio-work">
                  <h2 className="font-serif text-lg font-semibold text-stone-900 mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c4956a]" />
                    Work Created Here
                  </h2>
                  <p className="text-xs text-stone-400 mb-3">
                    {portfolioWork.length} piece{portfolioWork.length !== 1 ? "s" : ""} from creators who used this space
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {portfolioWork.map((photo) => (
                      <div key={photo.id} className="group">
                        <div className="aspect-[3/4] overflow-hidden rounded-xl relative">
                          <img
                            src={photo.imageUrl}
                            alt={photo.title || "Portfolio work"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        {photo.title && (
                          <p className="text-xs text-stone-500 mt-1.5 truncate">{photo.title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column (desktop only) — sticky booking card ── */}
            <div className="hidden lg:block lg:w-[380px] lg:flex-shrink-0">
              <div className="sticky top-[80px]">
                <BookingCard
                  space={space}
                  onBookClick={handleBookClick}
                  user={user}
                  favStatus={favStatus}
                  onToggleFavorite={() => toggleFavorite.mutate()}
                  onShare={handleShare}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Similar Spaces (You might also like) ── */}
        {similarSpaces.length > 0 && (
          <div className="px-4 sm:px-6 pb-6" data-testid="similar-spaces">
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">You might also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {similarSpaces.slice(0, 4).map((similar) => (
                <Link
                  key={similar.id}
                  href={`/spaces/${similar.slug}`}
                  className="group block"
                  data-testid={`similar-space-${similar.id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl mb-2 bg-stone-100">
                    {similar.imageUrls && similar.imageUrls[0] ? (
                      <img
                        src={similar.imageUrls[0]}
                        alt={similar.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-stone-800 truncate group-hover:text-[#c4956a] transition-colors">
                    {similar.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-500">{TYPE_LABELS[similar.type] || similar.type}</span>
                    <span className="text-xs text-stone-300">&middot;</span>
                    <span className="text-xs font-medium text-stone-700">${similar.pricePerHour}/hr</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <SiteFooter />

      {/* ─── Mobile fixed bottom bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span className="text-lg font-bold text-stone-900">${space.pricePerHour}</span>
            <span className="text-sm text-stone-500">/hr</span>
            {space.pricePerDay && (
              <span className="text-xs text-stone-400 ml-2">${space.pricePerDay}/day</span>
            )}
          </div>
          <button
            onClick={handleBookClick}
            className="px-6 py-2.5 rounded-xl bg-[#c4956a] text-white text-sm font-semibold hover:bg-[#b8845c] transition-colors shadow-sm"
          >
            Request to book
          </button>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {showAuth && !isAuthenticated && (
          <MagicLinkModal
            spaceSlug={space.slug}
            intent={authIntent}
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBooking && isAuthenticated && (
          <BookingPopup
            space={space}
            onClose={() => setShowBooking(false)}
            schedule={schedule}
            bufferMinutes={bufferMinutes}
            bookMutation={bookMutation}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContact && isAuthenticated && (
          <ContactHostModal
            space={space}
            onClose={() => setShowContact(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Photo carousels ─── */}
      <AnimatePresence>
        {carouselOpen && images.length > 0 && (
          <PhotoCarousel
            images={images}
            spaceName={space.name}
            onClose={() => setCarouselOpen(false)}
            initialIndex={carouselIndex}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {portfolioCarouselOpen && portfolioPhotos.length > 0 && (
          <PhotoCarousel
            images={portfolioPhotos.map(p => p.imageUrl)}
            spaceName={`${space.name} — Sessions`}
            onClose={() => setPortfolioCarouselOpen(false)}
            initialIndex={portfolioCarouselIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
