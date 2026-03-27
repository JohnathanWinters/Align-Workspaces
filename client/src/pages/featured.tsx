import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useSmartBack } from "@/hooks/use-smart-back";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Share2, Star, Users, Camera, ChevronRight, X, Menu, MapPin, Globe, Heart, Loader2, CheckCircle2, Sparkles, Mail, Images, Building2, Info, HelpCircle, User } from "lucide-react";
import { SiLinkedin, SiFacebook, SiX, SiInstagram, SiTiktok, SiYoutube, SiPinterest, SiSnapchat, SiThreads, SiWhatsapp, SiTelegram, SiSpotify, SiReddit, SiBehance, SiDribbble, SiMedium, SiYelp, SiGithub, SiVimeo, SiTumblr } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { UserIndicator } from "@/components/user-indicator";
import { trackEvent } from "@/hooks/use-analytics";

interface FeaturedProfessional {
  id: string;
  name: string;
  profession: string;
  location: string;
  category: string;
  slug: string;
  portraitImageUrl: string | null;
  portraitCropPosition: { x: number; y: number; zoom?: number } | null;
  heroCropPosition: { x: number; y: number; zoom?: number } | null;
  headline: string;
  quote: string;
  storySections: {
    narrativeHook?: string;
    qaSections?: Array<{ question: string; answer: string }>;
    whyStarted?: string;
    whatTheyLove?: string;
    misunderstanding?: string;
  };
  socialLinks: Array<{ platform: string; url: string }> | null;
  credentials: string[] | null;
  yearsInPractice: number | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  spaceImageUrl: string | null;
  spaceImageCropPosition: { x: number; y: number; zoom?: number } | null;
  spaceName: string | null;
  spaceQuote: string | null;
  isFeaturedOfWeek: number;
  isSample: number;
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

const SOCIAL_ICON_MAP: Record<string, any> = {
  website: Globe,
  linkedin: SiLinkedin,
  facebook: SiFacebook,
  x: SiX,
  twitter: SiX,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  pinterest: SiPinterest,
  snapchat: SiSnapchat,
  threads: SiThreads,
  whatsapp: SiWhatsapp,
  telegram: SiTelegram,
  spotify: SiSpotify,
  reddit: SiReddit,
  behance: SiBehance,
  dribbble: SiDribbble,
  medium: SiMedium,
  yelp: SiYelp,
  github: SiGithub,
  vimeo: SiVimeo,
  tumblr: SiTumblr,
};

function normalizeSocialLinks(links: any): Array<{ platform: string; url: string }> {
  if (Array.isArray(links)) return links;
  if (links && typeof links === "object") {
    return Object.entries(links)
      .filter(([, url]) => typeof url === "string" && url)
      .map(([platform, url]) => ({ platform, url: url as string }));
  }
  return [];
}

function getCropStyle(crop: { x: number; y: number; zoom?: number } | null | undefined, fallbackPosition?: string): React.CSSProperties | undefined {
  if (!crop && !fallbackPosition) return undefined;
  const pos = crop ? `${crop.x}% ${crop.y}%` : fallbackPosition!;
  if (crop?.zoom && crop.zoom !== 1) {
    return { objectPosition: pos, transform: `scale(${crop.zoom})`, transformOrigin: pos };
  }
  return { objectPosition: pos };
}

// Kept for backward compat but returns undefined — zoom now lives on the img via getCropStyle
function getCropZoom(_crop: { x: number; y: number; zoom?: number } | null | undefined): undefined {
  return undefined;
}

// For pip thumbnails: uses negative inset technique for sharp zoom without transform conflicts
function getPipStyle(crop: { x: number; y: number; zoom?: number } | null | undefined, fallback?: string): { containerStyle?: React.CSSProperties; imgStyle: React.CSSProperties } {
  const x = crop?.x ?? 50;
  const y = crop?.y ?? 50;
  const zoom = crop?.zoom ?? 1;
  const insetPct = zoom > 1 ? ((1 - 1 / zoom) / 2) * 100 : 0;
  return {
    containerStyle: { position: "relative" as const, overflow: "hidden" as const },
    imgStyle: {
      position: "absolute" as const,
      objectFit: "cover" as const,
      objectPosition: `${x}% ${y}%`,
      top: `-${insetPct}%`,
      left: `-${insetPct}%`,
      width: `${100 + insetPct * 2}%`,
      height: `${100 + insetPct * 2}%`,
    },
  };
}

const CATEGORY_ORDER = ["Therapists", "Counselors", "Chefs", "Personal Trainers"];

function FeaturedNav({ backTo = "/featured" }: { backTo?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const smartBack = useSmartBack(backTo);
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-stone-200/60">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between relative">
          <button onClick={smartBack} className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10" data-testid="link-back-featured">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">Featured Pros</span>
          <div className="flex items-center gap-3">
            <UserIndicator />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="button-featured-menu-toggle"
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
                    className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[200px] z-[9999]"
                  >
                    <Link href="/portal">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <User className="w-4 h-4" />
                        Client Portal
                      </button>
                    </Link>
                    <Link href="/">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <Building2 className="w-4 h-4" />
                        Align Workspaces
                      </button>
                    </Link>
                    <Link href="/workspaces">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <Building2 className="w-4 h-4" />
                        Workspaces
                      </button>
                    </Link>
                    <Link href="/portrait-builder">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <Camera className="w-4 h-4" />
                        Portrait Builder
                      </button>
                    </Link>
                    <Link href="/portfolio">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <Images className="w-4 h-4" />
                        Our Work
                      </button>
                    </Link>
                    <Link href="/our-vision">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <Info className="w-4 h-4" />
                        Our Vision
                      </button>
                    </Link>
                    <Link href="/support">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <HelpCircle className="w-4 h-4" />
                        Support
                      </button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Initials({ name, className = "" }: { name: string; className?: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400 ${className}`}>
      <span className="text-5xl sm:text-6xl font-serif text-white/80 select-none">{initials}</span>
    </div>
  );
}

function HeroFeature({ pro }: { pro: FeaturedProfessional }) {
  const [, setLocation] = useLocation();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [spaceLoaded, setSpaceLoaded] = useState(false);
  const hasSpace = pro.spaceImageUrl;

  return (
    <section
      className="cursor-pointer group max-w-[2000px] mx-auto"
      onClick={() => { trackEvent("featured_professional_click", { slug: pro.slug, name: pro.name }); setLocation(`/featured/${pro.slug}`); }}
      data-testid="card-professional-of-week"
    >
      <div className="relative w-full overflow-hidden 2xl:rounded-b-lg">
        {hasSpace ? (
          /* Workspace full-width with portrait pip */
          <div className="relative aspect-[4/3] sm:aspect-[21/9]">
            {!spaceLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
            )}
            <div className="w-full h-full" style={getCropZoom(pro.spaceImageCropPosition)}>
              <img src={pro.spaceImageUrl!} alt={pro.spaceName || "Their workspace"}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${spaceLoaded ? "opacity-100" : "opacity-0"}`}
                fetchPriority="high" decoding="sync" onLoad={() => setSpaceLoaded(true)}
                style={getCropStyle(pro.spaceImageCropPosition)}
              />
            </div>
            {/* Portrait pip — percentage based */}
            <div className="absolute bottom-[4%] left-[3%] w-[22%] h-[55%] rounded-lg ring-2 ring-white shadow-lg z-10" style={getPipStyle(pro.heroCropPosition || pro.portraitCropPosition).containerStyle}>
              {pro.portraitImageUrl ? (
                <img src={pro.portraitImageUrl} alt={pro.name}
                  className={`${heroLoaded ? "opacity-100" : "opacity-0"}`}
                  fetchPriority="high" decoding="sync" onLoad={() => setHeroLoaded(true)}
                  style={getPipStyle(pro.heroCropPosition || pro.portraitCropPosition).imgStyle}
                />
              ) : <Initials name={pro.name} />}
            </div>
            {pro.spaceName && (
              <div className="absolute bottom-[4%] right-[3%] bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
                <Building2 className="w-3 h-3" />
                {pro.spaceName}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
          </div>
        ) : (
          /* Portrait-only fallback */
          <div className="relative aspect-[4/3] sm:aspect-[21/9] overflow-hidden">
            <div className="absolute inset-0">
              {!heroLoaded && pro.portraitImageUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
              )}
              <div className="w-full h-full" style={getCropZoom(pro.heroCropPosition || pro.portraitCropPosition)}>
                {pro.portraitImageUrl ? (
                  <img src={pro.portraitImageUrl} alt={`${pro.name} - ${pro.profession}`}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${heroLoaded ? "opacity-100" : "opacity-0"}`}
                    fetchPriority="high" decoding="sync" onLoad={() => setHeroLoaded(true)}
                    style={getCropStyle(pro.heroCropPosition || pro.portraitCropPosition)}
                  />
                ) : <Initials name={pro.name} />}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 pt-6 pb-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] mb-3 flex items-center gap-1.5 font-semibold">
            <Star className="w-3 h-3 fill-[#c4956a] text-[#c4956a]" />
            Featured Story
          </p>
          <h2 className="font-serif text-[2rem] sm:text-4xl md:text-5xl text-foreground leading-[1.1] mb-2" data-testid="text-potw-name">
            {pro.name}
          </h2>
          <p className="text-foreground/45 text-sm sm:text-base mb-3">
            {pro.profession} · {pro.location}
          </p>
          <p className="text-foreground/60 text-sm sm:text-base max-w-xl leading-relaxed mb-5 italic">
            "{pro.headline}"
          </p>
          <span className="inline-flex items-center gap-2 text-xs text-[#c4956a] group-hover:text-[#b8895e] group-hover:gap-3 transition-all duration-300 uppercase tracking-[0.2em] font-semibold">
            Read Their Story <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function EditorialCard({ pro, index }: { pro: FeaturedProfessional; index: number }) {
  const [, setLocation] = useLocation();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [spaceImgLoaded, setSpaceImgLoaded] = useState(false);
  const cappedDelay = Math.min(index * 0.04, 0.15);
  const hasSpace = pro.spaceImageUrl;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: cappedDelay }}
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
      onClick={() => { trackEvent("featured_professional_click", { slug: pro.slug, name: pro.name }); setLocation(`/featured/${pro.slug}`); }}
      data-testid={`card-featured-${pro.slug}`}
    >
      <div className={`relative overflow-hidden rounded-md mb-4 shadow-md group-hover:shadow-xl transition-shadow duration-300 ${hasSpace ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
        {hasSpace ? (
          /* Workspace full-width with portrait pip */
          <div className="w-full h-full relative">
            {!spaceImgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200" />
            )}
            <div className="w-full h-full" style={getCropZoom(pro.spaceImageCropPosition)}>
              <img
                src={pro.spaceImageUrl!}
                alt={pro.spaceName || "Their workspace"}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${spaceImgLoaded ? "opacity-100" : "opacity-0"}`}
                loading={index < 6 ? "eager" : "lazy"}
                onLoad={() => setSpaceImgLoaded(true)}
                style={getCropStyle(pro.spaceImageCropPosition)}
              />
            </div>
            {/* Portrait pip — percentage based */}
            <div className="absolute bottom-[4%] left-[3%] w-[28%] h-[55%] rounded-lg ring-2 ring-white shadow-lg z-10" style={getPipStyle(pro.portraitCropPosition).containerStyle}>
              {pro.portraitImageUrl ? (
                <img src={pro.portraitImageUrl} alt={pro.name}
                  className={`${imgLoaded ? "opacity-100" : "opacity-0"}`}
                  loading={index < 6 ? "eager" : "lazy"}
                  onLoad={() => setImgLoaded(true)}
                  style={getPipStyle(pro.portraitCropPosition).imgStyle}
                />
              ) : <Initials name={pro.name} />}
            </div>
            {pro.spaceName && (
              <div className="absolute bottom-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 z-10">
                <Building2 className="w-2.5 h-2.5" />
                {pro.spaceName}
              </div>
            )}
          </div>
        ) : (
          /* Portrait-only fallback */
          <div className="w-full h-full" style={getCropZoom(pro.portraitCropPosition)}>
            {!imgLoaded && pro.portraitImageUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200" />
            )}
            {pro.portraitImageUrl ? (
              <img
                src={pro.portraitImageUrl}
                alt={`${pro.name} - ${pro.profession}`}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                loading={index < 6 ? "eager" : "lazy"}
                onLoad={() => setImgLoaded(true)}
                style={getCropStyle(pro.portraitCropPosition)}
              />
            ) : (
              <Initials name={pro.name} />
            )}
          </div>
        )}
        {pro.isSample ? (
          <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm z-10">
            Sample
          </div>
        ) : null}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{pro.profession}</p>
          {pro.credentials && pro.credentials.length > 0 && (
            <span className="text-[10px] text-[#c4956a] font-medium">{pro.credentials[0]}</span>
          )}
        </div>
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground leading-tight mb-1 group-hover:text-[#c4956a] transition-colors duration-300" data-testid={`text-name-${pro.slug}`}>
          {pro.name}
        </h3>
        <div className="flex items-center gap-1 text-[12px] text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />
          <span>{pro.location}</span>
          {pro.yearsInPractice && <span className="ml-1">· {pro.yearsInPractice} yrs</span>}
        </div>
        <p className="text-sm text-foreground/60 leading-relaxed line-clamp-2 italic relative">
          "{pro.headline}"
          <span className="absolute bottom-0 right-0 w-16 h-5 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </p>
      </div>
    </motion.article>
  );
}

function CategoryFilter({ categories, active, onChange }: { categories: string[]; active: string | null; onChange: (cat: string | null) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide" data-testid="category-filter-bar">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
          !active
            ? "border-foreground text-foreground font-medium"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
        data-testid="filter-all"
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat === active ? null : cat)}
          className={`px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
            active === cat
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function NominationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ nomineeName: "", nomineeProfession: "", reason: "", nomineeContact: "", nominatorName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedName, setSavedName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomineeName.trim() || !form.nomineeProfession.trim() || !form.reason.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomineeName: form.nomineeName.trim(),
          nomineeProfession: form.nomineeProfession.trim(),
          reason: form.reason.trim(),
          nomineeContact: form.nomineeContact.trim() || null,
          nominatorName: form.nominatorName.trim() || null,
        }),
      });
      setSavedName(form.nomineeName.trim());
      setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setForm({ nomineeName: "", nomineeProfession: "", reason: "", nomineeContact: "", nominatorName: "" });
      setSubmitted(false);
      setSavedName("");
    }, 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
          data-testid="button-close-nomination"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {submitted ? (
          <div className="px-8 py-16 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-5" />
            <h3 className="font-serif text-2xl font-semibold mb-3">Thanks!</h3>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
              We'll reach out to {savedName} soon. Maybe their story will be featured next!
            </p>
            <Button onClick={handleClose} className="mt-8 rounded-full px-8" data-testid="button-nomination-done">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-8">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">Nominate Someone Inspiring</h2>
              <p className="text-muted-foreground text-sm">Help us tell the stories of the people who make our community extraordinary.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominee's Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Maria Gonzalez"
                  value={form.nomineeName}
                  onChange={e => setForm(f => ({ ...f, nomineeName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition-all"
                  required
                  data-testid="input-nominee-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominee's Profession <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Pastry Chef, Therapist, Lawyer"
                  value={form.nomineeProfession}
                  onChange={e => setForm(f => ({ ...f, nomineeProfession: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition-all"
                  required
                  data-testid="input-nominee-profession"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Why They Inspire You <span className="text-red-400">*</span></label>
                <textarea
                  placeholder="Share a brief story or moment that makes them stand out"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={4}
                  maxLength={1200}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition-all resize-none"
                  required
                  data-testid="input-nominee-reason"
                />
                <p className="text-[11px] text-stone-400 mt-1 text-right">
                  {form.reason.trim().split(/\s+/).filter(Boolean).length > 0 ? form.reason.trim().split(/\s+/).filter(Boolean).length : 0} words · 150–200 words max
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g., Alex Rivera"
                  value={form.nominatorName}
                  onChange={e => setForm(f => ({ ...f, nominatorName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition-all"
                  data-testid="input-nominator-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominee Contact Info <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g., maria@email.com, LinkedIn.com/in/maria"
                  value={form.nomineeContact}
                  onChange={e => setForm(f => ({ ...f, nomineeContact: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition-all"
                  data-testid="input-nominee-contact"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !form.nomineeName.trim() || !form.nomineeProfession.trim() || !form.reason.trim()}
              className="w-full mt-8 rounded-full bg-stone-900 hover:bg-stone-800 text-white py-3"
              data-testid="button-submit-nomination"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
              Share Their Story
            </Button>
            <p className="text-[11px] text-stone-400 text-center mt-4 italic">
              Brought to you by Portrait Builder, telling the stories behind your work.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function ShareYourStoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", profession: "", location: "", email: "", story: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.profession.trim() || !form.story.trim() || !form.email.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomineeName: form.name.trim(),
          nomineeProfession: form.profession.trim(),
          reason: `[SELF-SUBMISSION] ${form.story.trim()}`,
          nomineeContact: form.email.trim(),
          nominatorName: `${form.name.trim()} (self)`,
        }),
      });
      setSubmitted(true);
    } catch {}
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setForm({ name: "", profession: "", location: "", email: "", story: "" });
      setSubmitted(false);
    }, 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600" data-testid="button-close-share-story">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-serif text-2xl mb-2">Thank you for sharing</h3>
            <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
              We'll review your story and reach out if we'd love to feature you. If selected, we'll schedule a complimentary portrait session to bring your story to life.
            </p>
            <Button onClick={handleClose} className="mt-6 rounded-full px-8" variant="outline" data-testid="button-share-story-done">
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Share Your Story</p>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl mb-3">We want to feature you</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Tell us who you are, what you do, and why you love it. If we love your story, we'll schedule a portrait session to bring it to life.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Name <span className="text-red-400">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="e.g., Maria Gonzalez"
                    data-testid="input-share-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Profession <span className="text-red-400">*</span></label>
                  <input
                    value={form.profession}
                    onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="e.g., Pastry Chef, Therapist"
                    data-testid="input-share-profession"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="e.g., Miami, Florida"
                    data-testid="input-share-location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="you@email.com"
                    data-testid="input-share-email"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Story <span className="text-red-400">*</span></label>
                <textarea
                  value={form.story}
                  onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                  rows={5}
                  maxLength={1200}
                  className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                  placeholder="What drives you? What do you love about your work? What's something people don't know about your profession?"
                  data-testid="input-share-story"
                />
                <p className="text-[11px] text-stone-400 mt-1 text-right">
                  {form.story.trim().split(/\s+/).filter(Boolean).length > 0 ? form.story.trim().split(/\s+/).filter(Boolean).length : 0} words · 150–200 words max
                </p>
              </div>
              <Button
                type="submit"
                disabled={submitting || !form.name.trim() || !form.profession.trim() || !form.story.trim() || !form.email.trim()}
                className="w-full mt-4 rounded-full bg-stone-900 hover:bg-stone-800 text-white py-3"
                data-testid="button-submit-share-story"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Share Your Story
              </Button>
              <p className="text-[11px] text-stone-400 text-center mt-3 italic">
                Brought to you by Portrait Builder, telling the stories behind your work.
              </p>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

function FeaturedListingPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [nominationOpen, setNominationOpen] = useState(false);
  const [shareStoryOpen, setShareStoryOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "already">("idle");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: professionals = [], isLoading } = useQuery<FeaturedProfessional[]>({
    queryKey: ["/api/featured"],
    queryFn: async () => {
      const res = await fetch(`/api/featured`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: weeklyPro } = useQuery<FeaturedProfessional | null>({
    queryKey: ["/api/featured/professional-of-the-week"],
    staleTime: 5 * 60 * 1000,
  });

  const availableCategories = CATEGORY_ORDER.filter(cat =>
    professionals.some(p => p.category === cat)
  );
  const extraCategories = [...new Set(professionals.map(p => p.category))]
    .filter(cat => !CATEGORY_ORDER.includes(cat))
    .sort();
  const allCategories = [...availableCategories, ...extraCategories];

  const filtered = activeCategory
    ? professionals.filter(p => p.category === activeCategory)
    : professionals;

  const nonFeaturedPros = weeklyPro
    ? filtered.filter(p => p.id !== weeklyPro.id)
    : filtered;

  useEffect(() => {
    document.title = "Featured Professionals | Align";
  }, []);

  useEffect(() => {
    if (weeklyPro?.portraitImageUrl) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = weeklyPro.portraitImageUrl;
      link.fetchPriority = "high";
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [weeklyPro?.portraitImageUrl]);

  useEffect(() => {
    const topPros = professionals.slice(0, 3);
    const links: HTMLLinkElement[] = [];
    topPros.forEach(p => {
      if (p.portraitImageUrl && p.id !== weeklyPro?.id) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = p.portraitImageUrl;
        document.head.appendChild(link);
        links.push(link);
      }
    });
    return () => { links.forEach(l => l.remove()); };
  }, [professionals, weeklyPro?.id]);

  return (
    <div className="min-h-screen bg-background">
      <FeaturedNav backTo="/" />

      {weeklyPro && !activeCategory && <HeroFeature pro={weeklyPro} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <section className={`${weeklyPro && !activeCategory ? "pt-16 sm:pt-20" : "pt-16 sm:pt-24"} pb-8 sm:pb-12`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={weeklyPro && !activeCategory ? "" : "text-center mb-4"}
          >
            {(!weeklyPro || activeCategory) && (
              <>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold mb-4" data-testid="text-featured-heading">
                  Featured Professionals
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                  The stories behind Miami's most passionate professionals, and the portraits that tell them.
                </p>
              </>
            )}
            {weeklyPro && !activeCategory && (
              <>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Meet the Community</p>
                <div className="w-12 h-px bg-foreground/20 mb-8" />
              </>
            )}
          </motion.div>

          {allCategories.length > 1 && (
            <div className="border-b border-border mb-10">
              <CategoryFilter categories={allCategories} active={activeCategory} onChange={setActiveCategory} />
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="aspect-[3/4] bg-gradient-to-br from-stone-100 to-stone-200 rounded-md mb-4" />
                  <div className="h-3 bg-stone-100 rounded w-20 mb-2" />
                  <div className="h-6 bg-stone-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-stone-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : nonFeaturedPros.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-serif text-xl mb-2">No stories yet</h3>
              <p className="text-muted-foreground text-sm">Check back soon for new featured professionals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {nonFeaturedPros.map((pro, idx) => (
                <EditorialCard key={pro.id} pro={pro} index={idx} />
              ))}
            </div>
          )}
        </section>

        <section className="py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-lg bg-stone-900 text-white px-6 sm:px-12 py-14 sm:py-20 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
            </div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6">Your story matters</p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 leading-tight" data-testid="text-get-featured-heading">
                Know Someone Inspiring?
              </h2>
              <p className="text-white/50 max-w-lg mx-auto mb-10 leading-relaxed text-sm sm:text-base">
                Every great community is built on the people in it. Help us tell their story.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-[#c4956a] hover:bg-[#b8895e] text-white rounded-full px-8 shadow-lg shadow-amber-900/20"
                  onClick={() => setNominationOpen(true)}
                  data-testid="button-nominate-someone"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Nominate Someone for a Story & Portrait Feature
                </Button>
              </div>

              <div className="mt-6">
                {newsletterStatus === "success" ? (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm" data-testid="text-newsletter-success">
                    <CheckCircle2 className="w-4 h-4" />
                    You're in! We'll let you know when new stories drop.
                  </div>
                ) : newsletterStatus === "already" ? (
                  <div className="flex items-center justify-center gap-2 text-amber-400 text-sm" data-testid="text-newsletter-already">
                    <Mail className="w-4 h-4" />
                    You're already subscribed, stay tuned!
                  </div>
                ) : newsletterStatus === "idle" && !newsletterSubmitting && newsletterEmail === "" && newsletterName === "" ? (
                  <button
                    onClick={() => setNewsletterStatus("form" as any)}
                    className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
                    data-testid="button-open-newsletter"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Stay updated with new stories <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newsletterEmail.trim()) return;
                      setNewsletterSubmitting(true);
                      try {
                        const res = await fetch("/api/newsletter/subscribe", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: newsletterEmail.trim(), firstName: newsletterName.trim() || null }),
                        });
                        const data = await res.json();
                        setNewsletterStatus(data.alreadySubscribed ? "already" : "success");
                      } catch {}
                      setNewsletterSubmitting(false);
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto"
                    data-testid="form-newsletter"
                  >
                    <input
                      type="text"
                      value={newsletterName}
                      onChange={e => setNewsletterName(e.target.value)}
                      placeholder="First name"
                      className="w-full sm:w-36 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      data-testid="input-newsletter-name"
                    />
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={e => setNewsletterEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full sm:flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      data-testid="input-newsletter-email"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      disabled={newsletterSubmitting || !newsletterEmail.trim()}
                      size="sm"
                      className="rounded-full px-6 bg-white/20 hover:bg-white/30 text-white border border-white/20"
                      data-testid="button-newsletter-subscribe"
                    >
                      {newsletterSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-3.5 h-3.5 mr-1.5" /> Subscribe</>}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <NominationModal open={nominationOpen} onClose={() => setNominationOpen(false)} />
      <ShareYourStoryModal open={shareStoryOpen} onClose={() => setShareStoryOpen(false)} />
    </div>
  );
}

function ProfilePage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const storyRef = useRef<HTMLDivElement>(null);
  const [nominationOpen, setNominationOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "already">("idle");

  const { data: pro, isLoading, error } = useQuery<FeaturedProfessional>({
    queryKey: ["/api/featured", slug],
    queryFn: async () => {
      const res = await fetch(`/api/featured/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allProfessionals = [] } = useQuery<FeaturedProfessional[]>({
    queryKey: ["/api/featured"],
    queryFn: async () => {
      const res = await fetch(`/api/featured`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (pro?.portraitImageUrl) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = pro.portraitImageUrl;
      link.fetchPriority = "high";
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [pro?.portraitImageUrl]);

  useEffect(() => {
    if (pro) {
      document.title = pro.seoTitle || `${pro.name} - ${pro.profession} | Align`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", pro.metaDescription || pro.headline);
      else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = pro.metaDescription || pro.headline;
        document.head.appendChild(meta);
      }
    }
    window.scrollTo(0, 0);
  }, [pro]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = pro ? `Meet ${pro.name}, ${pro.profession}, ${pro.headline}` : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FeaturedNav />
        <div className="animate-pulse">
          <div className="w-full h-[60vh] bg-muted" />
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-4">
            <div className="h-10 bg-muted rounded w-2/3" />
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-px bg-muted my-8" />
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pro || error) {
    return (
      <div className="min-h-screen bg-background">
        <FeaturedNav />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl mb-4">Professional Not Found</h1>
          <p className="text-muted-foreground mb-6">This profile may have been removed or doesn't exist.</p>
          <Link href="/featured">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Featured
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedPros = allProfessionals
    .filter(p => p.id !== pro.id)
    .sort((a, b) => {
      if (a.category === pro.category && b.category !== pro.category) return -1;
      if (a.category !== pro.category && b.category === pro.category) return 1;
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <FeaturedNav />

      {/* Hero: workspace full-width with portrait pip */}
      <section className="relative w-full max-w-[2000px] mx-auto overflow-hidden">
        {pro.spaceImageUrl ? (
          <div className="relative aspect-[4/3] sm:aspect-[21/9]">
            <div className="w-full h-full" style={getCropZoom(pro.spaceImageCropPosition)}>
              <img src={pro.spaceImageUrl} alt={pro.spaceName || "Their workspace"}
                className="w-full h-full object-cover" fetchPriority="high" decoding="sync"
                style={getCropStyle(pro.spaceImageCropPosition)}
              />
            </div>
            <div className="absolute bottom-[4%] left-[3%] w-[25%] sm:w-[18%] h-[55%] rounded-lg ring-2 ring-white shadow-lg z-10" style={getPipStyle(pro.heroCropPosition || pro.portraitCropPosition, "50% 20%").containerStyle}>
              {pro.portraitImageUrl ? (
                <img src={pro.portraitImageUrl} alt={pro.name}
                  fetchPriority="high" decoding="sync"
                  style={getPipStyle(pro.heroCropPosition || pro.portraitCropPosition, "50% 20%").imgStyle}
                />
              ) : <Initials name={pro.name} />}
            </div>
            {pro.spaceName && (
              <div className="absolute bottom-[4%] right-[3%] bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
                <Building2 className="w-3 h-3" />
                {pro.spaceName}
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-[4/3] sm:aspect-[21/9]">
            <div className="w-full h-full" style={getCropZoom(pro.heroCropPosition || pro.portraitCropPosition)}>
              {pro.portraitImageUrl ? (
                <img src={pro.portraitImageUrl} alt={`${pro.name} - ${pro.profession}`}
                  className="w-full h-full object-cover" fetchPriority="high" decoding="sync"
                  style={getCropStyle(pro.heroCropPosition || pro.portraitCropPosition, "50% 20%")}
                />
              ) : <Initials name={pro.name} />}
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 65%, rgba(250, 248, 244, 0.6) 85%, rgba(250, 248, 244, 1) 100%)' }} />
          </div>
        )}
        {pro.isSample ? (
          <div className="absolute top-4 left-4 bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm z-10">Sample</div>
        ) : null}
        <div className="absolute top-6 left-6 z-10">
          <Link href="/featured" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors group bg-black/20 backdrop-blur-sm rounded-full px-4 py-2" data-testid="link-back-featured">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
          </Link>
        </div>
      </section>

      {/* Profile info — unified for mobile + desktop */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-8 sm:pt-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#c4956a] font-semibold mb-2">{pro.profession}</p>
          <h1 className="font-serif text-[2rem] sm:text-5xl md:text-6xl font-semibold leading-[1.05] mb-2 sm:mb-3 text-foreground" data-testid="text-profile-name">
            {pro.name}
          </h1>
          <div className="flex items-center gap-2 text-foreground/45 sm:text-foreground/60 text-sm mb-2 sm:mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{pro.location}</span>
            {pro.yearsInPractice && <span>· {pro.yearsInPractice} years</span>}
          </div>
          {pro.credentials && pro.credentials.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
              {pro.credentials.slice(0, 3).map((cred, i) => (
                <span key={i} className="text-[11px] bg-[#c4956a]/10 text-[#c4956a] font-medium px-2.5 py-1 rounded-full">{cred}</span>
              ))}
            </div>
          )}
          <div className="flex items-center flex-wrap gap-3">
            {normalizeSocialLinks(pro.socialLinks).map(({ platform, url }) => {
              const Icon = SOCIAL_ICON_MAP[platform.toLowerCase()];
              if (!Icon || !url) return null;
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" data-testid={`link-social-${platform}`}
                  className="p-2.5 rounded-full bg-foreground/8 hover:bg-foreground/15 transition-colors text-foreground/70">
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
            <button
              onClick={(e) => { e.stopPropagation(); navigator.share ? navigator.share({ title: pro.name, text: shareText, url: shareUrl }) : navigator.clipboard.writeText(shareUrl); }}
              className="p-2.5 rounded-full bg-foreground/8 hover:bg-foreground/15 transition-colors text-foreground/70"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {(pro.ctaUrl || normalizeSocialLinks(pro.socialLinks).find(s => s.platform === "website")) && (
              <a
                href={pro.ctaUrl || normalizeSocialLinks(pro.socialLinks).find(s => s.platform === "website")?.url}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                data-testid="button-cta"
              >
                {pro.ctaLabel || "Connect"} <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </motion.div>
      </section>

      {/* Space context section */}
      {pro.spaceQuote && (
        <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-8 sm:pt-10">
          <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#c4956a]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c4956a] font-semibold">
                {pro.spaceName ? `Why ${pro.spaceName}` : "Their Workspace"}
              </span>
            </div>
            <p className="text-foreground/70 text-sm sm:text-base leading-relaxed italic">"{pro.spaceQuote}"</p>
          </div>
        </section>
      )}

      <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 sm:pt-14 pb-8" ref={storyRef}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-16"
        >
          {pro.storySections.narrativeHook ? (
            <>
              <p className="text-foreground/80 text-lg sm:text-xl md:text-2xl leading-[1.7] sm:leading-[1.8] font-serif" data-testid="section-narrative-hook">
                {pro.storySections.narrativeHook}
              </p>

              <blockquote className="py-10 sm:py-14 border-y border-foreground/10" data-testid="text-profile-quote">
                <p className="font-serif text-2xl sm:text-3xl md:text-4xl italic text-foreground/90 leading-[1.3] text-center max-w-2xl mx-auto">
                  "{pro.quote}"
                </p>
              </blockquote>

              {pro.storySections.qaSections && pro.storySections.qaSections.map((qa, i) => (
                <div key={i} data-testid={`section-qa-${i}`}>
                  <h2 className="font-serif text-lg sm:text-xl italic text-foreground/60 mb-5">{qa.question}</h2>
                  <p className="text-foreground/80 text-base sm:text-lg md:text-xl leading-[1.85] sm:leading-[1.9]">{qa.answer}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              <blockquote className="py-10 sm:py-14 border-y border-foreground/10" data-testid="text-profile-quote">
                <p className="font-serif text-2xl sm:text-3xl md:text-4xl italic text-foreground/90 leading-[1.3] text-center max-w-2xl mx-auto">
                  "{pro.quote}"
                </p>
              </blockquote>

              {pro.storySections.whyStarted && (
                <div data-testid="section-why-started">
                  <h2 className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-foreground/50 font-semibold mb-5">Why They Do This Work</h2>
                  <p className="text-foreground/80 text-base sm:text-lg md:text-xl leading-[1.85] sm:leading-[1.9]">{pro.storySections.whyStarted}</p>
                </div>
              )}

              {pro.storySections.whatTheyLove && (
                <div data-testid="section-what-they-love">
                  <h2 className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-foreground/50 font-semibold mb-5">What Makes It Meaningful</h2>
                  <p className="text-foreground/80 text-base sm:text-lg md:text-xl leading-[1.85] sm:leading-[1.9]">{pro.storySections.whatTheyLove}</p>
                </div>
              )}

              {pro.storySections.misunderstanding && (
                <div data-testid="section-misunderstanding">
                  <h2 className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-foreground/50 font-semibold mb-5">A Common Misconception</h2>
                  <p className="text-foreground/80 text-base sm:text-lg md:text-xl leading-[1.85] sm:leading-[1.9]">{pro.storySections.misunderstanding}</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </section>

      {(pro.ctaUrl || normalizeSocialLinks(pro.socialLinks).find(s => s.platform === "website")) && (
        <section className="max-w-3xl mx-auto px-6 pb-12">
          <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-8 sm:p-10 text-center">
            <p className="text-foreground/60 text-sm mb-3">Ready to connect with {pro.name}?</p>
            <a
              href={pro.ctaUrl || normalizeSocialLinks(pro.socialLinks).find(s => s.platform === "website")?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              data-testid="button-cta-bottom"
            >
              {pro.ctaLabel || "Connect"}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      )}

      {relatedPros.length > 0 && (
        <section className="max-w-6xl mx-auto py-16 sm:py-24">
          <div className="border-t border-foreground/10 pt-12 sm:pt-16 px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Continue Reading</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-10" data-testid="text-related-heading">You Might Also Like</h2>
          </div>
          {/* Mobile: horizontal carousel */}
          <div className="sm:hidden">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 pb-4 scrollbar-none [&_img]:pointer-events-none [&_img]:select-none" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } as any}>
              {relatedPros.map((p, idx) => (
                <div key={p.id} className="snap-start flex-shrink-0 w-[80%]">
                  <EditorialCard pro={p} index={idx} />
                </div>
              ))}
            </div>
          </div>
          {/* Desktop: grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 px-6">
            {relatedPros.map((p, idx) => (
              <EditorialCard key={p.id} pro={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-lg bg-stone-900 text-white px-6 sm:px-10 py-10 sm:py-14 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Your story matters</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-3 leading-tight">
              Know Someone Inspiring?
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-8 leading-relaxed text-sm">
              Every great community is built on the people in it. Help us tell their story.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                size="lg"
                className="bg-[#c4956a] hover:bg-[#b8895e] text-white rounded-full px-8 shadow-lg shadow-amber-900/20"
                onClick={() => setNominationOpen(true)}
                data-testid="button-nominate-someone-profile"
              >
                <Heart className="w-4 h-4 mr-2" />
                Nominate Someone for a Story & Portrait Feature
              </Button>
            </div>

            <div className="mt-6">
              {newsletterStatus === "success" ? (
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  You're in! We'll let you know when new stories drop.
                </div>
              ) : newsletterStatus === "already" ? (
                <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
                  <Mail className="w-4 h-4" />
                  You're already subscribed, stay tuned!
                </div>
              ) : newsletterStatus === "idle" && !newsletterSubmitting && newsletterEmail === "" && newsletterName === "" ? (
                <button
                  onClick={() => setNewsletterStatus("form" as any)}
                  className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Stay updated with new stories <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newsletterEmail.trim()) return;
                    setNewsletterSubmitting(true);
                    try {
                      const res = await fetch("/api/newsletter/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: newsletterEmail.trim(), firstName: newsletterName.trim() || null }),
                      });
                      const data = await res.json();
                      setNewsletterStatus(data.alreadySubscribed ? "already" : "success");
                    } catch {}
                    setNewsletterSubmitting(false);
                  }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto"
                >
                  <input
                    type="text"
                    value={newsletterName}
                    onChange={e => setNewsletterName(e.target.value)}
                    placeholder="First name"
                    className="w-full sm:w-36 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full sm:flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={newsletterSubmitting || !newsletterEmail.trim()}
                    size="sm"
                    className="rounded-full px-6 bg-white/20 hover:bg-white/30 text-white border border-white/20"
                  >
                    {newsletterSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-3.5 h-3.5 mr-1.5" /> Subscribe</>}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <NominationModal open={nominationOpen} onClose={() => setNominationOpen(false)} />
    </div>
  );
}

export default function FeaturedPage() {
  const [isProfile, params] = useRoute("/featured/:slug");

  if (isProfile && params?.slug) {
    return <ProfilePage slug={params.slug} />;
  }

  return <FeaturedListingPage />;
}
