import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Briefcase,
  Sofa,
  Leaf,
  UsersRound,
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
  Map as MapIcon,
  List,
  SlidersHorizontal,
  Navigation,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  Shield,
  Info,
  CalendarDays,
  CreditCard,
  Heart,
  Share2,
  Search,
  History,
  Timer,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ListSpaceModal } from "@/components/list-space-modal";
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

// Recently viewed spaces — localStorage helpers
const RECENT_SPACES_KEY = "recentlyViewedSpaces";
const MAX_RECENT = 10;

interface RecentlyViewedEntry {
  spaceId: string;
  timestamp: number;
}

function getRecentlyViewed(): RecentlyViewedEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_SPACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: any) => typeof e.spaceId === "string" && typeof e.timestamp === "number"
    );
  } catch {
    return [];
  }
}

function addRecentlyViewed(spaceId: string) {
  const existing = getRecentlyViewed().filter((e) => e.spaceId !== spaceId);
  const updated = [{ spaceId, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SPACES_KEY, JSON.stringify(updated));
}

function clearRecentlyViewed() {
  localStorage.removeItem(RECENT_SPACES_KEY);
}

const SPACE_TYPES = [
  { key: "all", label: "Browse All Spaces", icon: Building2, description: "Explore every workspace available in Miami" },
  { key: "therapy", label: "Therapy & Counseling", icon: Sofa, description: "Private offices for therapy sessions and mental health professionals" },
  { key: "coaching", label: "Coaching & Consulting", icon: Briefcase, description: "Professional meeting spaces for coaching and client consultations" },
  { key: "wellness", label: "Wellness & Holistic", icon: Leaf, description: "Calm environments for wellness practices and holistic sessions" },
  { key: "workshop", label: "Workshops & Classes", icon: UsersRound, description: "Spaces designed for group sessions, classes, and workshops" },
  { key: "creative", label: "Creative Studios", icon: Camera, description: "Studios for photography, video production, and creative work" },
] as const;

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

const PIN_COLORS: Record<string, { bg: string; text: string; border: string; activeBg: string; activeBorder: string }> = {
  therapy: { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd", activeBg: "#2563eb", activeBorder: "#1d4ed8" },
  coaching: { bg: "#fffbeb", text: "#b45309", border: "#fcd34d", activeBg: "#d97706", activeBorder: "#b45309" },
  wellness: { bg: "#ecfdf5", text: "#047857", border: "#6ee7b7", activeBg: "#059669", activeBorder: "#047857" },
  workshop: { bg: "#faf5ff", text: "#7c3aed", border: "#c4b5fd", activeBg: "#7c3aed", activeBorder: "#6d28d9" },
  creative: { bg: "#fff1f2", text: "#be123c", border: "#fda4af", activeBg: "#e11d48", activeBorder: "#be123c" },
};

function getPinColor(type: string, tags?: string[] | null) {
  const primaryType = tags && tags.length > 0 ? tags[0] : type;
  return PIN_COLORS[primaryType] || { bg: "#faf6f1", text: "#c4956a", border: "#d4b896", activeBg: "#c4956a", activeBorder: "#b3845d" };
}

function createPriceIcon(price: number, type: string, isActive: boolean, tags?: string[] | null) {
  const priceStr = `$${price}`;
  const width = priceStr.length * 9 + 20;
  const colors = getPinColor(type, tags);
  return L.divIcon({
    className: "price-marker",
    html: `<div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${width}px;
      height: 28px;
      background: ${isActive ? colors.activeBg : colors.bg};
      color: ${isActive ? "#fff" : colors.text};
      border: 1.5px solid ${isActive ? colors.activeBorder : colors.border};
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
          icon={createPriceIcon(space.pricePerHour, space.type, space.id === hoveredId, space.tags)}
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

function SpaceCard({ space, onHover, onLeave, isHighlighted, distance, portfolioPhotoCount, onView }: { space: Space; onHover?: (id: string) => void; onLeave?: () => void; isHighlighted?: boolean; distance?: number | null; portfolioPhotoCount?: number; onView?: (id: string) => void }) {
  const [, navigateTo] = useLocation();
  const [cardPhotoIndex, setCardPhotoIndex] = useState(0);
  const [paletteExpanded, setPaletteExpanded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/spaces/${space.slug}`;
    const shareData = { title: space.name, text: `Check out ${space.name} on Align Spaces`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Space link copied to clipboard" });
    }
  };

  const { data: favStatus } = useQuery<{ favorited: boolean }>({
    queryKey: ["/api/space-favorites/check", space.id],
    queryFn: async () => {
      const res = await fetch(`/api/space-favorites/check/${space.id}`, { credentials: "include" });
      if (!res.ok) return { favorited: false };
      return res.json();
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (favStatus?.favorited) {
        await apiRequest("DELETE", `/api/space-favorites/${space.id}`);
      } else {
        await apiRequest("POST", `/api/space-favorites/${space.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/space-favorites/check", space.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/space-favorites"] });
    },
  });

  const primaryTag = space.tags && space.tags.length > 0 ? space.tags[0] : space.type;
  const MAX_AMENITIES = 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-stone-900 rounded-xl border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full ${isHighlighted ? "border-[#c4956a] shadow-md ring-1 ring-[#c4956a]/20" : "border-stone-200/80 dark:border-stone-700"}`}
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
              onClick={() => { onView?.(space.id); navigateTo(`/spaces/${space.slug}`); }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
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
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
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
        {/* Single primary category tag — frosted glass, top-left */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-[8px] text-white border border-white/20 z-10">
          {TYPE_LABELS[primaryTag] || primaryTag}
        </span>
        {/* Verified / Sample badge — frosted glass, top-right */}
        {space.isSample ? (
          <div className="absolute top-3 right-3 bg-amber-500/80 backdrop-blur-[8px] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/30 z-10">
            Sample
          </div>
        ) : (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-[8px] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20 z-10" data-testid={`badge-verified-${space.id}`}>
            <BadgeCheck className="w-3 h-3" />
            Verified
          </div>
        )}
        {/* Price overlay — bottom-left of image */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-white text-xl font-medium leading-none">${space.pricePerHour}</span>
          <span className="text-white/70 text-xs font-medium ml-0.5">/hr</span>
        </div>
        {/* Action buttons + photo count — bottom-right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
          {(portfolioPhotoCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full"
              data-testid={`badge-photos-${space.id}`}
            >
              <Camera className="w-3 h-3" />
              {portfolioPhotoCount}
            </div>
          )}
          {user && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite.mutate(); }}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all"
              data-testid={`button-favorite-${space.id}`}
              title={favStatus?.favorited ? "Saved to favorites" : "Save to favorites"}
            >
              <Heart className={`w-3.5 h-3.5 ${favStatus?.favorited ? "text-white fill-white" : "text-white/80"}`} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={handleShare}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all"
            data-testid={`button-share-${space.id}`}
            title="Share this space"
          >
            <Share2 className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      </div>

      <Link
        href={`/spaces/${space.slug}`}
        className="block p-4 flex flex-col flex-1"
        data-testid={`link-space-${space.id}`}
        onClick={() => onView?.(space.id)}
      >
        <h3 className="font-serif text-[17px] font-semibold text-stone-900 mb-1 leading-snug" data-testid={`text-space-name-${space.id}`}>
          {space.name}
        </h3>

        <div className="flex items-center gap-1 text-stone-400 text-xs mb-2.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{space.neighborhood || space.address}</span>
          {distance != null && (
            <span className="ml-auto text-[11px] text-[#c4956a] font-medium whitespace-nowrap flex-shrink-0" data-testid={`text-distance-${space.id}`}>
              {distance < 0.1 ? "< 0.1" : distance.toFixed(1)} mi
            </span>
          )}
        </div>

        {/* Secondary metadata line: capacity + daily rate */}
        <div className="flex items-center gap-3 text-xs text-stone-500 mb-2.5">
          {space.capacity && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-stone-400" />
              Up to {space.capacity}
            </span>
          )}
          {space.pricePerDay && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-stone-400" />
              ${space.pricePerDay}/day
            </span>
          )}
        </div>

        {/* "Ideal for" pill */}
        {space.targetProfession && (
          <div className="mb-2.5">
            <span className="inline-block text-[11px] font-medium text-[#b3845d] bg-[#c4956a]/10 px-2.5 py-0.5 rounded-full">
              Ideal for {space.targetProfession}
            </span>
          </div>
        )}

        {/* Amenity pills — max 3 visible + overflow */}
        {space.amenities && space.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {space.amenities.slice(0, MAX_AMENITIES).map((amenity, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-stone-50 text-stone-500 px-2 py-0.5 rounded-full border border-stone-100">
                <Check className="w-2.5 h-2.5 text-[#c4956a]" />
                {amenity}
              </span>
            ))}
            {space.amenities.length > MAX_AMENITIES && (
              <span className="text-[11px] text-stone-400 px-1.5 py-0.5">
                +{space.amenities.length - MAX_AMENITIES} more
              </span>
            )}
          </div>
        )}

        {/* Compact color palette — horizontal swatch row */}
        {(() => {
          const paletteData = parseColorPalette(space.colorPalette);
          if (!paletteData) return null;
          return (
            <div
              className="mb-3 pt-3 border-t border-stone-100"
              data-testid={`palette-preview-${space.id}`}
              onClick={(e) => {
                if (paletteData.explanation) {
                  e.preventDefault();
                  e.stopPropagation();
                  setPaletteExpanded(!paletteExpanded);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {paletteData.colors.slice(0, 5).map((c, i) => (
                    <div
                      key={i}
                      className="w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                {paletteData.feel && (
                  <span className="text-[11px] text-stone-400 italic truncate">{paletteData.feel}</span>
                )}
                {paletteData.explanation && (
                  <ChevronDown className={`w-3 h-3 text-stone-300 ml-auto flex-shrink-0 transition-transform duration-200 ${paletteExpanded ? "rotate-180" : ""}`} />
                )}
              </div>
              <AnimatePresence>
                {paletteExpanded && paletteData.explanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-stone-500 leading-relaxed mt-2">{paletteData.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        <div className="mt-auto pt-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors">
            View Details
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
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

  // Fetch booked slots for the selected date
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
  const basePriceCents = space.pricePerHour * 100 * bookingHours;

  // Fetch real fee breakdown from API (includes tier detection + tax)
  const { data: feeData } = useQuery<{
    guestFeeAmount: number; taxAmount: number; totalGuestCharged: number; isRepeatGuest: boolean;
  }>({
    queryKey: ["/api/spaces", space.id, "booking-fees", bookingHours],
    queryFn: () => fetch(`/api/spaces/${space.id}/booking-fees?hours=${bookingHours}`).then(r => r.json()),
    enabled: bookingHours >= 1,
  });

  const guestFee = feeData?.guestFeeAmount ?? Math.round(basePriceCents * 0.07);
  const taxAmount = feeData?.taxAmount ?? Math.round(basePriceCents * 0.07);
  const totalCharge = feeData?.totalGuestCharged ?? (basePriceCents + guestFee + taxAmount);
  const isRepeatGuest = feeData?.isRepeatGuest ?? false;
  const loyaltySavings = isRepeatGuest ? Math.round(basePriceCents * 0.07) - guestFee : 0;

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
                    <span>Service fee</span>
                    <AnimatedPrice value={guestFee} />
                  </div>
                  <div className="flex justify-between text-sm text-foreground/60">
                    <span>Taxes</span>
                    <AnimatedPrice value={taxAmount} />
                  </div>
                  {isRepeatGuest && loyaltySavings > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span>Loyalty discount</span>
                      <span>-<AnimatedPrice value={loyaltySavings} /></span>
                    </div>
                  )}
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

export default function SpacesBrowsePage() {
  const [, setLocation] = useLocation();
  const [categoryChosen, setCategoryChosen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("type");
  });
  const [activeType, setActiveType] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("type") || "all";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [showListModal, setShowListModal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("list") === "true";
  });
  
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "distance">("default");
  const [availableToday, setAvailableToday] = useState(false);
  const [zipError, setZipError] = useState<string>("");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Availability search state
  const [availDate, setAvailDate] = useState<string>("");
  const [availStartTime, setAvailStartTime] = useState<string>("");
  const [availHours, setAvailHours] = useState<string>("");
  const availSearchActive = !!(availDate && availStartTime && availHours);

  // Recently viewed state
  const [recentEntries, setRecentEntries] = useState<RecentlyViewedEntry[]>(() => getRecentlyViewed());

  const handleViewSpace = useCallback((spaceId: string) => {
    addRecentlyViewed(spaceId);
    setRecentEntries(getRecentlyViewed());
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentlyViewed();
    setRecentEntries([]);
  }, []);


  const zipCoords = useMemo(() => {
    if (zipCode.length === 5) {
      const coords = getZipCoords(zipCode);
      return coords;
    }
    return null;
  }, [zipCode]);

  const { data: defaultSpaces = [], isLoading: isLoadingDefault } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Availability search query
  const { data: availableSpaces, isLoading: isLoadingAvail } = useQuery<Space[]>({
    queryKey: ["/api/spaces/search/available", availDate, availStartTime, availHours, activeType],
    queryFn: async () => {
      const params = new URLSearchParams({
        date: availDate,
        startTime: availStartTime,
        hours: availHours,
      });
      if (activeType !== "all") params.set("type", activeType);
      const res = await fetch(`/api/spaces/search/available?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: availSearchActive,
    staleTime: 30 * 1000,
  });

  const allSpaces = availSearchActive && availableSpaces ? availableSpaces : defaultSpaces;
  const isLoading = availSearchActive ? isLoadingAvail : isLoadingDefault;

  // Resolve recently viewed spaces from IDs
  const recentSpaces = useMemo(() => {
    if (recentEntries.length === 0 || defaultSpaces.length === 0) return [];
    const spaceMap = new Map(defaultSpaces.map((s) => [s.id, s]));
    return recentEntries
      .map((e) => spaceMap.get(e.spaceId))
      .filter((s): s is Space => !!s);
  }, [recentEntries, defaultSpaces]);

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
    let result = activeType === "all"
      ? allSpaces
      : allSpaces.filter(s => s.type === activeType || (s.tags && s.tags.includes(activeType)));

    const minVal = priceMin ? parseInt(priceMin) : null;
    const maxVal = priceMax ? parseInt(priceMax) : null;
    if (minVal !== null) result = result.filter(s => s.pricePerHour >= minVal);
    if (maxVal !== null) result = result.filter(s => s.pricePerHour <= maxVal);

    if (availableToday) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      result = result.filter(s => {
        if (!s.availabilitySchedule) return true;
        try {
          const sched = typeof s.availabilitySchedule === "string" ? JSON.parse(s.availabilitySchedule) : s.availabilitySchedule;
          const dayKey = getDayOfWeek(dateStr);
          return dayKey ? sched[dayKey] !== null && sched[dayKey] !== undefined : true;
        } catch { return true; }
      });
    }

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
  }, [allSpaces, activeType, priceMin, priceMax, sortBy, zipCoords, availableToday]);

  const getDistanceForSpace = useCallback((space: Space): number | null => {
    if (!zipCoords || !space.latitude || !space.longitude) return null;
    return haversineDistance(zipCoords[0], zipCoords[1], parseFloat(space.latitude), parseFloat(space.longitude));
  }, [zipCoords]);

  const typeCounts = SPACE_TYPES.map(t => ({
    ...t,
    count: t.key === "all" ? allSpaces.length : allSpaces.filter(s => s.type === t.key || (s.tags && s.tags.includes(t.key))).length,
  }));

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceMin) count++;
    if (priceMax) count++;
    if (zipCode.length === 5) count++;
    if (availableToday) count++;
    if (availSearchActive) count++;
    return count;
  }, [priceMin, priceMax, zipCode, availableToday, availSearchActive]);

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

  const clearAvailFilters = useCallback(() => {
    setAvailDate("");
    setAvailStartTime("");
    setAvailHours("");
  }, []);

  const clearAllFilters = useCallback(() => {
    setPriceMin("");
    setPriceMax("");
    setZipCode("");
    setSortBy("default");
    setAvailableToday(false);
    setZipError("");
    clearAvailFilters();
  }, [clearAvailFilters]);

  useEffect(() => {
    document.title = "Workspaces | Align Spaces, Miami Workspaces for Professionals";
  }, []);

  if (!categoryChosen) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col" data-testid="category-picker">
        <nav className="px-4 sm:px-6 py-4 flex items-center relative">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors z-10"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">Align Spaces</span>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight leading-tight mb-3">
              What kind of space <span className="italic font-normal">are you looking for?</span>
            </h1>
            <p className="text-stone-500 text-sm sm:text-base max-w-md mx-auto">
              Select a category to browse available workspaces in Miami.
            </p>
          </motion.div>

          <div className="max-w-2xl w-full space-y-4">
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => {
                setActiveType("all");
                setCategoryChosen(true);
                window.history.replaceState({}, "", "/workspaces?type=all");
              }}
              className="group w-full flex items-center gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-stone-100 hover:border-[#c4956a]/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
              data-testid="category-all"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-900 group-hover:bg-[#c4956a] transition-colors duration-300 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-stone-800 group-hover:text-[#c4956a] transition-colors">Browse All Spaces</span>
                <p className="text-[11px] text-stone-400 mt-0.5">Explore every workspace available in Miami &middot; {allSpaces.length} spaces</p>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {SPACE_TYPES.filter(t => t.key !== "all").map((type, i) => (
                <motion.button
                  key={type.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: (i + 1) * 0.05 }}
                  onClick={() => {
                    setActiveType(type.key);
                    setCategoryChosen(true);
                    window.history.replaceState({}, "", `/workspaces?type=${type.key}`);
                  }}
                  className="group flex flex-col items-center gap-2.5 p-6 sm:p-8 rounded-2xl bg-white border border-stone-100 hover:border-[#c4956a]/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  data-testid={`category-${type.key}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-900 group-hover:bg-[#c4956a] transition-colors duration-300 flex items-center justify-center">
                    <type.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-stone-800 group-hover:text-[#c4956a] transition-colors">{type.label}</span>
                  <p className="text-[10px] text-stone-400 leading-snug text-center px-1">{type.description}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <nav className="sticky top-0 z-[9001] bg-background/95 backdrop-blur-sm border-b border-stone-200/60 dark:border-stone-700/60 flex-shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => { if (mobileView === "map") { setMobileView("list"); } else { setCategoryChosen(false); } }} className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="link-back-spaces">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{mobileView === "map" ? "List" : "Back"}</span>
          </button>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Align Spaces</span>
          <div className="flex items-center gap-2">
            <UserIndicator />
            <button
              onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
              data-testid="button-toggle-map"
              className="lg:hidden flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold px-3.5 py-2 rounded-full border border-[#c4956a]/40 text-[#c4956a] hover:bg-[#c4956a] hover:text-white hover:border-[#c4956a] transition-colors bg-white shadow-sm"
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
                  className="absolute right-0 top-full mt-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg py-2 min-w-[200px] z-[9000]"
                >
                  <button onClick={() => { setLocation("/portrait-builder"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-portraits-browse">
                    <Camera className="w-4 h-4" />
                    Portrait Builder
                  </button>
                  <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-portal-browse">
                    <User className="w-4 h-4" />
                    Client Portal
                  </button>
                  <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-portfolio-browse">
                    <Images className="w-4 h-4" />
                    Our Work
                  </button>
                  <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-featured-browse">
                    <Star className="w-4 h-4" />
                    Featured Pros
                  </button>
                  <button onClick={() => { setLocation("/our-vision"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-about-browse">
                    <Info className="w-4 h-4" />
                    Our Vision
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-shrink-0 px-4 sm:px-6 pt-3 pb-3 border-b border-stone-100 dark:border-stone-800 bg-background">
        <div className="flex items-center gap-2 mb-2" data-testid="quick-category-pills">
          {/* Category chips — left side */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {[
              { key: "all", label: "All" },
              { key: "therapy", label: "Therapy & Counseling" },
              { key: "creative", label: "Creative Studio" },
              { key: "wellness", label: "Wellness" },
              { key: "coaching", label: "Coaching" },
              { key: "workshop", label: "Workshops" },
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => { setActiveType(cat.key); window.history.replaceState({}, "", `/workspaces?type=${cat.key}`); }}
                data-testid={`quick-filter-${cat.key}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap ${
                  activeType === cat.key
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-foreground/60 border-stone-200 hover:border-stone-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Utility controls — right side, visually separated */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setAvailableToday(!availableToday)}
              data-testid="toggle-available-today"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 border ${
                availableToday
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-foreground/50 border-dashed border-stone-300 hover:border-stone-400"
              }`}
            >
              <CalendarDays className="w-3 h-3" />
              <span className="hidden sm:inline">Available today</span>
              <span className="sm:hidden">Today</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 border ${
                showFilters || activeFilterCount > 0
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-foreground/50 border-dashed border-stone-300 hover:border-stone-400"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#c4956a] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
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
                  <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-stone-200 bg-white text-foreground/70 focus:outline-none focus:border-[#c4956a] transition-colors cursor-pointer"
                    data-testid="select-sort"
                  >
                    <option value="default">Default</option>
                    <option value="price-low">Price: Low → High</option>
                    <option value="price-high">Price: High → Low</option>
                    <option value="distance" disabled={!zipCoords}>Distance (nearest)</option>
                  </select>
                </div>
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

                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={availDate}
                      onChange={e => setAvailDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-36 px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#c4956a] transition-colors"
                      data-testid="input-avail-date"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Start time</label>
                    <input
                      type="time"
                      value={availStartTime}
                      onChange={e => setAvailStartTime(e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#c4956a] transition-colors"
                      data-testid="input-avail-time"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mb-1">Duration</label>
                    <select
                      value={availHours}
                      onChange={e => setAvailHours(e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#c4956a] transition-colors cursor-pointer"
                      data-testid="select-avail-hours"
                    >
                      <option value="">--</option>
                      <option value="1">1 hr</option>
                      <option value="2">2 hrs</option>
                      <option value="3">3 hrs</option>
                      <option value="4">4 hrs</option>
                      <option value="5">5 hrs</option>
                      <option value="6">6 hrs</option>
                      <option value="8">8 hrs</option>
                    </select>
                  </div>
                  {availSearchActive && (
                    <button
                      onClick={clearAvailFilters}
                      className="pb-1.5 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                      data-testid="button-clear-avail"
                      title="Clear availability search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                {availSearchActive && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <Search className="w-3 h-3" />
                    available {availDate} at {availStartTime} for {availHours}h
                  </span>
                )}
              </p>
            </div>

            {/* Recently Viewed Section */}
            {recentSpaces.length > 0 && (
              <div data-testid="recently-viewed-section">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5" />
                    Recently Viewed
                  </div>
                  <button
                    onClick={handleClearRecent}
                    className="text-[11px] text-foreground/30 hover:text-foreground/50 transition-colors"
                    data-testid="button-clear-recent"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                  {recentSpaces.map((space) => (
                    <Link
                      key={space.id}
                      href={`/spaces/${space.slug}`}
                      className="flex-shrink-0 w-44 bg-white rounded-lg border border-stone-200/80 overflow-hidden hover:shadow-md transition-shadow group"
                      data-testid={`recent-space-${space.id}`}
                      onClick={() => handleViewSpace(space.id)}
                    >
                      <div className="h-24 bg-stone-100 overflow-hidden">
                        {space.imageUrls && space.imageUrls[0] ? (
                          <img
                            src={space.imageUrls[0]}
                            alt={space.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-stone-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-stone-800 truncate leading-snug">{space.name}</p>
                        <p className="text-[11px] text-[#c4956a] font-medium mt-0.5">${space.pricePerHour}/hr</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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
                        onView={handleViewSpace}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="pb-24 lg:pb-8 pt-4">
              <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 bg-[#faf6f1] border border-[#e8ddd0]/60" data-testid="text-list-space-heading">
                <p className="text-sm text-foreground/60">
                  <span className="font-medium text-foreground/80">Have a space to share?</span>{" "}
                  <span className="hidden sm:inline">Join a growing network of Miami spaces.</span>
                </p>
                <button
                  onClick={() => setShowListModal(true)}
                  className="flex-shrink-0 text-xs tracking-wider uppercase bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition-colors font-medium"
                  data-testid="button-list-space"
                >
                  List your space
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
