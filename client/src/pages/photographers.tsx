import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Sparkles, X, Menu, MapPin, Star, Users, Info, ArrowRight, Building2, Image, Heart, Images } from "lucide-react";
import { Link } from "wouter";
import armandoPhoto from "@assets/14764699-b1dd-4fe8-88ff-ed19c87cc1f8_1773349252752.png";
import { UserIndicator } from "@/components/user-indicator";
import { SiteFooter } from "@/components/site-footer";

export default function PhotographersPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.title = "Our Vision | Align Workspaces";
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="button-back-home-photographers">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Our Vision</span>
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
                      <Link href="/portrait-builder">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-photographers">
                          <Camera className="w-4 h-4" />
                          Portrait Builder
                        </button>
                      </Link>
                      <Link href="/portfolio">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-photographers">
                          <Images className="w-4 h-4" />
                          Our Work
                        </button>
                      </Link>
                      <Link href="/workspaces">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-photographers">
                          <MapPin className="w-4 h-4" />
                          Align Spaces
                        </button>
                      </Link>
                      <Link href="/featured">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-photographers">
                          <Star className="w-4 h-4" />
                          Featured Pros
                        </button>
                      </Link>
                      <Link href="/our-vision">
                        <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-photographers">
                          <Info className="w-4 h-4" />
                          Our Vision
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f0ebe4] via-[#faf8f5] to-[#faf8f5]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#c9a96e]/30" />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-5">
              <div className="w-8 h-px bg-[#c9a96e]/40" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#c4956a] font-semibold">
                Our Vision
              </p>
              <div className="w-8 h-px bg-[#c9a96e]/40" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] leading-tight text-[#2a2a2a]" data-testid="text-photographers-title">
              Where Your Work<br className="hidden sm:block" /> and Space Align
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="max-w-2xl mx-auto"
            data-testid="text-vision-statement"
          >
            <div className="relative">
              <div className="absolute -left-4 sm:-left-6 top-1 bottom-1 w-px bg-gradient-to-b from-[#c9a96e]/50 via-[#c9a96e]/20 to-transparent" />
              <div className="space-y-8 pl-2 sm:pl-4">
                <p className="text-[#3d3d3d] text-base sm:text-[17px] leading-[1.75]">
                  The spaces where meaningful work happens should reflect the people doing it.
                </p>
                <p className="text-[#3d3d3d] text-base sm:text-[17px] leading-[1.75]">
                  For most independent professionals, that's rarely the case. Therapists seeing clients in rooms that feel clinical. Coaches meeting people in spaces that undercut the trust they've spent years building. Creatives working in environments that have nothing to do with the work they make.
                </p>
                <p className="text-[#3d3d3d] text-base sm:text-[17px] leading-[1.75] font-medium">
                  The space is part of the experience. It always has been.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-stone-200/80" />
            <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]/50" />
            <div className="flex-1 h-px bg-stone-200/80" />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="text-center mb-10 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-stone-300/60" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 font-medium">
                Behind the Vision
              </p>
              <div className="w-6 h-px bg-stone-300/60" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]" data-testid="text-team-heading">
              Meet the Founder
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden" data-testid="card-photographer-page-0">
              <div className="md:flex">
                <div className="md:w-[38%] flex-shrink-0">
                  <div className="aspect-[3/4] sm:aspect-square md:aspect-auto md:h-full overflow-hidden">
                    <img
                      src={armandoPhoto}
                      alt="Armando Ramirez Romero"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      data-testid="img-photographer-page-0"
                    />
                  </div>
                </div>
                <div className="p-6 sm:p-8 md:p-8 lg:p-10 md:w-[62%] md:flex md:flex-col md:justify-center">
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2a2a2a] mb-1" data-testid="text-photographer-page-name-0">
                    Armando Ramirez Romero
                  </h3>
                  <p className="text-[13px] text-[#c4956a] font-medium mb-1" data-testid="text-photographer-page-role-0">Founder, Align</p>
                  <p className="text-[12px] text-stone-400 mb-6 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Miami, FL
                  </p>
                  <div className="space-y-4" data-testid="text-photographer-page-bio-0">
                    <p className="text-[13px] sm:text-sm text-stone-500 leading-[1.7]">
                      I started Align because I kept seeing the same disconnect. Talented, dedicated professionals doing meaningful work in spaces that didn't reflect any of it.
                    </p>
                    <p className="text-[13px] sm:text-sm text-stone-500 leading-[1.7]">
                      These weren't people cutting corners. They were therapists, coaches, and creatives who cared deeply about the experience they created for their clients. But the environments available were temporary, impersonal, or simply not built for their work.
                    </p>
                    <p className="text-[13px] sm:text-sm text-stone-600 leading-[1.7] font-medium">
                      I built Align to close that gap.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-stone-200/80" />
            <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]/50" />
            <div className="flex-1 h-px bg-stone-200/80" />
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" data-testid="section-what-align-brings">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[11px] tracking-[0.15em] uppercase text-stone-400 font-medium mb-4">
              Built in Miami for therapists, coaches, and independent professionals.
            </p>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-stone-300/60" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#c4956a] font-medium">
                The Platform
              </p>
              <div className="w-6 h-px bg-stone-300/60" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-[2.25rem] text-[#2a2a2a] mb-3" data-testid="text-what-align-heading">
              What Align Brings Together
            </h2>
            <p className="text-stone-500 text-sm sm:text-base max-w-lg mx-auto">
              Every independent professional needs three things:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {[
              {
                icon: Building2,
                title: "A space that fits the work.",
                desc: "Miami spaces, available by the hour, matched to the experience you want to create.",
              },
              {
                icon: Image,
                title: "An image that reflects the work.",
                desc: "Professional portraits and branding that match the experience clients walk into.",
              },
              {
                icon: Heart,
                title: "A community that understands the work.",
                desc: "A network of professionals sharing resources, spaces, and support.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center flex flex-col items-center"
                data-testid={`pillar-${i}`}
              >
                <div className="w-12 h-12 rounded-full bg-[#f5f0e8] flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#c4956a]" />
                </div>
                <h3 className="font-serif text-lg text-[#2a2a2a] mb-3 leading-snug">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed max-w-[280px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-block bg-[#f5f0e8] rounded-xl px-6 sm:px-8 py-4 sm:py-5 border border-[#e8dfd2]">
              <p className="text-[#2a2a2a] text-sm sm:text-base font-medium font-serif">
                Not three separate things. <span className="italic text-[#c4956a]">One aligned practice.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-stone-200/80" />
            <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]/50" />
            <div className="flex-1 h-px bg-stone-200/80" />
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" data-testid="section-looking-ahead">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-stone-300/60" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#c4956a] font-medium">
                Looking Ahead
              </p>
              <div className="w-6 h-px bg-stone-300/60" />
            </div>
            <p className="text-[#3d3d3d] text-base sm:text-[17px] leading-[1.8] mb-6">
              We're building a Miami where independent professionals can build practices that feel intentional from the inside out. Where the space, the image, and the experience tell the same story.
            </p>
            <p className="text-[#2a2a2a] font-serif text-lg sm:text-xl italic mb-10">
              One professional at a time.
            </p>

            <Link
              href="/workspaces"
              data-testid="button-browse-workspaces-vision"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Explore what Align offers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
