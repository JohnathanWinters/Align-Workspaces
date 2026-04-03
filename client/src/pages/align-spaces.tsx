import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { setPageMeta } from "@/lib/seo";
import { Menu, X, Camera, Star, Info, Compass, User, Building2, ChevronDown, Search, MapPin, DollarSign, ArrowRight, Palette, Check, ChevronRight, Images, Plus, Clock, CalendarDays, Repeat, Shield, Sparkles, Users, HelpCircle, Heart, Briefcase, Leaf, Scissors, BadgeCheck, FileCheck, ShieldCheck, Percent } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "@/components/site-footer";
import { UserIndicator } from "@/components/user-indicator";
import { ListSpaceModal } from "@/components/list-space-modal";
import { PostEventModal } from "@/components/post-event-modal";

interface Space {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  shortDescription: string | null;
  address: string;
  neighborhood: string;
  pricePerHour: number;
  imageUrls: string[];
  targetProfession: string | null;
  amenities: string[];
  colorPalette?: string | null;
  verified?: boolean;
}

interface FeaturedPro {
  id: string;
  name: string;
  profession: string;
  location: string;
  slug: string;
  portraitImageUrl: string | null;
  portraitCropPosition?: any;
  spaceImageUrl?: string | null;
  spaceName?: string | null;
  headline: string;
  quote: string;
  yearsHosting?: number | null;
  locationCount?: number | null;
}

const testimonials = [
  {
    quote: "Exactly what therapists in Miami needed. Booking a professional room for sessions is **finally simple and affordable**.",
    name: "Dr. Laura M.",
    title: "Licensed Therapist, Coral Gables",
  },
  {
    quote: "The space made my clients feel comfortable from the moment they walked in. **My coaching practice grew 40% after switching to Align**.",
    name: "Carlos R.",
    title: "Business Coach, Brickell",
  },
  {
    quote: "Having access to curated, beautiful spaces **completely changed how I work with clients**. I used to spend hours finding locations.",
    name: "Sofia T.",
    title: "Portrait Photographer, Wynwood",
  },
  {
    quote: "I listed my office and **it was booked within the first week**. The platform handles everything, payments, scheduling, all of it.",
    name: "James K.",
    title: "Wellness Studio Owner, Coconut Grove",
  },
  {
    quote: "As a new therapist in Miami, finding affordable session space was impossible. **Align solved that problem overnight**.",
    name: "Andrea P.",
    title: "Licensed Counselor, Doral",
  },
  {
    quote: "The booking process is seamless. My clients love the spaces and **I love not having to manage a lease**.",
    name: "Maria V.",
    title: "Life Coach, Coral Gables",
  },
];

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

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const onDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    state.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.current.isDown) return;
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - state.current.startX) * 1.5;
    if (Math.abs(walk) > 5) state.current.moved = true;
    el.scrollLeft = state.current.scrollLeft - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    state.current.isDown = false;
    const el = ref.current;
    if (!el) return;
    el.style.cursor = "";
    el.style.scrollSnapType = "";
  }, []);

  const onMouseLeave = useCallback(() => {
    if (state.current.isDown) {
      state.current.isDown = false;
      const el = ref.current;
      if (!el) return;
      el.style.cursor = "";
      el.style.scrollSnapType = "";
    }
  }, []);

  const preventClickIfDragged = useCallback((e: React.MouseEvent) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }, []);

  return { ref, onDragStart, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, preventClickIfDragged };
}

function SpaceCard({ space }: { space: Space }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [, setLocation] = useLocation();
  const paletteData = parseColorPalette(space.colorPalette);

  return (
    <div
      className="group rounded-xl overflow-hidden bg-white border border-stone-100 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
      data-testid={`space-card-${space.id}`}
      onClick={() => setLocation(`/spaces/${space.slug}`)}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={space.imageUrls?.[0] || "/images/spaces-hero.png"}
          alt={space.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {space.verified && (
          <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
            <Check className="w-3 h-3 text-[#c4956a]" />
            <span className="text-[10px] font-semibold text-stone-700">Verified</span>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {space.targetProfession && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-[#c4956a] tracking-wide">Ideal for {space.targetProfession}</span>
          </div>
        )}
        <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1 group-hover:text-[#c4956a] transition-colors">{space.name}</h3>
        <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{space.neighborhood || space.address}</span>
        </div>

        {space.amenities && space.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {space.amenities.slice(0, 3).map((amenity, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-stone-50 text-stone-500 px-1.5 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5 text-[#c4956a]" />
                {amenity}
              </span>
            ))}
            {space.amenities.length > 3 && (
              <span className="text-[10px] text-stone-400 px-1 py-0.5">+{space.amenities.length - 3} more</span>
            )}
          </div>
        )}

        {paletteData && (
          <div
            className={`mb-3 p-2.5 rounded-lg border transition-all duration-300 ${paletteOpen ? "bg-stone-50 border-stone-200 shadow-sm" : "bg-stone-50/80 border-stone-100 hover:border-stone-200 hover:shadow-sm"}`}
            onClick={(e) => {
              e.stopPropagation();
              setPaletteOpen(!paletteOpen);
            }}
            data-testid={`palette-toggle-${space.id}`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Palette className="w-3 h-3 text-[#c4956a]" />
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Color Palette</span>
              <ChevronDown className={`w-3 h-3 text-stone-400 ml-auto transition-transform duration-200 ${paletteOpen ? "rotate-180" : ""}`} />
            </div>
            <div className="flex items-center gap-2.5">
              {paletteData.colors.slice(0, 4).map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={`rounded-full border-2 border-white shadow-sm transition-all duration-200 ${paletteOpen ? "w-8 h-8" : "w-6 h-6"}`} style={{ backgroundColor: c.hex }} />
                  <span className="text-[7px] text-stone-400 font-medium max-w-[40px] truncate text-center">{c.name}</span>
                </div>
              ))}
            </div>
            {!paletteOpen && paletteData.feel && (
              <p className="text-[10px] text-stone-400 italic mt-1.5 line-clamp-1">{paletteData.feel}</p>
            )}
            <AnimatePresence>
              {paletteOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 pt-2.5 border-t border-stone-200/60 space-y-2">
                    {paletteData.feel && (
                      <p className="text-[11px] text-stone-600 italic leading-relaxed">"{paletteData.feel}"</p>
                    )}
                    {paletteData.explanation && (
                      <>
                        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">How These Colors Shape the Experience</p>
                        <p className="text-xs text-stone-500 leading-relaxed">{paletteData.explanation}</p>
                      </>
                    )}
                    {!paletteData.explanation && !paletteData.feel && (
                      <p className="text-xs text-stone-400 italic">Color details coming soon.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1 mt-auto">
          <div className="flex items-center gap-1.5 text-stone-700">
            <DollarSign className="w-3.5 h-3.5 text-[#c4956a]" />
            <span className="font-semibold text-sm">${space.pricePerHour}/hr</span>
          </div>
          {space.pricePerDay && (
            <span className="text-xs text-stone-400">${space.pricePerDay}/day</span>
          )}
          {(space as any).recurringDiscountPercent > 0 && (
            <span className="text-xs text-[#946b4a] font-medium">
              ${Math.round(space.pricePerHour * (1 - (space as any).recurringDiscountPercent / 100))}/hr recurring
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  therapy: "bg-[#f0ebe6] text-[#7a6e62]",
  coaching: "bg-[#f5ede3] text-[#946b4a]",
  wellness: "bg-[#eef0eb] text-[#687362]",
  workshop: "bg-[#eeebf0] text-[#706580]",
  creative: "bg-[#f2ebe8] text-[#8a6560]",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  therapy: "Therapy", coaching: "Coaching", wellness: "Wellness", workshop: "Workshop", creative: "Creative",
};

function EventCard({ event }: { event: { id: string; title: string; category: string; eventDate: string; eventTime: string; endTime: string | null; location: string | null; hostName: string; rsvpCount: number } }) {
  const date = new Date(event.eventDate + "T00:00:00");
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const timeStr = new Date(`2000-01-01T${event.eventTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="snap-start shrink-0 w-[72%] sm:w-auto bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-shadow">
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${EVENT_TYPE_COLORS[event.category] || "bg-stone-100 text-stone-500"}`}>
        {EVENT_TYPE_LABELS[event.category] || event.category}
      </span>
      <div className="flex gap-3 mt-3">
        <div className="text-center shrink-0 w-12">
          <p className="text-[10px] text-[#c4956a] font-semibold tracking-wider">{month}</p>
          <p className="text-2xl font-bold text-stone-900 leading-none">{day}</p>
          <p className="text-[10px] text-stone-400 font-medium">{weekday}</p>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2">{event.title}</h3>
          <p className="text-xs text-stone-500 mt-1">{event.hostName}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
            {event.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {event.location}</span>}
          </div>
          {event.rsvpCount > 0 && (
            <p className="text-[10px] text-[#c4956a] font-medium mt-1.5">{event.rsvpCount} attending</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlignSpacesPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showPostEventModal, setShowPostEventModal] = useState(false);
  const [_showExplore, _setShowExplore] = useState(false);
  const spacesCarousel = useDragScroll();
  const prosCarousel = useDragScroll();
  const eventsCarousel = useDragScroll();

  const { data: spaces, isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
  });

  const { data: featuredPros } = useQuery<FeaturedPro[]>({
    queryKey: ["/api/featured"],
  });

  const { data: communityEvents } = useQuery<{
    id: string; title: string; description: string; category: string;
    eventDate: string; eventTime: string; endTime: string | null;
    location: string | null; hostName: string; rsvpCount: number;
  }[]>({
    queryKey: ["/api/community-events"],
  });

  useEffect(() => {
    setPageMeta({
      title: "Align Workspaces | Flexible Workspace Rentals & Professional Portraits in Miami",
      description: "Rent therapy offices, coaching rooms, creative studios, and wellness spaces by the hour in Miami. Professional branding photography for small business professionals. Book on Align.",
      url: "https://alignworkspaces.com",
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest("[data-menu-container]")) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const allSpaces = (spaces || []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-[#f5f0e8] min-h-screen" data-testid="page-landing">
      <nav className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="w-9">
            <UserIndicator variant="light" />
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5" data-testid="link-home-logo">
            <img
              src="/images/logo-align-cream.png"
              alt="Align"
              className="h-8 w-8 object-contain"
            />
            <span
              className="uppercase hidden sm:block"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "7px", letterSpacing: "3.5px", paddingLeft: "3.5px", color: "#f0e6d0" }}
            >
              Align
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative" data-menu-container>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                data-testid="button-main-menu"
                className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase font-semibold transition-colors duration-300 px-3 py-2 rounded-lg cursor-pointer relative z-10"
                style={{ color: "#d4c4a8" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f0e6d0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#d4c4a8"; }}
              >
                {menuOpen ? <X className="w-5 h-5 pointer-events-none" /> : <Menu className="w-5 h-5 pointer-events-none" />}
                Menu
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-stone-200 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                  >
                    <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-menu">
                      <User className="w-4 h-4" />
                      Client Portal
                    </button>
                    <button onClick={() => { setLocation("/workspaces"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-browse-menu">
                      <Building2 className="w-4 h-4" />
                      Workspaces
                    </button>
                    <button onClick={() => { setLocation("/portraits"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-menu">
                      <Camera className="w-4 h-4" />
                      Portraits
                    </button>
                    <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-menu">
                      <Images className="w-4 h-4" />
                      Portfolio
                    </button>
                    <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-menu">
                      <Star className="w-4 h-4" />
                      Featured Pros
                    </button>
                    <button onClick={() => { document.querySelector('[data-testid="section-community-events"]')?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-events-menu">
                      <CalendarDays className="w-4 h-4" />
                      Community Events
                    </button>
                    <button onClick={() => { setLocation("/pricing"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-pricing-menu">
                      <DollarSign className="w-4 h-4" />
                      Pricing
                    </button>
                    <button onClick={() => { setLocation("/our-vision"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-menu">
                      <Compass className="w-4 h-4" />
                      Our Vision
                    </button>
                    <button onClick={() => { setLocation("/support"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-support-menu">
                      <HelpCircle className="w-4 h-4" />
                      Support
                    </button>
                    <div className="border-t border-stone-100 my-1" />
                    <button onClick={() => { setShowListModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-[#c4956a] hover:text-[#b3845d] hover:bg-[#c4956a]/5 transition-colors flex items-center gap-3 font-medium" data-testid="link-list-space-menu">
                      <Plus className="w-4 h-4" />
                      List Your Space
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6" data-testid="section-hero-header">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight leading-tight"
          >
            Practice-Ready <span className="italic font-normal">Workspaces</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-stone-500 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed"
          >
            For professionals who see clients. Insured, certified, and built for your work, by the hour, no lease.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/workspaces"
              data-testid="button-browse-all"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse Workspaces
            </Link>
            <button
              onClick={() => setShowListModal(true)}
              data-testid="button-hero-list-space"
              className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white/60 hover:border-stone-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              List Your Space
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-5 flex items-center justify-center gap-4 sm:gap-6 text-[11px] text-stone-400"
          >
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-[#c4956a]" /> Verified Insurance</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-[#c4956a]" /> Certified Spaces</span>
            <span className="hidden sm:flex items-center gap-1.5"><Percent className="w-3 h-3 text-[#c4956a]" /> Hosts Keep 87.5%</span>
          </motion.div>
        </div>
      </section>

      <div className="text-center px-4 sm:px-6 pb-4 sm:pb-6">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold">Available Now</span>
      </div>

      <section className="pb-12 sm:pb-16" data-testid="section-spaces-grid">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: horizontal scroll carousel */}
          <div className="sm:hidden">
            <div
              ref={spacesCarousel.ref}
              onDragStart={spacesCarousel.onDragStart}
              onMouseDown={spacesCarousel.onMouseDown}
              onMouseMove={spacesCarousel.onMouseMove}
              onMouseUp={spacesCarousel.onMouseUp}
              onMouseLeave={spacesCarousel.onMouseLeave}
              onClickCapture={spacesCarousel.preventClickIfDragged}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-4 -mx-0 scrollbar-none cursor-grab select-none [&_img]:pointer-events-none [&_img]:select-none" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
            >
              {spacesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="snap-start flex-shrink-0 w-[85%] rounded-xl overflow-hidden bg-white border border-stone-100 animate-pulse">
                    <div className="aspect-[4/3] bg-stone-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-stone-200 rounded w-3/4" />
                      <div className="h-4 bg-stone-200 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : allSpaces.map((space) => (
                <div key={space.id} className="snap-start flex-shrink-0 w-[85%]">
                  <SpaceCard space={space} />
                </div>
              ))}
            </div>
            {!spacesLoading && allSpaces.length > 2 && (
              <p className="text-center text-[11px] text-stone-400 mt-1 px-4">Swipe to see more</p>
            )}
          </div>
          {/* Desktop: grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 px-4 sm:px-6">
            {spacesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-white border border-stone-100 animate-pulse">
                  <div className="aspect-[4/3] bg-stone-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : allSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 px-4 sm:px-6" data-testid="section-professional-categories">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-3">Find Your Fit</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 tracking-tight mb-6">Spaces Certified for Your Profession</h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {[
              { icon: Heart, title: "Clinical Ready", color: "bg-[#f0ebe6] text-[#7a6e62] border-[#e0d6cc]" },
              { icon: Briefcase, title: "Consultation Ready", color: "bg-[#f5ede3] text-[#946b4a] border-[#e8ddd0]" },
              { icon: Leaf, title: "Wellness Ready", color: "bg-[#eef0eb] text-[#687362] border-[#dde2d8]" },
              { icon: Scissors, title: "Service Ready", color: "bg-[#f2ebe8] text-[#8a6560] border-[#e5d8d4]" },
              { icon: Building2, title: "General Professional", color: "bg-stone-50 text-stone-600 border-stone-200" },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={i}
                  href="/workspaces"
                  className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-full border ${cat.color} hover:shadow-sm transition-all`}
                  data-testid={`category-${i}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.title}</span>
                </Link>
              );
            })}
          </div>
          <p className="text-[11px] text-stone-400 mt-4">
            Certifications describe the space, not the person booking it.{" "}
            <Link href="/trust" className="text-[#c4956a] hover:underline">Learn more</Link>
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white/60" data-testid="section-why-align">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Why Align</span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight">Built for the Way You Work</h2>
            <p className="text-stone-500 text-sm mt-2 max-w-lg mx-auto">Industrial-level tools and protections designed for independent professionals. No other workspace marketplace offers this.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: ShieldCheck, title: "Verified Host Insurance", desc: "Every host maintains $1M+ liability coverage. Listings are suspended if insurance lapses. Your safety is non-negotiable." },
              { icon: Repeat, title: "Recurring Bookings", desc: "Lock in a weekly time slot for your regulars. Set it once, and your space is guaranteed every week." },
              { icon: BadgeCheck, title: "Certified Spaces", desc: "Hosts self-certify across five tiers, from Clinical Ready for therapists to Service Ready for barbers. Know what you're walking into." },
              { icon: FileCheck, title: "Booking Agreements", desc: "Every booking includes a mutual acknowledgment. Hosts confirm their space is accurate and insured. Guests confirm professional responsibility." },
              { icon: Building2, title: "Made for Your Practice", desc: "Therapy offices, coaching rooms, wellness studios, creative spaces. Find the setting that fits your work." },
              { icon: Compass, title: "Obvious Fit, Every Time", desc: "Every workspace is positioned by practice type so the right professionals find the right space. No guesswork, no wasted visits." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-stone-100 p-5 sm:p-6 hover:shadow-md hover:border-stone-200 transition-all" data-testid={`feature-${i}`}>
                  <div className="w-10 h-10 rounded-lg bg-[#c4956a]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#c4956a]" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-stone-800 mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!spacesLoading && allSpaces.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 rounded-xl px-5 py-4 bg-[#faf6f1] border border-[#e8ddd0]/60 w-full" data-testid="section-post-space-cta">
                <p className="text-sm text-foreground/60 text-center sm:text-left">
                  <span className="font-medium text-foreground/80">Have a workspace to share?</span>{" "}
                  <span className="hidden sm:inline">Join a growing network of Miami workspaces.</span>
                </p>
                <button
                  onClick={() => setShowListModal(true)}
                  className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase bg-stone-900 text-white px-4 py-2 w-full sm:w-auto rounded-full hover:bg-stone-800 transition-colors font-medium"
                  data-testid="button-post-space-cta"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post your workspace
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/trust"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
            >
              Learn more about Trust & Safety <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white/60" data-testid="section-pricing-signal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Transparent Pricing</span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight">No Lease. No Membership. No Surprises.</h2>
            <p className="text-stone-500 text-sm mt-2 max-w-lg mx-auto">Pay only for the hours you use. The lowest marketplace fees in the industry.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-white rounded-xl border border-stone-100 p-6 text-center">
              <p className="text-3xl sm:text-4xl font-serif text-stone-900 mb-1">87.5%</p>
              <p className="text-sm font-medium text-stone-600 mb-2">Hosts Keep</p>
              <p className="text-xs text-stone-400 leading-relaxed">Just 12.5% service fee. Bring your own clients and keep 89.5%.</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-100 p-6 text-center">
              <p className="text-3xl sm:text-4xl font-serif text-stone-900 mb-1">7%</p>
              <p className="text-sm font-medium text-stone-600 mb-2">Guest Service Fee</p>
              <p className="text-xs text-stone-400 leading-relaxed">Repeat guests pay just 5%. No hidden charges, no deposits.</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-100 p-6 text-center">
              <p className="text-3xl sm:text-4xl font-serif text-stone-900 mb-1">$0</p>
              <p className="text-sm font-medium text-stone-600 mb-2">To Get Started</p>
              <p className="text-xs text-stone-400 leading-relaxed">No setup fees, no listing fees, no monthly subscription. Just book or list.</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors"
              data-testid="link-pricing-details"
            >
              See full pricing details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6" data-testid="section-portraits-feature">
        <div className="max-w-5xl mx-auto">
          <p className="text-center font-serif text-lg sm:text-xl text-stone-400 italic mb-8 sm:mb-10" data-testid="text-portrait-bridge">
            Your space is only half the picture.
          </p>
          <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden relative">
              <img
                src="/images/portrait-hero-homepage.webp"
                alt="Professional portrait with creative direction"
                className="w-full h-full object-cover"
                style={{ objectPosition: "50% 25%" }}
              />
              {/* Mood board overlay — shows the design output, not just the photo */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                <div className="flex items-end justify-between gap-3">
                  <div className="flex-shrink-0">
                    <img
                      src="/images/env-office-bright.webp"
                      alt="Office environment mood"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-white/30"
                    />
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    {["#A8C4D4", "#F5EDE3", "#8B7355"].map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white/40"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-white/60 mt-2 tracking-wide uppercase">Oat & Sage, Welcoming, Bright</p>
              </div>
            </div>
            <div className="md:w-3/5 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-3">Your Image Is Your First Session</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 tracking-tight leading-tight mb-4">
                Design the First Impression<br />Your Clients Deserve
              </h2>
              <p className="text-stone-500 text-base sm:text-[17px] leading-relaxed mb-5 max-w-md font-serif italic">
                Most professionals guess at how they come across. This replaces the guessing.
              </p>
              <p className="text-stone-400 text-sm leading-relaxed mb-2 max-w-md">
                You've invested in your credentials, your space, your practice. But your image is still a phone selfie or a generic headshot that could belong to anyone. Tell us your setting, your energy, and what you want clients to feel, we'll hand you a shoot concept with creative direction, wardrobe guidance, and a color palette. Book it on the spot.
              </p>
              <p className="text-stone-400/70 text-[13px] leading-relaxed mb-6 max-w-md italic">
                Takes about 2 minutes. Ends with a complete shoot plan built around you.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/portraits"
                  data-testid="button-portraits-cta"
                  className="inline-flex items-center gap-2 px-6 py-2.5 transition-all duration-300 rounded-lg text-sm font-medium bg-stone-900 text-white hover:bg-stone-800"
                >
                  Build Your Shoot Concept
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/portfolio"
                  data-testid="button-our-work-cta"
                  className="inline-flex items-center gap-2 px-6 py-2.5 transition-all duration-300 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  <Images className="w-4 h-4" />
                  Portfolio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(featuredPros || []).length > 0 && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white/60" data-testid="section-featured-pros">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Community</span>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight">Professionals Who Align Here</h2>
                <p className="text-stone-500 text-sm mt-2 max-w-md">Real professionals building their practice in Miami. See how they use Align to find the right space for their work.</p>
              </div>
              <Link
                href="/featured"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors"
                data-testid="link-featured-all"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile: horizontal scroll carousel */}
            <div className="sm:hidden">
              <div
                ref={prosCarousel.ref}
                onDragStart={prosCarousel.onDragStart}
                onMouseDown={prosCarousel.onMouseDown}
                onMouseMove={prosCarousel.onMouseMove}
                onMouseUp={prosCarousel.onMouseUp}
                onMouseLeave={prosCarousel.onMouseLeave}
                onClickCapture={prosCarousel.preventClickIfDragged}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-4 scrollbar-none cursor-grab select-none [&_img]:pointer-events-none [&_img]:select-none" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
              >
                {(featuredPros || []).slice(0, 6).map((pro) => (
                  <Link
                    key={pro.id}
                    href={`/featured/${pro.slug}`}
                    className="snap-start flex-shrink-0 w-[78%] group block rounded-xl overflow-hidden bg-white border border-stone-100 hover:shadow-lg transition-all duration-300"
                    data-testid={`featured-pro-${pro.id}`}
                  >
                    <div className="relative">
                      <div className="aspect-[4/5] overflow-hidden bg-stone-100 relative">
                        {pro.portraitImageUrl ? (() => {
                          const crop = pro.portraitCropPosition as any;
                          const x = crop?.x ?? 50;
                          const y = crop?.y ?? 50;
                          const zoom = crop?.zoom ?? 1;
                          const insetPct = zoom > 1 ? ((1 - 1 / zoom) / 2) * 100 : 0;
                          return (
                            <img src={pro.portraitImageUrl} alt={pro.name}
                              className="absolute object-cover"
                              style={{ objectPosition: `${x}% ${y}%`, top: `-${insetPct}%`, left: `-${insetPct}%`, width: `${100 + insetPct * 2}%`, height: `${100 + insetPct * 2}%` }}
                            />
                          );
                        })() : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-16 h-16 text-stone-300" />
                          </div>
                        )}
                      </div>
                      {pro.spaceImageUrl && (
                        <div className="absolute -bottom-6 left-3 w-[180px] h-[125px] rounded-xl ring-[3px] ring-[#faf9f7] shadow-lg z-20 overflow-hidden">
                          <img src={pro.spaceImageUrl} alt={pro.spaceName || "Their workspace"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className={`p-4 ${pro.spaceImageUrl ? "pt-16" : ""}`}>
                      <h3 className="font-serif text-lg font-semibold text-stone-900 mb-0.5">{pro.name}</h3>
                      <p className="text-sm text-[#c4956a] font-medium mb-1">{pro.profession}</p>
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{pro.location}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-2 px-4">
                <Link
                  href="/featured"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors"
                  data-testid="link-featured-all-mobile"
                >
                  View all professionals
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Desktop: grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {(featuredPros || []).slice(0, 3).map((pro) => (
                <Link
                  key={pro.id}
                  href={`/featured/${pro.slug}`}
                  className="group block rounded-xl overflow-hidden bg-white border border-stone-100 hover:shadow-lg transition-all duration-300"
                  data-testid={`featured-pro-${pro.id}`}
                >
                  <div className="relative">
                    <div className="aspect-[3/4] overflow-hidden bg-stone-100 relative">
                      {pro.portraitImageUrl ? (() => {
                        const crop = pro.portraitCropPosition as any;
                        const x = crop?.x ?? 50;
                        const y = crop?.y ?? 50;
                        const zoom = crop?.zoom ?? 1;
                        const insetPct = zoom > 1 ? ((1 - 1 / zoom) / 2) * 100 : 0;
                        return (
                          <img src={pro.portraitImageUrl} alt={pro.name}
                            className="absolute object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            style={{ objectPosition: `${x}% ${y}%`, top: `-${insetPct}%`, left: `-${insetPct}%`, width: `${100 + insetPct * 2}%`, height: `${100 + insetPct * 2}%` }}
                          />
                        );
                      })() : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-stone-300" />
                        </div>
                      )}
                    </div>
                    {pro.spaceImageUrl && (
                      <div className="absolute -bottom-6 left-4 w-[180px] h-[125px] rounded-xl ring-[3px] ring-[#faf9f7] shadow-lg z-20 overflow-hidden">
                        <img src={pro.spaceImageUrl} alt={pro.spaceName || "Their workspace"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className={`p-4 sm:p-5 ${pro.spaceImageUrl ? "pt-14 sm:pt-16" : ""}`}>
                    <h3 className="font-serif text-lg font-semibold text-stone-900 mb-0.5">{pro.name}</h3>
                    <p className="text-sm text-[#c4956a] font-medium mb-2">{pro.profession}</p>
                    {pro.quote && (
                      <p className="text-stone-500 text-[13px] leading-relaxed italic mb-2 line-clamp-2">"{pro.quote}"</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{pro.location}</span>
                      </div>
                      <span className="text-[11px] font-medium text-[#c4956a] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Read more <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10 sm:mt-12 pt-8 border-t border-stone-100">
              <p className="text-stone-600 font-serif text-base sm:text-lg mb-2">Your space, your image, your practice.</p>
              <p className="text-stone-400 text-sm mb-5">All in one place.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/workspaces"
                  data-testid="button-featured-browse"
                  className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
                >
                  Browse Workspaces
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setShowListModal(true)}
                  data-testid="button-featured-list"
                  className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/60 hover:border-stone-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  List Your Space
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Community Events ─── */}
      {communityEvents && communityEvents.length > 0 && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white/60" data-testid="section-community-events">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Community</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900">Upcoming Events</h2>
              <p className="text-stone-500 text-sm mt-2 max-w-md mx-auto">Free events by professionals, for professionals.</p>
            </div>

            {/* Mobile carousel */}
            <div className="sm:hidden -mx-4">
              <div
                ref={eventsCarousel.ref}
                onMouseDown={eventsCarousel.onMouseDown}
                onMouseMove={eventsCarousel.onMouseMove}
                onMouseUp={eventsCarousel.onMouseUp}
                onMouseLeave={eventsCarousel.onMouseLeave}
                onDragStart={eventsCarousel.onDragStart}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {communityEvents.slice(0, 6).map(evt => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            </div>

            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-3 gap-5">
              {communityEvents.slice(0, 3).map(evt => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setShowPostEventModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                data-testid="button-post-event"
              >
                <CalendarDays className="w-4 h-4" />
                Post an Event
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Empty state: show Post CTA even with no events */}
      {(!communityEvents || communityEvents.length === 0) && (
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Community</span>
            <h2 className="font-serif text-xl sm:text-2xl text-stone-900 mb-2">Community Events</h2>
            <p className="text-stone-500 text-sm mb-5">Know of a free event for professionals? Share it with the community.</p>
            <button
              onClick={() => setShowPostEventModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
              data-testid="button-post-event-empty"
            >
              <CalendarDays className="w-4 h-4" />
              Post an Event
            </button>
          </div>
        </section>
      )}

      <SiteFooter />

      <AnimatePresence>
        {showListModal && <ListSpaceModal onClose={() => setShowListModal(false)} />}
        {showPostEventModal && <PostEventModal onClose={() => setShowPostEventModal(false)} />}
      </AnimatePresence>

      {/* Explore modal removed, replaced with direct CTAs */}
    </div>
  );
}
