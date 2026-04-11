import { useState, useEffect } from "react";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import { setPageMeta } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Clock,
  Palette,
  Image,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Building2,
  Star,
  Info,
  Images,
  User,
  HelpCircle,
  Compass,
  Eye,
  Shirt,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { UserIndicator } from "@/components/user-indicator";
import { SiteFooter } from "@/components/site-footer";
import type { ColorSwatch } from "@shared/schema";

interface PortfolioPhoto {
  id: string;
  imageUrl: string;
  category: string;
  cropPosition: { x: number; y: number; zoom: number } | null;
  environments: string[];
  brandMessages: string[];
  emotionalImpacts: string[];
  colorPalette: ColorSwatch[];
  subjectName: string | null;
  subjectProfession: string | null;
}


function PhotoCard({ photo }: { photo: PortfolioPhoto }) {
  const crop = photo.cropPosition || { x: 50, y: 50, zoom: 1 };
  const palette = (photo.colorPalette || []).slice(0, 3);
  const env = photo.environments?.[0];
  const brand = photo.brandMessages?.[0];

  return (
    <div className="group relative rounded-xl overflow-hidden bg-white border border-stone-100">
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={photo.imageUrl}
          alt={photo.subjectName ? `${photo.subjectName}, ${photo.subjectProfession || "Professional"}` : "Professional portrait"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ objectPosition: `${crop.x}% ${crop.y}%` }}
        />
      </div>
      {(palette.length > 0 || env || brand) && (
        <div className="px-3.5 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {(env || brand) && (
              <p className="text-[10px] text-stone-400 uppercase tracking-wide truncate">
                {[env, brand].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {palette.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {palette.map((swatch, i) => (
                <div
                  key={i}
                  className="w-4.5 h-4.5 rounded-full border border-stone-200"
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.keyword}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortraitLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const photosCarousel = useDragScroll();

  const { data: portfolioPhotos = [] } = useQuery<PortfolioPhoto[]>({
    queryKey: ["/api/portfolio-photos"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio-photos");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const portraitPhotos = portfolioPhotos.filter(p => p.category !== "spaces").slice(0, 6);

  useEffect(() => {
    setPageMeta({
      title: "Professional Portraits for Therapists & Coaches in Miami | Align",
      description: "Professional headshots and branding photography designed for therapists, coaches, and wellness professionals in Miami. Book your session today.",
      url: "https://alignworkspaces.com/portraits",
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 z-10">
            <UserIndicator />
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                setLocation(params.get("from") === "portal" ? "/portal?tab=overview" : "/");
              }}
              className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">
            Portraits
          </span>

          <div className="flex items-center gap-3 z-10">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-stone-100/60"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span className="hidden sm:inline">Menu</span>
              </button>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[200px] z-[9999]"
                >
                  {/* Services */}
                  <button onClick={() => { setLocation("/"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <Building2 className="w-4 h-4" /> Align Workspaces
                  </button>
                  <button onClick={() => { setLocation("/workspaces"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <Building2 className="w-4 h-4" /> Workspaces
                  </button>
                  {/* Photography */}
                  <div className="border-t border-stone-100 my-1" />
                  <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <Images className="w-4 h-4" /> Portfolio
                  </button>
                  {/* Community */}
                  <div className="border-t border-stone-100 my-1" />
                  <button onClick={() => { setLocation("/#events"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <CalendarDays className="w-4 h-4" /> Community Events
                  </button>
                  <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <Star className="w-4 h-4" /> Featured Pros
                  </button>
                  {/* About & Account */}
                  <div className="border-t border-stone-100 my-1" />
                  <button onClick={() => { setLocation("/our-vision"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <Compass className="w-4 h-4" /> Our Vision
                  </button>
                  <button onClick={() => { setLocation("/support"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <HelpCircle className="w-4 h-4" /> Support
                  </button>
                  <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                    <User className="w-4 h-4" /> Client Portal
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero — repositioned: pain-first, outcome-oriented */}
      <section className="pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-4">Your Image Is Your First Session</p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2a2a2a] leading-tight mb-5">
              Design the First Impression<br className="hidden sm:block" /> Your Clients Deserve
            </h1>
            <p className="text-stone-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
              You've invested in your credentials, your space, your practice. Your image should match. Tell us your setting and your energy, we'll design the rest. In about two minutes.
            </p>
            <Link
              href="/portraits"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Build Your Shoot Concept
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="h-px bg-stone-200/80" />
      </div>

      {/* Portfolio — now shows design context per photo */}
      {portraitPhotos.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-14 px-5 sm:px-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-3">Portfolio</p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]">
                Every Portrait Was Designed, Not Just Shot
              </h2>
              <p className="text-stone-400 text-sm mt-3 max-w-lg mx-auto">
                Each session starts with the builder, setting, energy, palette. The photo is the last step, not the first.
              </p>
            </div>
            {/* Mobile: carousel with drag scroll */}
            <div className="sm:hidden">
              <div
                ref={photosCarousel.ref}
                onDragStart={photosCarousel.onDragStart}
                onMouseDown={photosCarousel.onMouseDown}
                onMouseMove={photosCarousel.onMouseMove}
                onMouseUp={photosCarousel.onMouseUp}
                onMouseLeave={photosCarousel.onMouseLeave}
                onClickCapture={photosCarousel.preventClickIfDragged}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-5 pb-4 scrollbar-none cursor-grab select-none [&_img]:pointer-events-none [&_img]:select-none" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } as any}
              >
                {portraitPhotos.map((photo) => (
                  <div key={photo.id} className="snap-start flex-shrink-0 w-[70%]">
                    <PhotoCard photo={photo} />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: grid */}
            <div className="hidden sm:grid grid-cols-3 gap-4 px-5 sm:px-8">
              {portraitPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
            <div className="text-center mt-8 px-5 sm:px-8">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#c4956a] hover:text-[#a07a52] transition-colors"
              >
                <Images className="w-4 h-4" />
                View full portfolio
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="h-px bg-stone-200/80" />
      </div>

      {/* What You Get — reframed as value themes, not deliverables */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-3">What You Get</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]">
              A Visual Identity, Not Just Photos
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: Eye, title: "Your Direction, Designed", desc: "Creative direction built from your setting, energy, and the feeling you want clients to have" },
              { icon: Shirt, title: "Show Up Prepared", desc: "Wardrobe guidance and a color palette so nothing is left to chance" },
              { icon: Clock, title: "1-Hour Focused Session", desc: "Every minute tailored to the concept you built, no filler, no guesswork" },
              { icon: Image, title: "15+ Edited Photos", desc: "High-resolution portraits that match the identity you designed" },
              { icon: CheckCircle2, title: "Private Online Gallery", desc: "View, download, and share your images from one place" },
              { icon: RefreshCw, title: "Evolve Over Time", desc: "2 yearly edit tokens to refresh your images as your practice grows" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-stone-100 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-4.5 h-4.5 text-[#c4956a]" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2a2a2a] mb-1">{item.title}</h3>
                  <p className="text-stone-400 text-[12px] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="h-px bg-stone-200/80" />
      </div>

      {/* Bottom CTA — repositioned */}
      <section className="py-14 sm:py-20">
        <div className="max-w-xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#3d3d3d] font-serif text-lg sm:text-xl leading-[1.7] mb-3">
              Most professionals guess at how they come across. This replaces the guessing.
            </p>
            <p className="text-stone-400 text-sm leading-relaxed mb-10 max-w-md mx-auto">
              Tell us your setting, your energy, and what you want clients to feel. We'll design a shoot concept with creative direction, wardrobe guidance, and a color palette, ready to book on the spot.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/portraits"
                className="inline-flex items-center gap-2 bg-stone-900 text-white px-7 py-3 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Build Your Shoot Concept
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#c4956a] hover:text-[#a07a52] transition-colors"
              >
                <Images className="w-4 h-4" />
                See our work
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
