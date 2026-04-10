import { useState, useEffect, useRef, useCallback } from "react";
import { setPageMeta } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Sparkles, X, Menu, MapPin, Star, Users, Info, Compass, ArrowRight, Building2, Image, Heart, Images, Loader2, HelpCircle, ChevronDown, CalendarDays,
} from "lucide-react";
import { Link } from "wouter";
import { UserIndicator } from "@/components/user-indicator";
import { SiteFooter } from "@/components/site-footer";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  location: string | null;
  bio: string | null;
  photoUrl: string | null;
  cropPosition: { x: number; y: number; zoom: number } | null;
  sortOrder: number;
}

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });
  const onDragStart = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
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
    if (state.current.isDown) { state.current.isDown = false; const el = ref.current; if (el) { el.style.cursor = ""; el.style.scrollSnapType = ""; } }
  }, []);
  const preventClickIfDragged = useCallback((e: React.MouseEvent) => {
    if (state.current.moved) { e.preventDefault(); e.stopPropagation(); state.current.moved = false; }
  }, []);
  return { ref, onDragStart, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, preventClickIfDragged };
}

export default function PhotographersPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showFounders, setShowFounders] = useState(false);
  const [expandedFounder, setExpandedFounder] = useState<string | null>(null);
  const membersCarousel = useDragScroll();
  useEffect(() => {
    setPageMeta({
      title: "Our Vision | Space, Image & Community for Miami Professionals | Align",
      description: "Learn about Align's mission to connect independent professionals with flexible workspaces, professional photography, and a supportive community in Miami.",
      url: "https://alignworkspaces.com/our-vision",
    });
  }, []);

  const { data: members = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between relative">
            <Link href={new URLSearchParams(window.location.search).get("from") === "portal" ? "/portal?tab=overview" : "/"} className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10" data-testid="button-back-home-photographers">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">Our Vision</span>
            <div className="flex items-center gap-3">
              <UserIndicator />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  data-testid="button-photographers-menu"
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
                      <Link href="/workspaces">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-photographers">
                          <MapPin className="w-4 h-4" />
                          Align Workspaces
                        </button>
                      </Link>
                      <Link href="/portraits">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-photographers">
                          <Camera className="w-4 h-4" />
                          Portraits
                        </button>
                      </Link>
                      <Link href="/#events" className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <CalendarDays className="w-4 h-4" />
                        Community Events
                      </Link>
                      <Link href="/featured">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-photographers">
                          <Star className="w-4 h-4" />
                          Featured Pros
                        </button>
                      </Link>
                      <Link href="/portfolio">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-photographers">
                          <Images className="w-4 h-4" />
                          Portfolio
                        </button>
                      </Link>
                      <Link href="/our-vision">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-photographers">
                          <Compass className="w-4 h-4" />
                          Our Vision
                        </button>
                      </Link>
                      <Link href="/support">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-support-photographers">
                          <HelpCircle className="w-4 h-4" />
                          Support
                        </button>
                      </Link>
                      <Link href="/portal">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-photographers">
                          <Users className="w-4 h-4" />
                          Client Portal
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

      <section className="pt-16 sm:pt-24 pb-14 sm:pb-20" data-testid="section-what-align-brings">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14 sm:mb-20"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-4">Our Vision</p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] text-[#2a2a2a] leading-tight mb-4" data-testid="text-what-align-heading">
              Space, Image, Community
            </h1>
            <p className="text-stone-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Everything an independent professional needs to build a practice that feels intentional.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {[
              {
                icon: Building2,
                title: "The Right Space",
                desc: "Miami workspaces, available by the hour, matched to the experience you want to create.",
              },
              {
                icon: Image,
                title: "The Right Image",
                desc: "Professional portraits and branding that match the experience clients walk into.",
              },
              {
                icon: Heart,
                title: "The Right People",
                desc: "A network of professionals sharing resources, workspaces, and support.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                className="text-center flex flex-col items-center"
                data-testid={`pillar-${i}`}
              >
                <div className="w-11 h-11 rounded-full bg-[#c4956a]/10 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-[#c4956a]" />
                </div>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#2a2a2a] mb-2">{item.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed max-w-[260px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="h-px bg-stone-200/80" />
      </div>

      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          {/* Mobile: cards with photo + summary, tap "Read more" for bio popup */}
          <div className="md:hidden">
            <div className="text-center mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-3">The Team</p>
              <h2 className="font-serif text-2xl text-[#2a2a2a]">Meet the Founders</h2>
            </div>
            <div className="space-y-4">
              {members.map((member, i) => {
                const crop = member.cropPosition || { x: 50, y: 50, zoom: 1 };
                const photoSrc = member.photoUrl?.startsWith("/") || member.photoUrl?.startsWith("http")
                  ? member.photoUrl
                  : member.photoUrl ? `/objects/${member.photoUrl}` : null;
                return (
                  <div
                    key={member.id}
                    className="w-full bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden text-left"
                    data-testid={`card-photographer-page-${i}`}
                  >
                    <div className="flex gap-0">
                      {photoSrc && (
                        <div className="w-[35%] flex-shrink-0 overflow-hidden">
                          <img src={photoSrc} alt={member.name} className="w-full h-full object-cover" draggable={false}
                            style={{ objectPosition: `${crop.x}% ${crop.y}%`, ...(crop.zoom !== 1 ? { transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` } : {}) }}
                            loading="lazy" decoding="async"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4 flex flex-col justify-center">
                        <h3 className="font-serif text-lg text-[#2a2a2a] mb-0.5">{member.name}</h3>
                        <p className="text-[12px] text-[#c4956a] font-medium mb-1">{member.role}</p>
                        {member.location && (
                          <p className="text-[11px] text-stone-400 mb-2 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {member.location}
                          </p>
                        )}
                        {member.bio && (
                          <p className="text-[12px] text-stone-500 leading-[1.6] line-clamp-2">
                            {member.bio.split("\n").filter(Boolean)[0]}
                          </p>
                        )}
                        {member.bio && (
                          <button
                            onClick={() => setExpandedFounder(member.id)}
                            className="text-[11px] text-[#c4956a] mt-2 font-medium text-left"
                          >
                            Read more
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bio popup modal */}
            <AnimatePresence>
              {expandedFounder && (() => {
                const member = members.find(m => m.id === expandedFounder);
                if (!member) return null;
                return (
                  <motion.div
                    key="bio-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end justify-center px-4 pb-4"
                    onClick={() => setExpandedFounder(null)}
                  >
                    <motion.div
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="bg-white rounded-2xl w-full max-w-lg max-h-[75vh] overflow-y-auto shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
                        <div>
                          <h3 className="font-serif text-lg text-[#2a2a2a]">{member.name}</h3>
                          <p className="text-[12px] text-[#c4956a] font-medium">{member.role}</p>
                        </div>
                        <button
                          onClick={() => setExpandedFounder(null)}
                          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                        >
                          <X className="w-4 h-4 text-stone-500" />
                        </button>
                      </div>
                      <div className="px-5 py-5">
                        <p className="text-[13px] text-stone-600 leading-[1.8] whitespace-pre-line">{member.bio}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Desktop: always visible grid */}
          <div className="hidden md:block">
            <div className="text-center mb-10">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold mb-3">The Team</p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]" data-testid="text-team-heading">
                Meet the Founders
              </h2>
            </div>
            <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6">
              {membersLoading ? (
                <div className="col-span-2 flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : members.map((member, i) => {
                const crop = member.cropPosition || { x: 50, y: 50, zoom: 1 };
                const photoSrc = member.photoUrl?.startsWith("/") || member.photoUrl?.startsWith("http")
                  ? member.photoUrl
                  : member.photoUrl ? `/objects/${member.photoUrl}` : null;
                return (
                  <div key={member.id} className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden" data-testid={`card-photographer-page-${i}`}>
                    {photoSrc && (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={photoSrc} alt={member.name} className="w-full h-full object-cover"
                          style={{ objectPosition: `${crop.x}% ${crop.y}%`, ...(crop.zoom !== 1 ? { transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` } : {}) }}
                          loading="lazy" decoding="async" data-testid={`img-photographer-page-${i}`}
                        />
                      </div>
                    )}
                    <div className="p-6 sm:p-8">
                      <h3 className="font-serif text-xl sm:text-2xl text-[#2a2a2a] mb-1" data-testid={`text-photographer-page-name-${i}`}>{member.name}</h3>
                      <p className="text-[13px] text-[#c4956a] font-medium mb-1" data-testid={`text-photographer-page-role-${i}`}>{member.role}</p>
                      {member.location && (
                        <p className="text-[12px] text-stone-400 mb-5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {member.location}
                        </p>
                      )}
                      {member.bio && (
                        <div className="space-y-3" data-testid={`text-photographer-page-bio-${i}`}>
                          {member.bio.split("\n").filter(Boolean).map((para, j) => (
                            <p key={j} className="text-[13px] sm:text-sm text-stone-500 leading-[1.7]">{para}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="h-px bg-stone-200/80" />
      </div>

      <section className="py-14 sm:py-20" data-testid="section-looking-ahead">
        <div className="max-w-xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#3d3d3d] font-serif text-lg sm:text-xl leading-[1.7] mb-3">
              Where the space, the image, and the experience tell the same story.
            </p>
            <p className="text-[#c4956a] font-serif italic mb-10">
              One professional at a time.
            </p>

            <button
              onClick={() => setShowExplore(true)}
              data-testid="button-browse-workspaces-vision"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-7 py-3 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Explore what Align offers
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {showExplore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowExplore(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 text-center border-b border-stone-100">
                <h3 className="font-serif text-xl text-[#2a2a2a]">What are you looking for?</h3>
              </div>
              <div className="grid grid-cols-2 gap-0">
                <Link
                  href="/workspaces"
                  className="group flex flex-col items-center justify-center p-8 sm:p-10 hover:bg-stone-50 transition-colors border-r border-stone-100"
                  data-testid="link-explore-workspaces"
                >
                  <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mb-4 group-hover:bg-[#c4956a]/20 transition-colors">
                    <Building2 className="w-6 h-6 text-[#c4956a]" />
                  </div>
                  <span className="font-serif text-lg text-[#2a2a2a] mb-1">Workspaces</span>
                  <span className="text-xs text-stone-400">Find your space</span>
                </Link>
                <Link
                  href="/portraits"
                  className="group flex flex-col items-center justify-center p-8 sm:p-10 hover:bg-stone-50 transition-colors"
                  data-testid="link-explore-portraits"
                >
                  <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mb-4 group-hover:bg-[#c4956a]/20 transition-colors">
                    <Camera className="w-6 h-6 text-[#c4956a]" />
                  </div>
                  <span className="font-serif text-lg text-[#2a2a2a] mb-1">Portraits</span>
                  <span className="text-xs text-stone-400">Build your image</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteFooter hideNewsletter />
    </div>
  );
}
