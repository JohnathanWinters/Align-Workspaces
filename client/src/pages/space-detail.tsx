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
  Check,
  Send,
  Loader2,
  X,
  Camera,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Palette,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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
  office: "Office",
  gym: "Training Studio",
  meeting: "Meeting Room",
  art_studio: "Art Studio",
  photo_studio: "Photo/Video Studio",
};

const TYPE_COLORS: Record<string, string> = {
  office: "bg-blue-50 text-blue-700",
  gym: "bg-emerald-50 text-emerald-700",
  meeting: "bg-amber-50 text-amber-700",
  art_studio: "bg-purple-50 text-purple-700",
  photo_studio: "bg-rose-50 text-rose-700",
};

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

function MagicLinkModal({ spaceSlug, onClose, onSuccess }: { spaceSlug: string; onClose: () => void; onSuccess: () => void }) {
  const [magicEmail, setMagicEmail] = useState("");
  const [magicName, setMagicName] = useState("");
  const [magicStep, setMagicStep] = useState<"email" | "name" | "sent">("email");
  const [magicError, setMagicError] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  const sendMagicLink = async (email: string, firstName?: string) => {
    setMagicLoading(true);
    setMagicError("");
    try {
      const returnTo = `/spaces/${encodeURIComponent(spaceSlug)}?book=1`;
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
                <h3 className="font-serif text-lg font-semibold">Sign in to book</h3>
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

function BookingSection({ space }: { space: Space }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const schedule: WeekSchedule | null = (() => {
    try { return space.availabilitySchedule ? JSON.parse(space.availabilitySchedule) : null; } catch { return null; }
  })();
  const bufferMinutes = space.bufferMinutes ?? 15;

  const bookMutation = useMutation({
    mutationFn: async (params: { bookingDate: string; bookingStartTime: string; bookingHours: number }) => {
      const res = await apiRequest("POST", `/api/spaces/${space.id}/book`, params);
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
    const params = new URLSearchParams(window.location.search);
    if (params.get("book") === "1" && isAuthenticated) {
      setShowBooking(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isAuthenticated]);

  const handleBookClick = () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    setShowBooking(true);
  };

  return (
    <>
      <button
        onClick={handleBookClick}
        className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 active:bg-stone-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        data-testid="button-book-space"
      >
        <Send className="w-4 h-4" />
        Book This Space
      </button>

      <AnimatePresence>
        {showAuth && !isAuthenticated && (
          <MagicLinkModal
            spaceSlug={space.slug}
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
    </>
  );
}

function BookingPopup({ space, onClose, schedule, bufferMinutes, bookMutation }: {
  space: Space; onClose: () => void; schedule: WeekSchedule | null; bufferMinutes: number; bookMutation: any;
}) {
  const [step, setStep] = useState<"date" | "date-check" | "time" | "time-check" | "confirm">("date");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingHours, setBookingHours] = useState(1);
  const [direction, setDirection] = useState(1);

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

  const availableSlots = bookingDate ? getAvailableTimeSlots(effectiveSchedule, bookingDate, bufferMinutes) : [];
  const maxHours = bookingDate && bookingStartTime ? getMaxHoursFromSlot(effectiveSchedule, bookingDate, bookingStartTime, bufferMinutes) : 8;
  const basePriceCents = space.pricePerHour * 100 * bookingHours;
  const renterFee = Math.round(basePriceCents * 0.07);
  const totalCharge = basePriceCents + renterFee;

  const isDateAvailable = (date: Date): boolean => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayKey = getDayOfWeek(dateStr);
    return dayKey ? effectiveSchedule[dayKey] !== null : false;
  };

  const stepIndex = step === "date" || step === "date-check" ? 0 : step === "time" || step === "time-check" ? 1 : 2;
  const steps = [
    { label: "Date", icon: CalendarDays },
    { label: "Time", icon: Clock },
    { label: "Confirm", icon: CreditCard },
  ];

  const goBack = () => {
    setDirection(-1);
    if (step === "time") { setStep("date"); setBookingDate(""); setBookingStartTime(""); }
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
              <span className="mx-1">·</span>
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
                <p className="text-sm font-medium text-stone-600 text-center">When would you like to visit?</p>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={bookingDate ? new Date(bookingDate + "T12:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        setBookingDate(`${yyyy}-${mm}-${dd}`);
                        setBookingStartTime("");
                        setBookingHours(1);
                        setDirection(1);
                        setStep("date-check");
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
              </motion.div>
            )}
            {step === "date-check" && (
              <motion.div key="date-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StepCheckmark onComplete={() => setStep("time")} />
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
                  {new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
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
                  <p className="text-sm font-medium text-stone-600">Confirm your booking</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Date</span>
                    <span className="font-medium text-stone-800">
                      {new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Time</span>
                    <span className="font-medium text-stone-800">{formatTime(bookingStartTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-stone-500">Duration</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setBookingHours(Math.max(1, bookingHours - 1))} className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold" data-testid="button-hours-minus">−</button>
                      <span className="font-medium text-stone-800 w-12 text-center">{bookingHours} hr{bookingHours > 1 ? "s" : ""}</span>
                      <button onClick={() => setBookingHours(Math.min(maxHours, bookingHours + 1))} className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-sm font-bold" data-testid="button-hours-plus">+</button>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">${space.pricePerHour}/hr × {bookingHours} hr{bookingHours > 1 ? "s" : ""}</span>
                      <span className="text-stone-700"><AnimatedPrice value={basePriceCents} /></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Service fee (7%)</span>
                      <span className="text-stone-700"><AnimatedPrice value={renterFee} /></span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-stone-200">
                      <span className="text-stone-800">Total</span>
                      <span className="text-[#c4956a]"><AnimatedPrice value={totalCharge} /></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => bookMutation.mutate({ bookingDate, bookingStartTime, bookingHours })}
                  disabled={bookMutation.isPending}
                  className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  data-testid="button-confirm-booking"
                >
                  {bookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Pay & Book
                </button>
                <p className="text-[10px] text-stone-400 text-center">You'll be redirected to Stripe for secure payment</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SpaceDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [, navigate] = useLocation();
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [portfolioCarouselOpen, setPortfolioCarouselOpen] = useState(false);
  const [portfolioCarouselIndex, setPortfolioCarouselIndex] = useState(0);

  const { data: space, isLoading, error } = useQuery<Space>({
    queryKey: ["/api/spaces", slug],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${slug}`);
      if (!res.ok) throw new Error("Space not found");
      return res.json();
    },
  });

  const { data: portfolioPhotos = [] } = useQuery<Array<{ id: string; imageUrl: string }>>({
    queryKey: ["/api/portfolio-photos/by-space", space?.id],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio-photos/by-space/${space!.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!space?.id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

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
        <Link href="/browse" className="text-sm text-[#c4956a] font-medium hover:underline" data-testid="link-back-browse">
          Back to Browse
        </Link>
      </div>
    );
  }

  const paletteData = parseColorPalette(space.colorPalette);

  const images = space.imageUrls || [];

  return (
    <div className="min-h-screen bg-[#faf6f1]" data-testid="space-detail-page">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => { if (window.history.length > 1) window.history.back(); else navigate("/browse"); }}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link href="/">
            <img src="/images/logo-align-mark.png" alt="Align" className="h-7 rounded" />
          </Link>
          <UserIndicator />
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
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
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${TYPE_COLORS[space.type] || "bg-stone-100 text-stone-700"}`}>
              {TYPE_LABELS[space.type] || space.type}
            </div>
            {!space.isSample && (
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-emerald-700 px-2.5 py-1 rounded-full shadow-sm" data-testid="badge-verified">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified by Align
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-6 sm:px-6">
          <div className="sm:flex sm:gap-8">
            <div className="sm:flex-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-2" data-testid="text-space-name">
                {space.name}
              </h1>

              <div className="flex items-center gap-2 text-stone-500 text-sm mb-4">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{space.address}</span>
              </div>

              <div className="flex items-center gap-5 text-sm mb-6 pb-6 border-b border-stone-200/60">
                <div className="flex items-center gap-1.5 text-stone-800">
                  <DollarSign className="w-4 h-4 text-[#c4956a]" />
                  <span className="font-semibold">${space.pricePerHour}/hr</span>
                </div>
                {space.pricePerDay && (
                  <div className="text-stone-500">
                    ${space.pricePerDay}/day
                  </div>
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

              {space.targetProfession && (
                <p className="text-sm text-[#c4956a] font-medium mb-4">
                  Ideal for: {space.targetProfession}
                </p>
              )}

              <div className="mb-6">
                <h2 className="text-sm font-semibold text-stone-800 mb-3">About this space</h2>
                <div className="text-sm text-stone-600 leading-relaxed">
                  {space.description.split(/\n\n+/).map((paragraph, i) => (
                    <p key={i} className={i > 0 ? "mt-3" : ""}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {space.amenities && space.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-stone-800 mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {space.amenities.map((amenity, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full">
                        <Check className="w-3 h-3 text-[#c4956a]" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {paletteData && paletteData.colors?.length > 0 && (
                <div className="mb-6 p-4 bg-stone-50/80 rounded-xl border border-stone-100" data-testid="space-color-palette">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-4 h-4 text-[#c4956a]" />
                    <h2 className="text-sm font-semibold text-stone-800">Space Color Palette</h2>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-4">Colors shape how clients feel in your space — they influence mood, trust, and comfort</p>
                  <div className="flex items-center gap-5 mb-3">
                    {paletteData.colors.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="w-12 h-12 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: c.hex }} />
                        <span className="text-[10px] text-stone-500 font-medium">{c.name}</span>
                      </div>
                    ))}
                  </div>
                  {paletteData.feel && (
                    <p className="text-sm text-stone-500 leading-relaxed italic">{paletteData.feel}</p>
                  )}
                  {paletteData.explanation && (
                    <div className="mt-3 pt-3 border-t border-stone-200/60">
                      <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">How These Colors Work Together</p>
                      <p className="text-xs text-stone-500 leading-relaxed">{paletteData.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {space.hostName && (
                <div className="mb-6 pb-6 border-b border-stone-200/60">
                  <p className="text-sm text-stone-500">Hosted by <span className="font-medium text-stone-700">{space.hostName}</span></p>
                </div>
              )}

              {portfolioPhotos.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-stone-800 mb-1 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#c4956a]" />
                    Photos taken at this space
                  </h2>
                  <p className="text-xs text-stone-400 mb-3">
                    {portfolioPhotos.length} professional photo{portfolioPhotos.length !== 1 ? "s" : ""} from sessions held here
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {portfolioPhotos.map((photo, i) => (
                      <div
                        key={photo.id}
                        className="aspect-[3/4] overflow-hidden rounded-lg cursor-pointer group"
                        onClick={() => { setPortfolioCarouselIndex(i); setPortfolioCarouselOpen(true); }}
                        data-testid={`img-portfolio-${photo.id}`}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={`Photo ${i + 1} taken at ${space.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:w-[280px] sm:flex-shrink-0">
              <div className="sm:sticky sm:top-20">
                <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm mb-4">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-stone-900">${space.pricePerHour}</span>
                    <span className="text-sm text-stone-500">/hr</span>
                  </div>
                  {space.pricePerDay && (
                    <p className="text-xs text-stone-400 mb-4">${space.pricePerDay}/day also available</p>
                  )}
                  <BookingSection space={space} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />

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
            spaceName={`${space.name} — Portfolio`}
            onClose={() => setPortfolioCarouselOpen(false)}
            initialIndex={portfolioCarouselIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
