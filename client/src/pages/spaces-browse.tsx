import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Building2,
  Dumbbell,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Wifi,
  Check,
  Send,
  Loader2,
  X,
  Images,
  Menu,
  User,
  Star,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Space } from "@shared/schema";

const SPACE_TYPES = [
  { key: "all", label: "All Spaces", icon: Building2 },
  { key: "office", label: "Offices", icon: Briefcase },
  { key: "gym", label: "Training Studios", icon: Dumbbell },
  { key: "meeting", label: "Meeting Rooms", icon: Building2 },
] as const;

const TYPE_LABELS: Record<string, string> = {
  office: "Office",
  gym: "Training Studio",
  meeting: "Meeting Room",
};

const TYPE_COLORS: Record<string, string> = {
  office: "bg-blue-50 text-blue-700",
  gym: "bg-emerald-50 text-emerald-700",
  meeting: "bg-amber-50 text-amber-700",
};

function PhotoCarousel({ images, spaceName, onClose }: { images: string[]; spaceName: string; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
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
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
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

function SpaceCard({ space }: { space: Space }) {
  const [expanded, setExpanded] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [showCarousel, setShowCarousel] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const pollRef = useRef<{ interval?: ReturnType<typeof setInterval>; timeout?: ReturnType<typeof setTimeout> }>({});
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const clearPolling = useCallback(() => {
    if (pollRef.current.interval) clearInterval(pollRef.current.interval);
    if (pollRef.current.timeout) clearTimeout(pollRef.current.timeout);
    pollRef.current = {};
  }, []);

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/spaces/${space.id}/book`, { message: bookingMessage });
    },
    onSuccess: () => {
      toast({ title: "Request sent!", description: "The host will be notified. Check your portal for updates." });
      setShowBooking(false);
      setShowAuthPrompt(false);
      setBookingMessage("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleBookClick = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      setExpanded(true);
      return;
    }
    setShowBooking(true);
  };

  const handleRegisterClick = () => {
    setAuthPending(true);
    const popup = window.open("/api/login", "alignAuth", "width=500,height=700,left=200,top=100");

    if (!popup) {
      setAuthPending(false);
      toast({ title: "Popup blocked", description: "Please allow popups for this site, or use the button below.", variant: "destructive" });
      return;
    }

    pollRef.current.interval = setInterval(async () => {
      if (popup.closed) {
        clearPolling();
        setAuthPending(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          if (userData && userData.id) {
            clearPolling();
            setAuthPending(false);
            setShowAuthPrompt(false);
            setShowBooking(true);
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            if (!popup.closed) popup.close();
          }
        }
      } catch {}
    }, 1500);

    pollRef.current.timeout = setTimeout(() => {
      clearPolling();
      setAuthPending(false);
    }, 120000);
  };

  const handleDismissAuth = () => {
    clearPolling();
    setAuthPending(false);
    setShowAuthPrompt(false);
  };

  useEffect(() => {
    if (isAuthenticated && showAuthPrompt) {
      clearPolling();
      setAuthPending(false);
      setShowAuthPrompt(false);
      setShowBooking(true);
    }
  }, [isAuthenticated, showAuthPrompt, clearPolling]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md transition-shadow duration-300"
      data-testid={`card-space-${space.id}`}
    >
      <div
        className="relative h-48 bg-stone-100 overflow-hidden cursor-pointer group"
        onClick={() => space.imageUrls && space.imageUrls.length > 0 && setShowCarousel(true)}
        data-testid={`image-space-${space.id}`}
      >
        {space.imageUrls && space.imageUrls.length > 0 ? (
          <>
            <img
              src={space.imageUrls[0]}
              alt={space.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs font-medium px-2.5 py-1.5 rounded-full backdrop-blur-sm" data-testid={`badge-photo-count-${space.id}`}>
              <Images className="w-3.5 h-3.5" />
              {space.imageUrls.length} {space.imageUrls.length === 1 ? "photo" : "photos"}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <div className="text-center">
              <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-400 font-medium">{TYPE_LABELS[space.type] || space.type}</p>
            </div>
          </div>
        )}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLORS[space.type] || "bg-stone-100 text-stone-700"}`}>
          {TYPE_LABELS[space.type] || space.type}
        </div>
        {space.isSample ? (
          <div className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            Sample
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showCarousel && space.imageUrls && space.imageUrls.length > 0 && (
          <PhotoCarousel
            images={space.imageUrls}
            spaceName={space.name}
            onClose={() => setShowCarousel(false)}
          />
        )}
      </AnimatePresence>

      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1" data-testid={`text-space-name-${space.id}`}>
          {space.name}
        </h3>

        <div className="flex items-center gap-1.5 text-foreground/50 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{space.neighborhood || space.address}</span>
        </div>

        <p className="text-foreground/60 text-sm leading-relaxed mb-4 line-clamp-2">
          {space.shortDescription || space.description}
        </p>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1.5 text-foreground/70">
            <DollarSign className="w-3.5 h-3.5 text-[#c4956a]" />
            <span className="font-semibold">${space.pricePerHour}/hr</span>
          </div>
          {space.pricePerDay && (
            <div className="flex items-center gap-1.5 text-foreground/50">
              <span>${space.pricePerDay}/day</span>
            </div>
          )}
          {space.capacity && (
            <div className="flex items-center gap-1.5 text-foreground/50">
              <Users className="w-3.5 h-3.5" />
              <span>Up to {space.capacity}</span>
            </div>
          )}
        </div>

        {space.targetProfession && (
          <p className="text-xs text-[#c4956a] font-medium mb-3">
            Ideal for: {space.targetProfession}
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full py-2.5 rounded-lg border border-stone-300 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-400 active:bg-stone-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          data-testid={`button-expand-space-${space.id}`}
        >
          {expanded ? "Show less" : "View details"}
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-stone-100 mt-4 space-y-3">
                <p className="text-sm text-foreground/60 leading-relaxed">{space.description}</p>

                {space.availableHours && (
                  <div className="flex items-start gap-2 text-sm text-foreground/60">
                    <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{space.availableHours}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-sm text-foreground/60">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{space.address}</span>
                </div>

                {space.hostName && (
                  <p className="text-xs text-foreground/40">
                    Hosted by {space.hostName}
                  </p>
                )}

                {space.amenities && space.amenities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {space.amenities.map((amenity, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs bg-stone-50 text-foreground/60 px-2.5 py-1 rounded-full"
                        >
                          <Check className="w-3 h-3 text-[#c4956a]" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {showAuthPrompt && !isAuthenticated ? (
                  <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-lg p-5 mt-2 space-y-4 border border-stone-200/60" data-testid={`auth-prompt-${space.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#c4956a]/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#c4956a]" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Register to Schedule</p>
                      </div>
                      <button onClick={handleDismissAuth} className="text-foreground/40 hover:text-foreground/60">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed">
                      Create a free account to send booking requests, chat with hosts, and manage your reservations.
                    </p>
                    <Button
                      onClick={handleRegisterClick}
                      disabled={authPending}
                      className="w-full bg-[#c4956a] text-white hover:bg-[#b3845d]"
                      data-testid={`button-register-${space.id}`}
                    >
                      {authPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Waiting for sign in...</>
                      ) : (
                        <><User className="w-4 h-4 mr-2" /> Create Account / Sign In</>
                      )}
                    </Button>
                    {authPending && (
                      <p className="text-[10px] text-foreground/40 text-center">
                        Complete sign in in the popup window. This page will update automatically.
                      </p>
                    )}
                  </div>
                ) : !showBooking ? (
                  <button
                    onClick={handleBookClick}
                    className="inline-flex items-center gap-2 text-sm bg-foreground text-background px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium mt-2"
                    data-testid={`button-book-space-${space.id}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Request to Book
                  </button>
                ) : (
                  <div className="bg-stone-50 rounded-lg p-4 mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Send a message to the host</p>
                      <button onClick={() => setShowBooking(false)} className="text-foreground/40 hover:text-foreground/60">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Textarea
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                      placeholder={`Hi, I'm interested in booking ${space.name}. I'd like to discuss available dates and times.`}
                      rows={3}
                      className="text-sm bg-white"
                      data-testid={`input-booking-message-${space.id}`}
                    />
                    <Button
                      onClick={() => bookMutation.mutate()}
                      disabled={bookMutation.isPending}
                      className="w-full bg-foreground text-background hover:opacity-90"
                      data-testid={`button-submit-booking-${space.id}`}
                    >
                      {bookMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" /> Send Request</>
                      )}
                    </Button>
                    <p className="text-[10px] text-foreground/40 text-center">You'll be able to chat with the host in your client portal.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SpacesBrowsePage() {
  const [activeType, setActiveType] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: allSpaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = activeType === "all"
    ? allSpaces
    : allSpaces.filter(s => s.type === activeType);

  const typeCounts = SPACE_TYPES.map(t => ({
    ...t,
    count: t.key === "all" ? allSpaces.length : allSpaces.filter(s => s.type === t.key).length,
  }));

  useEffect(() => {
    document.title = "Browse Spaces | Align Spaces — Miami Workspaces for Professionals";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/spaces">
            <button className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="link-back-spaces">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </Link>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Align Spaces</span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-browse-menu"
              className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="hidden sm:inline">Menu</span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[200px] z-50"
                >
                  <Link href="/portraits">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-browse">
                      <Camera className="w-4 h-4" />
                      Align Portraits
                    </button>
                  </Link>
                  <Link href="/spaces">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-browse">
                      <Building2 className="w-4 h-4" />
                      Align Spaces
                    </button>
                  </Link>
                  <Link href="/portal">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-browse">
                      <User className="w-4 h-4" />
                      Client Portal
                    </button>
                  </Link>
                  <Link href="/featured">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-browse">
                      <Star className="w-4 h-4" />
                      Featured Pros
                    </button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold mb-3">Miami Workspaces</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold mb-4" data-testid="text-spaces-heading">
            Find Your Space
          </h1>
          <p className="text-foreground/50 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Professional workspaces in Miami built for therapists, trainers, consultants, and small business owners. Rent by the hour or the day.
          </p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {typeCounts.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              data-testid={`button-filter-${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 ${
                activeType === key
                  ? "bg-foreground text-background font-medium"
                  : "bg-stone-100 text-foreground/60 hover:bg-stone-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs ${activeType === key ? "text-background/60" : "text-foreground/30"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-stone-200/80 overflow-hidden animate-pulse">
                <div className="h-48 bg-stone-100" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-stone-100 rounded w-3/4" />
                  <div className="h-4 bg-stone-100 rounded w-1/2" />
                  <div className="h-4 bg-stone-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-foreground/50 text-sm">No spaces found for this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((space, i) => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <SpaceCard space={space} />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 pb-12"
        >
          <div className="bg-stone-50 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-3" data-testid="text-list-space-heading">
              Have a space to share?
            </h2>
            <p className="text-foreground/50 text-sm mb-6 max-w-md mx-auto">
              If you own a workspace in Miami that could serve small business professionals, we'd love to hear from you.
            </p>
            <Link href="/portal">
              <button
                className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-foreground text-background px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity font-medium"
                data-testid="button-list-space"
              >
                List Your Space
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
