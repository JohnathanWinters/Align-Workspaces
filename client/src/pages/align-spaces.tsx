import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Camera, Star, Info, User, Building2, ChevronDown, Search, CalendarDays, Sparkles, MapPin, DollarSign, ArrowRight, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "@/components/site-footer";
import { UserIndicator } from "@/components/user-indicator";

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
}

interface FeaturedPro {
  id: string;
  name: string;
  profession: string;
  location: string;
  slug: string;
  portraitImageUrl: string | null;
  headline: string;
  quote: string;
}

const testimonials = [
  {
    quote: "Exactly what therapists in Miami needed. Booking a professional room for sessions is finally simple and affordable.",
    name: "Licensed Therapist",
    location: "Coral Gables",
  },
  {
    quote: "I found the perfect studio for my coaching sessions. The space made my clients feel comfortable from the moment they walked in.",
    name: "Business Coach",
    location: "Brickell",
  },
  {
    quote: "As a photographer, having access to curated, beautiful spaces completely changed how I work with clients.",
    name: "Portrait Photographer",
    location: "Wynwood",
  },
];

export default function AlignSpacesPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: spaces, isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
  });

  const { data: featuredPros } = useQuery<FeaturedPro[]>({
    queryKey: ["/api/featured"],
  });

  useEffect(() => {
    document.title = "Align | Flexible Workspaces & Visual Branding for Professionals in Miami";
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

  const featuredSpaces = (spaces || []).slice(0, 3);

  return (
    <div className="bg-[#f5f0e8]" data-testid="section-split-hero">
      <div className="relative min-h-[100dvh] flex flex-col bg-stone-900">
        <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-5 sm:py-6" style={{ backgroundColor: "rgba(13,10,6,0.6)" }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
              data-menu-container
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                data-testid="button-split-menu"
                className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase font-semibold transition-colors duration-300 px-3 py-2 rounded-lg"
                style={{ color: "#d4c4a8" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f0e6d0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#d4c4a8"; }}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                Menu
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                  >
                    <button onClick={() => { setLocation("/portraits"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-split">
                      <Camera className="w-4 h-4" />
                      Align Portraits
                    </button>
                    <button onClick={() => { setLocation("/browse"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-split">
                      <Building2 className="w-4 h-4" />
                      Browse Spaces
                    </button>
                    <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-split">
                      <User className="w-4 h-4" />
                      Client Portal
                    </button>
                    <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-split">
                      <Star className="w-4 h-4" />
                      Featured Pros
                    </button>
                    <button onClick={() => { setLocation("/about"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-split">
                      <Info className="w-4 h-4" />
                      About Us
                    </button>
                    <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-split">
                      <Camera className="w-4 h-4" />
                      Our Work
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="fixed left-1/2 -translate-x-1/2 z-30"
              style={{ top: "14px" }}
            >
              <Link href="/" className="flex flex-col items-center gap-0.5" data-testid="link-home-logo">
                <img
                  src="/images/logo-align-cream.png"
                  alt="Align"
                  className="h-9 w-9 object-contain"
                />
                <span
                  className="uppercase"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "8px", letterSpacing: "4px", color: "#f0e6d0" }}
                >
                  Align
                </span>
              </Link>
            </motion.div>

            <UserIndicator variant="light" />
          </div>
        </nav>

        <h1 className="sr-only">Align — Professional Workspaces & Visual Branding in Miami</h1>
        <div className="flex-1 flex flex-col md:flex-row min-h-[100dvh] relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            role="link"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation("/portraits/builder"); } }}
            className="relative flex-1 min-h-[50dvh] md:min-h-[100dvh] flex items-end md:items-center overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/50 focus-visible:ring-inset"
            onClick={() => setLocation("/portraits/builder")}
            aria-label="Portraits — Begin Your Session"
            data-testid="panel-portraits"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
              style={{
                backgroundImage: "url(/images/hero-bg-bright.webp)",
                backgroundPosition: "43% 25%",
              }}
            />
            <div className="absolute inset-0" style={{ backgroundColor: "#1a1208", opacity: 0.65 }} />

            <div className="relative z-10 px-8 sm:px-10 md:px-12 lg:px-16 pb-20 md:pb-0 w-full max-w-lg md:text-left text-center md:mx-0 mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl leading-[1.1] tracking-tight"
                style={{ color: "#f0e6d0" }}
              >
                Your Presence Is
                <br />
                <span className="italic font-normal">Your First</span>
                <br />
                Impression
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-sm sm:text-base max-w-sm leading-relaxed mt-4 font-normal md:mx-0 mx-auto"
                style={{ color: "#d4c4a8" }}
              >
                Design a professional image that aligns your work, character, and the experience you want clients to feel.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="mt-7 flex flex-col sm:flex-row items-center md:items-start gap-3"
              >
                <Link
                  href="/portraits/builder"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  data-testid="button-begin-session"
                  className="inline-flex items-center gap-2 uppercase px-7 py-3 transition-all duration-300 border bg-transparent"
                  style={{ color: "#c9a96e", borderColor: "#c9a96e", fontFamily: "'Playfair Display', serif", fontSize: "11px", letterSpacing: "2px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  Begin Your Session
                </Link>
                <Link
                  href="/portfolio"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  data-testid="button-portfolio-portraits"
                  className="inline-flex items-center gap-2 uppercase px-7 py-3 transition-all duration-300 border border-transparent bg-transparent"
                  style={{ color: "#d4c4a8", fontFamily: "'Playfair Display', serif", fontSize: "11px", letterSpacing: "2px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#f0e6d0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#d4c4a8"; }}
                >
                  View Portfolio
                </Link>
              </motion.div>
            </div>

            <div className="md:hidden absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-5 h-5" style={{ color: "#c9a96e", opacity: 0.5 }} />
              </motion.div>
            </div>
          </motion.div>

          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 pointer-events-none" style={{ width: "2px", backgroundColor: "#c9a96e" }} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="hidden md:block absolute z-20 pointer-events-none"
            style={{ top: "18%", left: "50%", transform: "translateX(-50%)" }}
          >
            <span
              className="whitespace-nowrap uppercase"
              style={{ color: "#c9a96e", fontFamily: "'Playfair Display', serif", fontSize: "11px", letterSpacing: "4px" }}
            >
              Your Presence · Your Space
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            role="link"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation("/browse"); } }}
            className="relative flex-1 min-h-[50dvh] md:min-h-[100dvh] flex items-start md:items-center justify-end overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/50 focus-visible:ring-inset"
            onClick={() => setLocation("/browse")}
            aria-label="Spaces — Explore Workspaces"
            data-testid="panel-spaces"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
              style={{
                backgroundImage: "url(/images/spaces-hero.png)",
                backgroundPosition: "center 40%",
              }}
            />
            <div className="absolute inset-0" style={{ backgroundColor: "#1a1208", opacity: 0.65 }} />

            <div className="relative z-10 px-8 sm:px-10 md:px-12 lg:px-16 pt-20 md:pt-0 w-full max-w-lg md:text-right text-center md:ml-auto md:mx-0 mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl leading-[1.1] tracking-tight"
                style={{ color: "#f0e6d0" }}
              >
                Where Your Work
                <br />
                <span className="italic font-normal">and Space</span> Align
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="text-sm sm:text-base max-w-sm leading-relaxed mt-4 font-normal md:ml-auto md:mx-0 mx-auto"
                style={{ color: "#d4c4a8" }}
              >
                Discover and book professional workspaces across Miami — therapy offices, studios, meeting rooms, and more.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-7 flex flex-col sm:flex-row items-center md:justify-end gap-3"
              >
                <Link
                  href="/browse"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  data-testid="button-explore-spaces"
                  className="inline-flex items-center gap-2 uppercase px-7 py-3 transition-all duration-300 border bg-transparent"
                  style={{ color: "#c9a96e", borderColor: "#c9a96e", fontFamily: "'Playfair Display', serif", fontSize: "11px", letterSpacing: "2px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  Explore Spaces
                </Link>
                <Link
                  href="/featured"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  data-testid="button-featured-spaces"
                  className="inline-flex items-center gap-2 uppercase px-7 py-3 transition-all duration-300 border border-transparent bg-transparent"
                  style={{ color: "#d4c4a8", fontFamily: "'Playfair Display', serif", fontSize: "11px", letterSpacing: "2px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#f0e6d0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#d4c4a8"; }}
                >
                  Featured Professionals
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <div className="hidden md:flex absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="flex-1 px-12 py-5 flex justify-start">
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: "#c9a96e", opacity: 0.5 }}>Portraits</span>
            </div>
            <div className="flex-1 px-12 py-5 flex justify-end">
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: "#c9a96e", opacity: 0.5 }}>Spaces</span>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 sm:py-24 px-6" data-testid="section-how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">How Align Works</h2>
            <p className="text-stone-500 text-sm sm:text-base mt-3 max-w-md mx-auto">Book professional spaces in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: Search,
                step: "01",
                title: "Find Your Space",
                desc: "Browse therapy offices, studios, and meeting spaces across Miami — filtered by neighborhood, price, and profession.",
              },
              {
                icon: CalendarDays,
                step: "02",
                title: "Book Instantly",
                desc: "Choose the date and time that works for you — hourly, daily, or longer. Secure it with one click.",
              },
              {
                icon: Sparkles,
                step: "03",
                title: "Show Up Ready",
                desc: "Walk into a professional environment designed for your work. Everything you need is already there.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center" data-testid={`step-${item.step}`}>
                <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold">{item.step}</span>
                <h3 className="font-serif text-xl text-stone-900 mt-1 mb-2">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed max-w-[260px] mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(spacesLoading || featuredSpaces.length > 0) && (
        <section className="py-16 sm:py-24 px-6 bg-white/70" data-testid="section-featured-spaces">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10 sm:mb-12">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">Featured Spaces</h2>
                <p className="text-stone-500 text-sm sm:text-base mt-2">Professional environments ready for your next session</p>
              </div>
              <Link
                href="/browse"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors"
                data-testid="link-browse-all"
              >
                View all spaces
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {spacesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-[#faf6f1] border border-stone-100 animate-pulse">
                    <div className="aspect-[4/3] bg-stone-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-stone-200 rounded w-3/4" />
                      <div className="h-4 bg-stone-200 rounded w-1/2" />
                      <div className="h-4 bg-stone-200 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : featuredSpaces.map((space) => (
                <Link
                  key={space.id}
                  href={`/spaces/${space.slug}`}
                  className="group block rounded-xl overflow-hidden bg-[#faf6f1] border border-stone-100 hover:shadow-lg transition-all duration-300"
                  data-testid={`featured-space-${space.id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={space.imageUrls?.[0] || "/images/spaces-hero.png"}
                      alt={space.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">{space.name}</h3>
                    <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{space.neighborhood || space.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <DollarSign className="w-3.5 h-3.5 text-[#c4956a]" />
                        <span className="font-semibold text-sm">${space.pricePerHour}/hr</span>
                      </div>
                      {space.targetProfession && (
                        <span className="text-xs text-[#c4956a] font-medium">Ideal for {space.targetProfession}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>


            <div className="sm:hidden text-center mt-8">
              <Link
                href="/browse"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c4956a] hover:text-[#b3845d] transition-colors"
                data-testid="link-browse-all-mobile"
              >
                View all spaces
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {(featuredPros || []).length > 0 && (
        <section className="py-16 sm:py-24 px-6" data-testid="section-featured-pros">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10 sm:mb-12">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">Featured Professionals</h2>
                <p className="text-stone-500 text-sm sm:text-base mt-2">Meet the Miami professionals who trust Align</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featuredPros || []).slice(0, 3).map((pro) => (
                <Link
                  key={pro.id}
                  href={`/featured/${pro.slug}`}
                  className="group block rounded-xl overflow-hidden bg-white border border-stone-100 hover:shadow-lg transition-all duration-300"
                  data-testid={`featured-pro-${pro.id}`}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-stone-100">
                    {pro.portraitImageUrl ? (
                      <img
                        src={pro.portraitImageUrl}
                        alt={pro.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-serif text-lg font-semibold text-stone-900 mb-0.5">{pro.name}</h3>
                    <p className="text-sm text-[#c4956a] font-medium mb-2">{pro.profession}</p>
                    <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">{pro.headline}</p>
                    <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-3">
                      <MapPin className="w-3 h-3" />
                      <span>{pro.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="sm:hidden text-center mt-8">
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
        </section>
      )}

      <section className="py-16 sm:py-24 px-6" data-testid="section-testimonials">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">Trusted by Miami Professionals</h2>
            <p className="text-stone-500 text-sm sm:text-base mt-3 max-w-md mx-auto">Join therapists, coaches, and creators who use Align every day</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 sm:p-7 border border-stone-100 shadow-sm"
                data-testid={`testimonial-${i}`}
              >
                <Quote className="w-6 h-6 text-[#c4956a]/40 mb-4" />
                <p className="text-stone-600 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-700">{t.name}</p>
                    <p className="text-[10px] text-stone-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-6 bg-stone-900" data-testid="section-cta-bottom">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight leading-tight">
            Ready to find <span className="italic font-normal">your</span> space?
          </h2>
          <p className="text-white/70 text-sm sm:text-base mt-4 max-w-md mx-auto leading-relaxed">
            Whether you need a space for your practice or a portrait that makes the right impression — Align has you covered.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/browse"
              data-testid="button-cta-spaces"
              className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-white text-black px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 font-medium"
            >
              Explore Spaces
            </Link>
            <Link
              href="/portraits/builder"
              data-testid="button-cta-portraits"
              className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-white px-6 py-2.5 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/10 transition-all duration-300"
            >
              Design Your Photoshoot
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter variant="light" />
    </div>
  );
}
