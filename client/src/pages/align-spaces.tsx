import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Camera, Star, Info, User, Building2, ChevronDown, Search, MapPin, DollarSign, ArrowRight, Palette, Check, ChevronRight, Images, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "@/components/site-footer";
import { UserIndicator } from "@/components/user-indicator";
import { ListSpaceModal } from "@/components/list-space-modal";

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

function SpaceCard({ space }: { space: Space }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [, setLocation] = useLocation();
  const paletteData = parseColorPalette(space.colorPalette);

  return (
    <div
      className="group rounded-xl overflow-hidden bg-white border border-stone-100 hover:shadow-lg transition-all duration-300 cursor-pointer"
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
      <div className="p-4 sm:p-5">
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

        <div className="flex items-center pt-1">
          <div className="flex items-center gap-1.5 text-stone-700">
            <DollarSign className="w-3.5 h-3.5 text-[#c4956a]" />
            <span className="font-semibold text-sm">${space.pricePerHour}/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlignSpacesPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const { data: spaces, isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
  });

  const { data: featuredPros } = useQuery<FeaturedPro[]>({
    queryKey: ["/api/featured"],
  });

  useEffect(() => {
    document.title = "Align | Professional Workspaces for Miami Professionals";
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
                  className="absolute left-0 top-full mt-2 bg-white border border-stone-200 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                >
                  <button onClick={() => { setLocation("/workspaces"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-browse-menu">
                    <Building2 className="w-4 h-4" />
                    Workspaces
                  </button>
                  <button onClick={() => { setLocation("/portrait-builder"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-menu">
                    <Camera className="w-4 h-4" />
                    Portrait Builder
                  </button>
                  <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-menu">
                    <Images className="w-4 h-4" />
                    Our Work
                  </button>
                  <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-menu">
                    <User className="w-4 h-4" />
                    Client Portal
                  </button>
                  <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-menu">
                    <Star className="w-4 h-4" />
                    Featured Pros
                  </button>
                  <button onClick={() => { setLocation("/our-vision"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-menu">
                    <Info className="w-4 h-4" />
                    Our Vision
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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

          <UserIndicator variant="light" />
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
            Where Your Work <span className="italic font-normal">and Space</span> Align
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-stone-500 text-sm sm:text-base mt-3 max-w-lg mx-auto leading-relaxed"
          >
            Thoughtfully designed spaces for therapists, coaches, and creatives, booked by the hour, built for the work you do.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-5"
          >
            <Link
              href="/workspaces"
              data-testid="button-browse-all"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse Workspaces
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="text-center px-4 sm:px-6 pb-6 sm:pb-8">
        <p className="text-stone-400 text-sm italic font-serif" data-testid="text-hero-bridge">
          Every space is selected for the professionals who work in it.
        </p>
      </div>

      <section className="px-4 sm:px-6 pb-12 sm:pb-16" data-testid="section-spaces-grid">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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

          {!spacesLoading && allSpaces.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 rounded-xl px-5 py-4 bg-[#faf6f1] border border-[#e8ddd0]/60" data-testid="section-post-space-cta">
                <p className="text-sm text-foreground/60 text-center sm:text-left">
                  <span className="font-medium text-foreground/80">Have a space to share?</span>{" "}
                  <span className="hidden sm:inline">Join a growing network of Miami spaces.</span>
                </p>
                <button
                  onClick={() => setShowListModal(true)}
                  className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase bg-stone-900 text-white px-4 py-2 w-full sm:w-auto rounded-full hover:bg-stone-800 transition-colors font-medium"
                  data-testid="button-post-space-cta"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post your space
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 justify-center" data-testid="section-neighborhoods">
                <span className="text-[11px] text-stone-400 uppercase tracking-wider font-medium whitespace-nowrap">Explore Miami</span>
                <div className="hidden sm:block w-px h-4 bg-stone-300/60" />
                <div className="flex flex-wrap justify-center gap-2">
                  {(() => {
                    const neighborhoods = [...new Set((spaces || []).map(s => s.neighborhood).filter(Boolean))];
                    const allNeighborhoods = neighborhoods.length > 0 ? neighborhoods : ["Wynwood", "Coral Gables", "Brickell", "Coconut Grove"];
                    return allNeighborhoods.map((hood) => (
                      <Link
                        key={hood}
                        href="/workspaces"
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-stone-200/80 hover:border-[#c4956a]/40 hover:bg-white transition-all duration-300"
                        data-testid={`neighborhood-${hood?.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <MapPin className="w-3 h-3 text-[#c4956a]" />
                        <span className="text-xs font-medium text-stone-600 group-hover:text-stone-900 transition-colors">{hood}</span>
                      </Link>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white/60" data-testid="section-how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">The Process</span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight">How Align Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {[
              {
                step: "01",
                title: "Discover Workspaces",
                desc: "Explore flexible workspaces designed for professionals, from therapy offices and studios to meeting rooms and creative spaces.",
                detail: "Because the right environment changes how clients experience your work.",
              },
              {
                step: "02",
                title: "Find the Right Fit",
                desc: "Use Align's visual tools to identify the atmosphere, setting, and client experience that matches your work.",
                detail: "Because the wrong room changes everything.",
              },
              {
                step: "03",
                title: "Book & Get Started",
                desc: "Reserve your space by the hour with transparent pricing, instant confirmation, and calendar integration.",
                detail: "Walk in ready. The space already says what you came to say.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center flex flex-col items-center" data-testid={`step-${item.step}`}>
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-2">{item.step}</span>
                <h3 className="font-serif text-lg text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed max-w-[260px]">{item.desc}</p>
                <div className="w-8 h-px bg-stone-300 my-3" />
                <p className="text-stone-400 text-[13px] leading-relaxed max-w-[240px] italic">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6" data-testid="section-portraits-feature">
        <div className="max-w-5xl mx-auto">
          <p className="text-center font-serif text-lg sm:text-xl text-stone-500 italic mb-8 sm:mb-10" data-testid="text-portrait-bridge">
            Your space is only half the picture.
          </p>
          <div className="bg-stone-900 rounded-2xl overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden">
              <img
                src="/images/hero-bg-bright.webp"
                alt="Professional portrait session"
                className="w-full h-full object-cover"
                style={{ objectPosition: "43% 25%" }}
              />
            </div>
            <div className="md:w-3/5 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-3">See Yourself Clearly</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#f0e6d0] tracking-tight leading-tight mb-5">
                Portrait Builder
              </h2>
              <p className="text-[#f0e6d0]/90 text-base sm:text-[17px] leading-relaxed mb-6 max-w-md font-serif italic">
                How you see yourself and how others see you aren't always the same thing.
              </p>
              <p className="text-[#d4c4a8] text-sm leading-relaxed mb-2 max-w-md">
                Answer a few questions about your environment and your presence and the feeling you want clients to walk away with. We'll match you with a creative direction and a wardrobe guide and a color palette, then build a shoot concept you can book on the spot.
              </p>
              <p className="text-[#c4956a]/70 text-[13px] leading-relaxed mb-6 max-w-md italic">
                Takes about 2 minutes. Ends with a complete shoot plan built around you.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/portrait-builder"
                  data-testid="button-portraits-cta"
                  className="inline-flex items-center gap-2 uppercase px-6 py-2.5 transition-all duration-300 border rounded-lg text-sm font-medium"
                  style={{ color: "#c9a96e", borderColor: "#c9a96e" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  Start the Builder
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/portfolio"
                  data-testid="button-our-work-cta"
                  className="inline-flex items-center gap-2 uppercase px-6 py-2.5 transition-all duration-300 border rounded-lg text-sm font-medium"
                  style={{ color: "#d4c4a8", borderColor: "#d4c4a8" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212,196,168,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Images className="w-4 h-4" />
                  Our Work
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {(featuredPros || []).slice(0, 3).map((pro) => (
                <Link
                  key={pro.id}
                  href={`/featured/${pro.slug}`}
                  className="group block rounded-xl overflow-hidden bg-white border border-stone-100 hover:shadow-lg transition-all duration-300"
                  data-testid={`featured-pro-${pro.id}`}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-stone-100 relative">
                    {pro.portraitImageUrl ? (() => {
                      const crop = pro.portraitCropPosition as any;
                      const x = crop?.x ?? 50;
                      const y = crop?.y ?? 50;
                      const zoom = crop?.zoom ?? 1;
                      // Use negative inset to simulate zoom via overflow + scale,
                      // keeping the image sharp by letting the browser sample more pixels
                      const insetPct = zoom > 1 ? ((1 - 1 / zoom) / 2) * 100 : 0;
                      return (
                        <img
                          src={pro.portraitImageUrl}
                          alt={pro.name}
                          className="absolute object-cover transition-transform duration-500"
                          style={{
                            objectPosition: `${x}% ${y}%`,
                            top: `-${insetPct}%`,
                            left: `-${insetPct}%`,
                            width: `${100 + insetPct * 2}%`,
                            height: `${100 + insetPct * 2}%`,
                          }}
                        />
                      );
                    })() : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
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

            <div className="sm:hidden text-center mt-6">
              <Link
                href="/featured"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors"
                data-testid="link-featured-all-mobile"
              >
                View all professionals
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-center mt-10 sm:mt-12 pt-8 border-t border-stone-100">
              <p className="text-stone-600 font-serif text-base sm:text-lg mb-2">Your space, your image, your practice.</p>
              <p className="text-stone-400 text-sm mb-5">All in one place.</p>
              <Link
                href="/workspaces"
                data-testid="button-featured-find-space"
                className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Start with a space
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-14 sm:py-20 px-4 sm:px-6 hidden" data-testid="section-testimonials">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 tracking-tight">Trusted by Miami Professionals</h2>
            <p className="text-stone-500 text-sm mt-2 max-w-md mx-auto">Join therapists, coaches, and creators who use Align every day</p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="break-inside-avoid mb-4 sm:mb-5"
                data-testid={`testimonial-${i}`}
              >
                <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl text-stone-300 leading-none select-none">&ldquo;</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed mb-5"
                    dangerouslySetInnerHTML={{
                      __html: t.quote.replace(/\*\*(.*?)\*\*/g, '<strong class="text-stone-900 font-semibold">$1</strong>')
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-200 to-stone-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{t.name}</p>
                      <p className="text-[11px] text-stone-400">{t.title}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      <AnimatePresence>
        {showListModal && <ListSpaceModal onClose={() => setShowListModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
