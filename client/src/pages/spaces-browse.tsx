import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
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
  Palette,
  Map as MapIcon,
  List,
  SlidersHorizontal,
  Navigation,
  ArrowUpDown,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  Shield,
  Info,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MIAMI_ZIP_COORDS: Record<string, [number, number]> = {
  "33101": [25.7743, -80.1937], "33109": [25.7617, -80.1367], "33125": [25.7743, -80.2234],
  "33126": [25.7743, -80.2972], "33127": [25.7985, -80.1996], "33128": [25.7743, -80.1937],
  "33129": [25.7529, -80.2011], "33130": [25.7650, -80.2011], "33131": [25.7650, -80.1899],
  "33132": [25.7850, -80.1860], "33133": [25.7270, -80.2417], "33134": [25.7496, -80.2584],
  "33135": [25.7640, -80.2234], "33136": [25.7850, -80.2011], "33137": [25.8100, -80.1899],
  "33138": [25.8200, -80.1780], "33139": [25.7823, -80.1340], "33140": [25.8120, -80.1300],
  "33141": [25.8480, -80.1410], "33142": [25.8120, -80.2234], "33143": [25.7100, -80.2800],
  "33144": [25.7600, -80.2972], "33145": [25.7500, -80.2400], "33146": [25.7200, -80.2800],
  "33147": [25.8400, -80.2400], "33149": [25.7250, -80.1600], "33150": [25.8500, -80.2000],
  "33154": [25.8780, -80.1410], "33155": [25.7350, -80.3100], "33156": [25.6700, -80.3100],
  "33157": [25.6200, -80.3500], "33158": [25.6400, -80.3100], "33160": [25.9300, -80.1500],
  "33161": [25.8900, -80.1780], "33162": [25.9200, -80.1780], "33165": [25.7400, -80.3500],
  "33166": [25.8200, -80.3200], "33167": [25.8800, -80.2200], "33168": [25.8700, -80.2100],
  "33169": [25.9400, -80.2200], "33170": [25.5600, -80.4000], "33172": [25.7700, -80.3700],
  "33173": [25.7000, -80.3500], "33174": [25.7600, -80.3500], "33175": [25.7200, -80.3700],
  "33176": [25.6600, -80.3500], "33177": [25.6000, -80.3700], "33178": [25.7900, -80.3700],
  "33179": [25.9600, -80.2000], "33180": [25.9400, -80.1500], "33181": [25.9000, -80.1500],
  "33182": [25.7200, -80.3900], "33183": [25.7000, -80.3700], "33184": [25.7600, -80.3700],
  "33185": [25.7200, -80.3700], "33186": [25.6600, -80.3700], "33187": [25.6200, -80.3900],
  "33189": [25.5800, -80.3500], "33190": [25.5600, -80.3200], "33193": [25.6800, -80.3900],
  "33194": [25.7200, -80.4200], "33196": [25.6600, -80.4200], "33199": [25.7550, -80.3730],
};

function getZipCoords(zip: string): [number, number] | null {
  return MIAMI_ZIP_COORDS[zip] || null;
}

const SPACE_TYPES = [
  { key: "all", label: "All Spaces", icon: Building2 },
  { key: "office", label: "Offices", icon: Briefcase },
  { key: "gym", label: "Training Studios", icon: Dumbbell },
  { key: "meeting", label: "Meeting Rooms", icon: Building2 },
  { key: "art_studio", label: "Art Studios", icon: Palette },
  { key: "photo_studio", label: "Photo/Video Studios", icon: Camera },
] as const;

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

function createPriceIcon(price: number, _type: string, isActive: boolean) {
  const priceStr = `$${price}`;
  const width = priceStr.length * 9 + 20;
  return L.divIcon({
    className: "price-marker",
    html: `<div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${width}px;
      height: 28px;
      background: ${isActive ? "#c4956a" : "#faf6f1"};
      color: ${isActive ? "#fff" : "#c4956a"};
      border: 1.5px solid ${isActive ? "#b3845d" : "#d4b896"};
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,${isActive ? "0.25" : "0.1"});
      transform: ${isActive ? "scale(1.15)" : "scale(1)"};
      transition: all 0.2s ease;
      cursor: pointer;
    ">${priceStr}</div>`,
    iconSize: [width, 28],
    iconAnchor: [width / 2, 14],
  });
}

function MapResizeHandler({ visible }: { visible: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (visible) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [visible, map]);
  return null;
}

function MapBoundsUpdater({ spaces }: { spaces: Space[] }) {
  const map = useMap();
  const boundsKey = useMemo(() => {
    return spaces
      .filter(s => s.latitude && s.longitude)
      .map(s => `${s.id}`)
      .sort()
      .join(",");
  }, [spaces]);

  useEffect(() => {
    const coords = spaces
      .filter(s => s.latitude && s.longitude)
      .map(s => {
        const lat = parseFloat(s.latitude!);
        const lng = parseFloat(s.longitude!);
        return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] as [number, number] : null;
      })
      .filter((c): c is [number, number] => c !== null);
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [boundsKey, map]);
  return null;
}

function SpacesMap({ spaces, hoveredId, onMarkerClick, visible = true }: { spaces: Space[]; hoveredId: string | null; onMarkerClick: (id: string) => void; visible?: boolean }) {
  const mappable = useMemo(() => spaces.filter(s => {
    if (!s.latitude || !s.longitude) return false;
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }), [spaces]);

  if (mappable.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <MapIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-400">No locations to display</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[25.76, -80.20]}
      zoom={12}
      className="w-full h-full"
      zoomControl={false}
      data-testid="spaces-map"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapResizeHandler visible={visible} />
      <MapBoundsUpdater spaces={mappable} />
      {mappable.map(space => (
        <Marker
          key={space.id}
          position={[parseFloat(space.latitude!), parseFloat(space.longitude!)]}
          icon={createPriceIcon(space.pricePerHour, space.type, space.id === hoveredId)}
          zIndexOffset={space.id === hoveredId ? 1000 : 0}
          eventHandlers={{
            click: () => onMarkerClick(space.id),
          }}
        >
          <Popup>
            <div className="min-w-[180px]" data-testid={`popup-space-${space.id}`}>
              {space.imageUrls && space.imageUrls[0] && (
                <img src={space.imageUrls[0]} alt={space.name} className="w-full h-24 object-cover rounded-md mb-2" />
              )}
              <p className="font-semibold text-sm mb-0.5">{space.name}</p>
              <p className="text-xs text-gray-500 mb-1">{space.neighborhood || space.address}</p>
              <p className="text-sm font-bold text-[#c4956a]">${space.pricePerHour}/hr</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

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

function SpaceCard({ space, onHover, onLeave, isHighlighted, distance, portfolioPhotoCount, autoBook }: { space: Space; onHover?: (id: string) => void; onLeave?: () => void; isHighlighted?: boolean; distance?: number | null; portfolioPhotoCount?: number; autoBook?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(!!autoBook);
  const [showBooking, setShowBooking] = useState(!!(autoBook && isAuthenticated));
  const [showCarousel, setShowCarousel] = useState(false);
  const [cardPhotoIndex, setCardPhotoIndex] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(!!(autoBook && !isAuthenticated));
  const [authPending, setAuthPending] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [spacePhotos, setSpacePhotos] = useState<Array<{ id: string; imageUrl: string }>>([]);
  const [showSpacePhotos, setShowSpacePhotos] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const pollRef = useRef<{ interval?: ReturnType<typeof setInterval>; timeout?: ReturnType<typeof setTimeout> }>({});
  const { toast } = useToast();

  const clearPolling = useCallback(() => {
    if (pollRef.current.interval) clearInterval(pollRef.current.interval);
    if (pollRef.current.timeout) clearTimeout(pollRef.current.timeout);
    pollRef.current = {};
  }, []);

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  const schedule: WeekSchedule | null = (() => {
    try { return space.availabilitySchedule ? JSON.parse(space.availabilitySchedule) : null; } catch { return null; }
  })();

  const bufferMinutes = space.bufferMinutes ?? 15;

  const bookMutation = useMutation({
    mutationFn: async (params: { bookingDate: string; bookingStartTime: string; bookingHours: number }) => {
      const res = await apiRequest("POST", `/api/spaces/${space.id}/book`, {
        bookingDate: params.bookingDate,
        bookingStartTime: params.bookingStartTime,
        bookingHours: params.bookingHours,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: "Booking created", description: "Check your portal for updates." });
        setShowBooking(false);
        setShowAuthPrompt(false);
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleViewPhotos = async () => {
    if (spacePhotos.length > 0) {
      setShowSpacePhotos(true);
      return;
    }
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/portfolio-photos/by-space/${space.id}`);
      if (res.ok) {
        const photos = await res.json();
        setSpacePhotos(photos);
        if (photos.length > 0) {
          setShowSpacePhotos(true);
        } else {
          toast({ title: "No photos yet", description: "No portfolio photos have been linked to this space yet." });
        }
      }
    } catch {}
    setLoadingPhotos(false);
  };

  const handleBookClick = () => {
    if (!isAuthenticated) {
      const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        const returnPath = `/browse?book=${encodeURIComponent(space.id)}`;
        window.location.href = `/api/login?returnTo=${encodeURIComponent(returnPath)}`;
        return;
      }
      setShowAuthPrompt(true);
      setExpanded(true);
      return;
    }
    setShowBooking(true);
  };

  const handleRegisterClick = () => {
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
      const returnPath = `/browse?book=${encodeURIComponent(space.id)}`;
      window.location.href = `/api/login?returnTo=${encodeURIComponent(returnPath)}`;
      return;
    }

    setAuthPending(true);
    const popup = window.open("/api/login?returnTo=/auth-success", "alignAuth", "width=500,height=700,left=200,top=100");

    if (!popup || popup.closed) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/api/login?returnTo=${encodeURIComponent(returnPath)}`;
      return;
    }

    pollRef.current.interval = setInterval(async () => {
      if (popup.closed) {
        clearPolling();
        setAuthPending(false);
        try {
          const res = await fetch("/api/auth/user", { credentials: "include" });
          if (res.ok) {
            const userData = await res.json();
            if (userData?.id) {
              setShowAuthPrompt(false);
              setShowBooking(true);
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }
          }
        } catch {}
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
      className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full ${isHighlighted ? "border-[#c4956a] shadow-md ring-1 ring-[#c4956a]/20" : "border-stone-200/80"}`}
      data-testid={`card-space-${space.id}`}
      onMouseEnter={() => onHover?.(space.id)}
      onMouseLeave={() => onLeave?.()}
    >
      <div
        className="relative h-48 bg-stone-100 overflow-hidden group"
        data-testid={`image-space-${space.id}`}
      >
        {space.imageUrls && space.imageUrls.length > 0 ? (
          <>
            <img
              src={space.imageUrls[cardPhotoIndex] || space.imageUrls[0]}
              alt={`${space.name} - Photo ${cardPhotoIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onClick={() => setShowCarousel(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
            {space.imageUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCardPhotoIndex((cardPhotoIndex - 1 + space.imageUrls!.length) % space.imageUrls!.length); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  data-testid={`button-photo-prev-${space.id}`}
                >
                  <ChevronLeft className="w-4 h-4 text-stone-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCardPhotoIndex((cardPhotoIndex + 1) % space.imageUrls!.length); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  data-testid={`button-photo-next-${space.id}`}
                >
                  <ChevronRight className="w-4 h-4 text-stone-700" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {space.imageUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCardPhotoIndex(i); }}
                      className={`rounded-full transition-all duration-200 ${i === cardPhotoIndex ? "w-2 h-2 bg-white shadow-sm" : "w-1.5 h-1.5 bg-white/60 hover:bg-white/80"}`}
                      data-testid={`button-photo-dot-${space.id}-${i}`}
                    />
                  ))}
                </div>
              </>
            )}
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
        ) : (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-emerald-700 px-2 py-1 rounded-full shadow-sm" data-testid={`badge-verified-${space.id}`}>
            <BadgeCheck className="w-3 h-3" />
            Verified
          </div>
        )}
        {(portfolioPhotoCount ?? 0) > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleViewPhotos(); }}
            className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full hover:bg-black/75 transition-colors z-10"
            data-testid={`badge-photos-${space.id}`}
          >
            <Camera className="w-3 h-3" />
            {portfolioPhotoCount} photo{portfolioPhotoCount !== 1 ? "s" : ""}
          </button>
        )}
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

      <AnimatePresence>
        {showSpacePhotos && spacePhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
            onClick={() => setShowSpacePhotos(false)}
          >
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <div>
                <p className="text-white font-serif text-lg">{space.name}</p>
                <p className="text-white/60 text-xs">{spacePhotos.length} photo{spacePhotos.length !== 1 ? "s" : ""} taken at this space</p>
              </div>
              <button onClick={() => setShowSpacePhotos(false)} className="text-white/60 hover:text-white p-2" data-testid="button-close-space-photos">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6" onClick={e => e.stopPropagation()}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-4xl mx-auto">
                {spacePhotos.map((photo, i) => (
                  <div key={photo.id} className="aspect-[3/4] rounded-lg overflow-hidden bg-white/5" data-testid={`grid-space-photo-${i}`}>
                    <img
                      src={photo.imageUrl}
                      alt={`Photo ${i + 1} at ${space.name}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1" data-testid={`text-space-name-${space.id}`}>
          {space.name}
        </h3>

        <div className="flex items-center gap-1.5 text-foreground/50 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{space.neighborhood || space.address}</span>
          {distance != null && (
            <span className="ml-auto text-xs text-[#c4956a] font-medium whitespace-nowrap flex-shrink-0" data-testid={`text-distance-${space.id}`}>
              {distance < 0.1 ? "< 0.1" : distance.toFixed(1)} mi
            </span>
          )}
        </div>

        <p className="text-foreground/60 text-sm leading-relaxed mb-4 line-clamp-2 whitespace-pre-line">
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

        {space.amenities && space.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {space.amenities.slice(0, 3).map((amenity, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-stone-50 text-foreground/55 px-2 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5 text-[#c4956a]" />
                {amenity}
              </span>
            ))}
            {space.amenities.length > 3 && (
              <span className="text-[11px] text-foreground/35 px-1 py-0.5">+{space.amenities.length - 3} more</span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2.5 rounded-lg border border-stone-300 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-400 active:bg-stone-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            data-testid={`button-expand-space-${space.id}`}
          >
            {expanded ? "Show less" : "Details"}
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
          <button
            onClick={handleBookClick}
            className="flex-1 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 active:opacity-80 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            data-testid={`button-book-card-${space.id}`}
          >
            <Send className="w-3.5 h-3.5" />
            Book
          </button>
        </div>

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
                <div className="text-sm text-foreground/60 leading-relaxed">
                  {space.description.split(/\n\n+/).map((paragraph, i) => (
                    <p key={i} className={i > 0 ? "mt-3" : ""}>{paragraph}</p>
                  ))}
                </div>

                {(() => {
                  let paletteData: { colors: { hex: string; name: string }[]; feel: string } | null = null;
                  try { if (space.colorPalette) paletteData = JSON.parse(space.colorPalette); } catch {}
                  if (!paletteData || !paletteData.colors?.length) return null;
                  return (
                    <div data-testid={`palette-${space.id}`}>
                      <button
                        onClick={() => setActiveColor(activeColor === null ? 0 : null)}
                        className="w-full text-left group"
                        data-testid={`button-palette-${space.id}`}
                      >
                        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Color Palette</p>
                        <div className="flex items-center gap-3">
                          {paletteData.colors.map((c, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                              <div
                                className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${activeColor !== null ? "border-[#c4956a] shadow-sm" : "border-stone-200 group-hover:border-stone-300 group-hover:scale-105"}`}
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-[9px] text-foreground/40 font-medium">{c.name}</span>
                            </div>
                          ))}
                          <ChevronRight className={`w-4 h-4 text-foreground/30 ml-auto transition-transform duration-200 ${activeColor !== null ? "rotate-90" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {activeColor !== null && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 p-3.5 rounded-lg bg-stone-50 border border-stone-100">
                              <div className="flex items-center gap-1.5 mb-2">
                                {paletteData.colors.map((c, i) => (
                                  <div key={i} className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
                                ))}
                                <span className="text-[10px] text-foreground/30 ml-1 font-medium uppercase tracking-wider">Palette Mood</span>
                              </div>
                              <p className="text-sm text-foreground/60 leading-relaxed italic">{paletteData.feel}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

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

                <button
                  onClick={handleViewPhotos}
                  disabled={loadingPhotos}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-stone-100 to-stone-50 text-stone-700 px-4 py-3 rounded-lg hover:from-stone-200 hover:to-stone-100 transition-all font-medium border border-stone-200/60"
                  data-testid={`button-view-photos-${space.id}`}
                >
                  {loadingPhotos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-[#c4956a]" />}
                  View Photos Taken Here
                  {(portfolioPhotoCount ?? 0) > 0 && (
                    <span className="text-[10px] bg-[#c4956a]/10 text-[#c4956a] px-1.5 py-0.5 rounded-full font-bold">{portfolioPhotoCount}</span>
                  )}
                </button>

                {showAuthPrompt && !isAuthenticated && (
                  <AnimatePresence>
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-6" onClick={handleDismissAuth}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5"
                        onClick={e => e.stopPropagation()}
                        data-testid={`auth-prompt-${space.id}`}
                      >
                        <button onClick={handleDismissAuth} className="absolute top-4 right-4 text-foreground/40 hover:text-foreground/60">
                          <X className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                            <User className="w-7 h-7 text-[#c4956a]" />
                          </div>
                          <h3 className="font-serif text-lg font-semibold mb-2">Register to Schedule</h3>
                          <p className="text-sm text-foreground/50 max-w-xs mx-auto">
                            Create a free account to send booking requests, chat with hosts, and manage your reservations.
                          </p>
                        </div>
                        <Button
                          onClick={handleRegisterClick}
                          disabled={authPending}
                          className="w-full bg-[#c4956a] text-white hover:bg-[#b3845d] py-3"
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
                      </motion.div>
                    </div>
                  </AnimatePresence>
                )}
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

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
    </motion.div>
  );
}

function StepCheckmark({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 350);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex items-center justify-center py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
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

function BookingPopup({
  space,
  onClose,
  schedule,
  bufferMinutes,
  bookMutation,
}: {
  space: Space;
  onClose: () => void;
  schedule: WeekSchedule | null;
  bufferMinutes: number;
  bookMutation: any;
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
      data-testid={`booking-popup-${space.id}`}
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
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            data-testid="button-close-booking-popup"
          >
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
                  <span className={`text-[10px] mt-1 font-medium ${i <= stepIndex ? "text-foreground/70" : "text-foreground/30"}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full overflow-hidden bg-stone-100">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: i < stepIndex ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-[320px]">
          <AnimatePresence mode="wait" custom={direction}>
            {step === "date" && (
              <motion.div
                key="date"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-3"
              >
                <p className="text-sm font-medium text-foreground/80 text-center">When would you like to visit?</p>
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
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      return !isDateAvailable(date);
                    }}
                    className="rounded-xl border border-stone-200 bg-white shadow-sm"
                    data-testid={`popup-calendar-${space.id}`}
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
              <motion.div
                key="time"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/80">Pick your start time</p>
                  <p className="text-xs text-[#c4956a] font-medium mt-1">
                    {new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot, i) => (
                      <motion.button
                        key={slot}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.15 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setBookingStartTime(slot);
                          setBookingHours(1);
                          setDirection(1);
                          setStep("time-check");
                        }}
                        className={`relative px-3 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                          bookingStartTime === slot
                            ? "border-[#c4956a] bg-[#c4956a]/5 text-[#c4956a] shadow-md shadow-[#c4956a]/10"
                            : "border-stone-200 bg-white text-foreground/70 hover:border-stone-300 hover:shadow-sm"
                        }`}
                        data-testid={`popup-time-slot-${slot}-${space.id}`}
                      >
                        {formatTime(slot)}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-foreground/40">No available slots for this date</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setDirection(-1); setStep("date"); setBookingDate(""); }}>
                      Pick another date
                    </Button>
                  </div>
                )}
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/60 transition-colors mx-auto"
                  data-testid="button-booking-back-to-date"
                >
                  <ArrowLeft className="w-3 h-3" /> Change date
                </button>
              </motion.div>
            )}

            {step === "time-check" && (
              <motion.div key="time-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StepCheckmark onComplete={() => setStep("confirm")} />
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-4"
              >
                <p className="text-sm font-medium text-foreground/80 text-center">Review your booking</p>

                <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <CalendarDays className="w-4 h-4 text-[#c4956a]" />
                      <span>Date</span>
                    </div>
                    <span className="text-sm font-semibold">{new Date(bookingDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Clock className="w-4 h-4 text-[#c4956a]" />
                      <span>Time</span>
                    </div>
                    <span className="text-sm font-semibold">{formatTime(bookingStartTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Users className="w-4 h-4 text-[#c4956a]" />
                      <span>Duration</span>
                    </div>
                    <select
                      value={bookingHours}
                      onChange={(e) => setBookingHours(parseInt(e.target.value))}
                      className="h-8 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-foreground focus:border-[#c4956a] focus:ring-1 focus:ring-[#c4956a]/30 outline-none"
                      data-testid={`popup-select-hours-${space.id}`}
                    >
                      {Array.from({ length: maxHours }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-2">
                  <div className="flex justify-between text-sm text-foreground/60">
                    <span>${space.pricePerHour}/hr x {bookingHours} hr{bookingHours > 1 ? "s" : ""}</span>
                    <AnimatedPrice value={basePriceCents} />
                  </div>
                  <div className="flex justify-between text-sm text-foreground/60">
                    <span>Service fee (7%)</span>
                    <AnimatedPrice value={renterFee} />
                  </div>
                  <div className="border-t border-stone-200 pt-2 flex justify-between text-base font-bold text-foreground">
                    <span>Total</span>
                    <motion.span
                      key={totalCharge}
                      initial={{ scale: 1.15, color: "#c4956a" }}
                      animate={{ scale: 1, color: "#1a1a1a" }}
                      transition={{ duration: 0.4 }}
                    >
                      <AnimatedPrice value={totalCharge} />
                    </motion.span>
                  </div>
                </div>

                <CancellationPolicy />

                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="px-4 py-3 rounded-xl border border-stone-200 text-sm font-medium text-foreground/60 hover:bg-stone-50 transition-colors"
                    data-testid="button-booking-back-to-time"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => bookMutation.mutate({ bookingDate, bookingStartTime, bookingHours })}
                    disabled={bookMutation.isPending}
                    className="flex-1 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid={`popup-submit-booking-${space.id}`}
                  >
                    {bookMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Book & Pay ${(totalCharge / 100).toFixed(2)}
                      </>
                    )}
                  </motion.button>
                </div>
                <p className="text-[10px] text-foreground/35 text-center">Secure payment via Stripe</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CancellationPolicy() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden" data-testid="cancellation-policy">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        data-testid="button-toggle-cancellation-policy"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
          <Shield className="w-3.5 h-3.5" />
          Cancellation Policy
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-[11px] text-foreground/60">
                  <Check className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                  <span>Full refund if canceled 24+ hours before booking</span>
                </li>
                <li className="flex items-start gap-2 text-[11px] text-foreground/60">
                  <X className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" />
                  <span>Cancellations within 24 hours are non-refundable</span>
                </li>
                <li className="flex items-start gap-2 text-[11px] text-foreground/60">
                  <X className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" />
                  <span>No-shows are non-refundable</span>
                </li>
                <li className="flex items-start gap-2 text-[11px] text-foreground/60">
                  <X className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" />
                  <span>Service fees may not be refunded</span>
                </li>
              </ul>
              <div className="border-t border-stone-100 pt-2">
                <p className="text-[10px] text-foreground/40">Refunds are processed automatically to your original payment method. Processing may take 3–5 business days.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LIST_SPACE_TYPES = [
  { value: "office", label: "Office / Therapy Room" },
  { value: "gym", label: "Training Studio" },
  { value: "meeting", label: "Meeting Room" },
  { value: "art_studio", label: "Art Studio" },
  { value: "photo_studio", label: "Photo/Video Studio" },
];

function ListSpaceModal({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [authPending, setAuthPending] = useState(false);
  const pollRef = useRef<{ interval?: ReturnType<typeof setInterval>; timeout?: ReturnType<typeof setTimeout> }>({});
  const [formData, setFormData] = useState({
    name: "", type: "office", description: "", shortDescription: "",
    address: "", neighborhood: "", pricePerHour: "", pricePerDay: "",
    capacity: "", amenities: "", targetProfession: "", availableHours: "", hostName: "",
  });

  const clearPolling = useCallback(() => {
    if (pollRef.current.interval) clearInterval(pollRef.current.interval);
    if (pollRef.current.timeout) clearTimeout(pollRef.current.timeout);
    pollRef.current = {};
  }, []);

  useEffect(() => () => clearPolling(), [clearPolling]);

  const handleAuthClick = () => {
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/api/login?returnTo=${encodeURIComponent(returnPath)}`;
      return;
    }

    setAuthPending(true);
    const popup = window.open("/api/login?returnTo=/auth-success", "alignAuth", "width=500,height=700,left=200,top=100");
    if (!popup || popup.closed) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/api/login?returnTo=${encodeURIComponent(returnPath)}`;
      return;
    }
    pollRef.current.interval = setInterval(async () => {
      if (popup.closed) {
        clearPolling(); setAuthPending(false);
        try {
          const res = await fetch("/api/auth/user", { credentials: "include" });
          if (res.ok) {
            const userData = await res.json();
            if (userData?.id) {
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }
          }
        } catch {}
        return;
      }
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          if (userData?.id) {
            clearPolling(); setAuthPending(false);
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            if (!popup.closed) popup.close();
          }
        }
      } catch {}
    }, 1500);
    pollRef.current.timeout = setTimeout(() => { clearPolling(); setAuthPending(false); }, 120000);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...formData, amenities: formData.amenities.split(",").map(a => a.trim()).filter(Boolean) };
      await apiRequest("POST", "/api/spaces", payload);
    },
    onSuccess: () => {
      toast({ title: "Space submitted!", description: "Your space listing is pending admin approval." });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-serif text-lg font-semibold text-foreground">List Your Space</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground/70 p-1" data-testid="button-close-list-modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <User className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Create an Account First</h3>
              <p className="text-sm text-foreground/50 max-w-sm mx-auto">
                Sign in to list your workspace. It takes just a moment and your listing will be reviewed by our team.
              </p>
            </div>
            <Button
              onClick={handleAuthClick}
              disabled={authPending}
              className="w-full bg-[#c4956a] text-white hover:bg-[#b3845d] py-3"
              data-testid="button-auth-list-space"
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
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Space Name *</label>
                <Input value={formData.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Sunny Therapy Room" data-testid="input-list-name" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Type *</label>
                <select value={formData.type} onChange={e => update("type", e.target.value)} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white" data-testid="select-list-type">
                  {LIST_SPACE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Your Name / Business *</label>
                <Input value={formData.hostName} onChange={e => update("hostName", e.target.value)} placeholder="e.g. Dr. Maria Santos" data-testid="input-list-host" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Address *</label>
                <Input value={formData.address} onChange={e => update("address", e.target.value)} placeholder="Full address" data-testid="input-list-address" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Neighborhood</label>
                <Input value={formData.neighborhood} onChange={e => update("neighborhood", e.target.value)} placeholder="e.g. Brickell" data-testid="input-list-neighborhood" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Price per Hour ($) *</label>
                <Input type="number" value={formData.pricePerHour} onChange={e => update("pricePerHour", e.target.value)} placeholder="35" data-testid="input-list-price" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Price per Day ($)</label>
                <Input type="number" value={formData.pricePerDay} onChange={e => update("pricePerDay", e.target.value)} placeholder="200" data-testid="input-list-price-day" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Capacity</label>
                <Input type="number" value={formData.capacity} onChange={e => update("capacity", e.target.value)} placeholder="6" data-testid="input-list-capacity" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Target Profession</label>
                <Input value={formData.targetProfession} onChange={e => update("targetProfession", e.target.value)} placeholder="e.g. Therapists" data-testid="input-list-target" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Available Hours</label>
                <Input value={formData.availableHours} onChange={e => update("availableHours", e.target.value)} placeholder="Mon-Fri 9am-5pm" data-testid="input-list-hours" />
              </div>
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Short Description</label>
              <Input value={formData.shortDescription} onChange={e => update("shortDescription", e.target.value)} placeholder="Brief one-liner" data-testid="input-list-short-desc" />
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Description *</label>
              <Textarea value={formData.description} onChange={e => update("description", e.target.value)} placeholder="Describe your space in detail..." rows={3} data-testid="input-list-description" />
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Amenities (comma-separated)</label>
              <Input value={formData.amenities} onChange={e => update("amenities", e.target.value)} placeholder="Wi-Fi, Parking, AC" data-testid="input-list-amenities" />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formData.name || !formData.address || !formData.pricePerHour || !formData.description || !formData.hostName || createMutation.isPending}
              className="w-full bg-foreground text-background hover:opacity-90 py-3"
              data-testid="button-submit-list-space"
            >
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit for Approval"}
            </Button>
            <p className="text-xs text-foreground/40 text-center">Your listing will be reviewed by our team before going live.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function SpacesBrowsePage() {
  const [, setLocation] = useLocation();
  const [activeType, setActiveType] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "distance">("default");
  const [zipError, setZipError] = useState<string>("");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [autoBookSpaceId, setAutoBookSpaceId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("book");
  });

  useEffect(() => {
    if (autoBookSpaceId) {
      const url = new URL(window.location.href);
      url.searchParams.delete("book");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [autoBookSpaceId]);

  useEffect(() => {
    if (!showTypeDropdown) return;
    const handler = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTypeDropdown]);

  const zipCoords = useMemo(() => {
    if (zipCode.length === 5) {
      const coords = getZipCoords(zipCode);
      return coords;
    }
    return null;
  }, [zipCode]);

  const { data: allSpaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: photoCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/spaces/photo-counts"],
    queryFn: async () => {
      if (allSpaces.length === 0) return {};
      const counts: Record<string, number> = {};
      await Promise.all(
        allSpaces.map(async (space) => {
          try {
            const res = await fetch(`/api/portfolio-photos/by-space/${space.id}`);
            if (res.ok) {
              const photos = await res.json();
              if (photos.length > 0) counts[space.id] = photos.length;
            }
          } catch {}
        })
      );
      return counts;
    },
    enabled: allSpaces.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const priceRange = useMemo(() => {
    if (allSpaces.length === 0) return { min: 0, max: 100 };
    const prices = allSpaces.map(s => s.pricePerHour);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [allSpaces]);

  const filtered = useMemo(() => {
    let result = activeType === "all" ? allSpaces : allSpaces.filter(s => s.type === activeType);

    const minVal = priceMin ? parseInt(priceMin) : null;
    const maxVal = priceMax ? parseInt(priceMax) : null;
    if (minVal !== null) result = result.filter(s => s.pricePerHour >= minVal);
    if (maxVal !== null) result = result.filter(s => s.pricePerHour <= maxVal);

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === "distance" && zipCoords) {
      result = [...result].sort((a, b) => {
        const distA = a.latitude && a.longitude
          ? haversineDistance(zipCoords[0], zipCoords[1], parseFloat(a.latitude), parseFloat(a.longitude))
          : Infinity;
        const distB = b.latitude && b.longitude
          ? haversineDistance(zipCoords[0], zipCoords[1], parseFloat(b.latitude), parseFloat(b.longitude))
          : Infinity;
        return distA - distB;
      });
    }

    return result;
  }, [allSpaces, activeType, priceMin, priceMax, sortBy, zipCoords]);

  const getDistanceForSpace = useCallback((space: Space): number | null => {
    if (!zipCoords || !space.latitude || !space.longitude) return null;
    return haversineDistance(zipCoords[0], zipCoords[1], parseFloat(space.latitude), parseFloat(space.longitude));
  }, [zipCoords]);

  const typeCounts = SPACE_TYPES.map(t => ({
    ...t,
    count: t.key === "all" ? allSpaces.length : allSpaces.filter(s => s.type === t.key).length,
  }));

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceMin) count++;
    if (priceMax) count++;
    if (zipCode.length === 5) count++;
    if (sortBy !== "default") count++;
    return count;
  }, [priceMin, priceMax, zipCode, sortBy]);

  const handleMarkerClick = useCallback((id: string) => {
    setHoveredCardId(id);
    setMobileView("list");
    setTimeout(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleZipChange = useCallback((val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 5);
    setZipCode(digits);
    if (digits.length === 5 && !getZipCoords(digits)) {
      setZipError("Zip code not in Miami area");
    } else {
      setZipError("");
    }
    if (digits.length === 5 && getZipCoords(digits)) {
      setSortBy("distance");
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setPriceMin("");
    setPriceMax("");
    setZipCode("");
    setSortBy("default");
    setZipError("");
  }, []);

  useEffect(() => {
    document.title = "Browse Spaces | Align Spaces — Miami Workspaces for Professionals";
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <nav className="sticky top-0 z-[9001] bg-background/95 backdrop-blur-sm border-b border-stone-200/60 flex-shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => { if (mobileView === "map") { setMobileView("list"); } else { window.history.back(); } }} className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="link-back-spaces">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{mobileView === "map" ? "List" : "Back"}</span>
          </button>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Align Spaces</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
              data-testid="button-toggle-map"
              className="lg:hidden flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1.5 rounded-full border border-stone-200 text-foreground/60 hover:text-foreground hover:border-stone-300 transition-colors bg-white"
            >
              {mobileView === "list" ? (
                <><MapIcon className="w-3.5 h-3.5" /> Map</>
              ) : (
                <><List className="w-3.5 h-3.5" /> List ({filtered.length})</>
              )}
            </button>
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
                  className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[200px] z-[9000]"
                >
                  <button onClick={() => { setLocation("/portraits"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-browse">
                    <Camera className="w-4 h-4" />
                    Align Portraits
                  </button>
                  <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-browse">
                    <User className="w-4 h-4" />
                    Client Portal
                  </button>
                  <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-browse">
                    <Images className="w-4 h-4" />
                    Our Work
                  </button>
                  <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-browse">
                    <Star className="w-4 h-4" />
                    Featured Pros
                  </button>
                  <button onClick={() => { setLocation("/about"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-browse">
                    <Info className="w-4 h-4" />
                    About Us
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-shrink-0 px-4 sm:px-6 pt-3 pb-3 border-b border-stone-100 bg-background">
        <p className="text-xs text-foreground/40 mb-2" data-testid="text-spaces-intro">
          Discover and book workspaces across Miami — offices, studios, and meeting rooms for professionals.
        </p>
        <div className="flex items-center gap-2">
          <div ref={typeDropdownRef} className="relative flex-shrink-0" data-testid="dropdown-space-type">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-foreground hover:border-stone-300 transition-colors"
              data-testid="button-space-type-dropdown"
            >
              {(() => {
                const active = typeCounts.find(t => t.key === activeType);
                if (!active) return null;
                const Icon = active.icon;
                return (
                  <>
                    <Icon className="w-4 h-4 text-[#c4956a]" />
                    <span>{active.label}</span>
                    <span className="text-xs text-foreground/40 bg-stone-100 px-1.5 py-0.5 rounded-full">{active.count}</span>
                  </>
                );
              })()}
              <ChevronRight className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${showTypeDropdown ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {showTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-stone-200 shadow-lg z-50 min-w-[200px] py-1 overflow-hidden"
                >
                  {typeCounts.map(({ key, label, icon: Icon, count }) => (
                    <button
                      key={key}
                      onClick={() => { setActiveType(key); setShowTypeDropdown(false); }}
                      data-testid={`button-filter-${key}`}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        activeType === key
                          ? "bg-stone-50 text-foreground font-medium"
                          : "text-foreground/60 hover:bg-stone-50 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${activeType === key ? "text-[#c4956a]" : ""}`} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeType === key ? "bg-[#c4956a]/10 text-[#c4956a]" : "bg-stone-100 text-foreground/30"}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {allSpaces.length >= 3 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/60 border-stone-200 hover:border-stone-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#c4956a] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 flex flex-wrap items-end gap-x-6 gap-y-3" data-testid="filter-panel">
                <div className="w-full sm:w-auto">
                  <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-2">Price per hour</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">$</span>
                      <input
                        type="number"
                        value={priceMin}
                        onChange={e => setPriceMin(e.target.value)}
                        placeholder={`${priceRange.min}`}
                        min={priceRange.min}
                        max={priceMax ? parseInt(priceMax) : priceRange.max}
                        className="w-20 pl-5 pr-2 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#c4956a] transition-colors"
                        data-testid="input-price-min"
                      />
                    </div>
                    <span className="text-foreground/30 text-sm">–</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">$</span>
                      <input
                        type="number"
                        value={priceMax}
                        onChange={e => setPriceMax(e.target.value)}
                        placeholder={`${priceRange.max}`}
                        min={priceMin ? parseInt(priceMin) : priceRange.min}
                        max={priceRange.max}
                        className="w-20 pl-5 pr-2 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#c4956a] transition-colors"
                        data-testid="input-price-max"
                      />
                    </div>
                  </div>
                  <div className="relative h-5 w-full sm:w-52" data-testid="price-slider">
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-stone-200 rounded-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#c4956a] rounded-full"
                      style={{
                        left: `${((parseInt(priceMin) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                        right: `${100 - ((parseInt(priceMax) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={parseInt(priceMin) || priceRange.min}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        const maxV = parseInt(priceMax) || priceRange.max;
                        setPriceMin(v <= priceRange.min ? "" : v >= maxV ? String(maxV - 1) : String(v));
                      }}
                      className="price-range-thumb absolute inset-0 w-full appearance-none bg-transparent cursor-pointer pointer-events-auto z-10"
                      data-testid="slider-price-min"
                    />
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={parseInt(priceMax) || priceRange.max}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        const minV = parseInt(priceMin) || priceRange.min;
                        setPriceMax(v >= priceRange.max ? "" : v <= minV ? String(minV + 1) : String(v));
                      }}
                      className="price-range-thumb absolute inset-0 w-full appearance-none bg-transparent cursor-pointer pointer-events-auto z-20"
                      data-testid="slider-price-max"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Your Zip Code</label>
                    <div className="relative">
                      <Navigation className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
                      <input
                        type="text"
                        value={zipCode}
                        onChange={e => handleZipChange(e.target.value)}
                        placeholder="33131"
                        maxLength={5}
                        className={`w-28 pl-8 pr-2.5 py-1.5 rounded-lg border text-sm bg-white focus:outline-none transition-colors ${
                          zipError ? "border-red-300 focus:border-red-400" : "border-stone-200 focus:border-[#c4956a]"
                        }`}
                        data-testid="input-zip-code"
                      />
                    </div>
                    {zipError && <p className="text-[10px] text-red-400 mt-0.5">{zipError}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#c4956a] transition-colors cursor-pointer"
                    data-testid="select-sort"
                  >
                    <option value="default">Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="distance" disabled={!zipCoords}>Distance (nearest)</option>
                  </select>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-[#c4956a] hover:text-[#b3845d] font-medium pb-1.5 transition-colors"
                    data-testid="button-clear-filters"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`${mobileView === "list" ? "flex" : "hidden"} lg:flex flex-col w-full lg:w-[60%] xl:w-[65%] overflow-y-auto`}>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/50">
                <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "space" : "spaces"} in Miami
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
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
                <p className="text-foreground/30 text-xs mt-2">Try a different category or check back soon.</p>
              </div>
            ) : (
              <>
                {filtered.length <= 2 && (
                  <div className="flex items-center gap-2 bg-amber-50/60 border border-amber-100 rounded-lg px-4 py-3 mb-2" data-testid="text-early-access">
                    <Sparkles className="w-4 h-4 text-[#c4956a] flex-shrink-0" />
                    <p className="text-xs text-foreground/50">
                      We're just getting started. New spaces are added weekly across Miami neighborhoods.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((space) => (
                    <div
                      key={space.id}
                      ref={el => { cardRefs.current[space.id] = el; }}
                      className="h-full"
                    >
                      <SpaceCard
                        space={space}
                        onHover={setHoveredCardId}
                        onLeave={() => setHoveredCardId(null)}
                        isHighlighted={hoveredCardId === space.id}
                        distance={getDistanceForSpace(space)}
                        portfolioPhotoCount={photoCounts[space.id]}
                        autoBook={autoBookSpaceId === space.id}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="pb-24 lg:pb-8 pt-4">
              <div className="bg-stone-50 rounded-2xl p-6 sm:p-8 text-center">
                <h2 className="font-serif text-lg sm:text-xl font-semibold mb-2" data-testid="text-list-space-heading">
                  Have a space to share?
                </h2>
                <p className="text-foreground/50 text-sm mb-4 max-w-md mx-auto">
                  List your workspace in Miami for professionals to discover.
                </p>
                <button
                  onClick={() => setShowListModal(true)}
                  className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-foreground text-background px-6 py-3 rounded-full hover:opacity-90 transition-opacity font-medium"
                  data-testid="button-list-space"
                >
                  List Your Space
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${mobileView === "map" ? "flex" : "hidden"} lg:flex flex-col w-full lg:w-[40%] xl:w-[35%] border-l border-stone-200/60`}>
          <div className="flex-1 relative">
            {!isLoading && (
              <SpacesMap
                spaces={filtered}
                hoveredId={hoveredCardId}
                onMarkerClick={handleMarkerClick}
                visible={mobileView === "map"}
              />
            )}
          </div>
        </div>
      </div>


      <AnimatePresence>
        {showListModal && (
          <ListSpaceModal onClose={() => setShowListModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
