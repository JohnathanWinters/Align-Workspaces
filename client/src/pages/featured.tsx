import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Search, Share2, ExternalLink, Star, Users, Camera, ChevronRight, X, Menu, User } from "lucide-react";
import { SiLinkedin, SiFacebook, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface FeaturedProfessional {
  id: string;
  name: string;
  profession: string;
  location: string;
  category: string;
  slug: string;
  portraitImageUrl: string | null;
  headline: string;
  quote: string;
  storySections: {
    whyStarted: string;
    whatTheyLove: string;
    misunderstanding: string;
  };
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  } | null;
  isFeaturedOfWeek: number;
  isSample: number;
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

function FeaturedNav({ onBack }: { onBack?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/">
            <p className="font-serif text-base sm:text-lg font-semibold tracking-tight cursor-pointer whitespace-nowrap" data-testid="link-home-logo">Align</p>
          </Link>
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-featured-menu-toggle"
              className="p-2 rounded-md hover:bg-black/5 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-lg shadow-lg py-2 min-w-[180px] z-50">
                <Link href="/featured">
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors font-medium" data-testid="link-featured-nav">Featured</button>
                </Link>
                <Link href="/portfolio">
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors" data-testid="link-portfolio-nav">Our Work</button>
                </Link>
                <Link href="/about">
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors" data-testid="link-about-nav">Our Vision</button>
                </Link>
                <Link href="/portal">
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors" data-testid="link-portal-nav">Client Portal</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfessionalCard({ pro }: { pro: FeaturedProfessional }) {
  const [, setLocation] = useLocation();
  const initials = pro.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
        onClick={() => setLocation(`/featured/${pro.slug}`)}
        data-testid={`card-featured-${pro.slug}`}
      >
        <div className="aspect-[3/4] relative overflow-hidden bg-stone-200">
          {pro.portraitImageUrl ? (
            <img
              src={pro.portraitImageUrl}
              alt={`${pro.name} - ${pro.profession}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400">
              <span className="text-4xl font-serif text-white/80">{initials}</span>
            </div>
          )}
          {pro.isSample ? (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Sample
            </div>
          ) : null}
        </div>
        <CardContent className="p-4 sm:p-5">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-0.5" data-testid={`text-name-${pro.slug}`}>{pro.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{pro.profession}</p>
          <p className="text-sm text-foreground/80 italic leading-relaxed line-clamp-2">"{pro.headline}"</p>
          <div className="mt-4">
            <span className="text-sm font-medium text-foreground inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Read Story <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WeeklySpotlight({ pro }: { pro: FeaturedProfessional }) {
  const [, setLocation] = useLocation();
  const initials = pro.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <section className="mb-12 sm:mb-16">
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        <h2 className="font-serif text-xl sm:text-2xl font-semibold" data-testid="text-potw-heading">Professional of the Week</h2>
      </div>
      <Card
        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all"
        onClick={() => setLocation(`/featured/${pro.slug}`)}
        data-testid="card-professional-of-week"
      >
        <div className="grid md:grid-cols-2 gap-0">
          <div className="aspect-square md:aspect-auto relative overflow-hidden bg-stone-200">
            {pro.portraitImageUrl ? (
              <img
                src={pro.portraitImageUrl}
                alt={`${pro.name} - ${pro.profession}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400">
                <span className="text-6xl font-serif text-white/80">{initials}</span>
              </div>
            )}
          </div>
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Featured This Week</p>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold mb-1" data-testid="text-potw-name">{pro.name}</h3>
            <p className="text-muted-foreground mb-4">{pro.profession} · {pro.location}</p>
            <p className="text-foreground/80 leading-relaxed mb-6 line-clamp-4">
              {pro.storySections.whyStarted.slice(0, 200)}...
            </p>
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover:gap-3 transition-all">
                Read Full Story <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

const CATEGORY_ORDER = ["Therapists", "Chefs", "Personal Trainers"];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Therapists": "Mental health professionals helping Miami's community heal, grow, and thrive.",
  "Chefs": "Culinary artists bringing Miami's diverse flavors to life in kitchens across the city.",
  "Personal Trainers": "Fitness professionals empowering Miami's workforce to feel strong and confident.",
};

function FeaturedListingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: professionals = [], isLoading } = useQuery<FeaturedProfessional[]>({
    queryKey: ["/api/featured"],
    queryFn: async () => {
      const res = await fetch(`/api/featured`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: weeklyPro } = useQuery<FeaturedProfessional | null>({
    queryKey: ["/api/featured/professional-of-the-week"],
  });

  const filtered = searchQuery
    ? professionals.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : professionals;

  const groupedByCategory: Record<string, FeaturedProfessional[]> = {};
  for (const pro of filtered) {
    if (!groupedByCategory[pro.category]) {
      groupedByCategory[pro.category] = [];
    }
    groupedByCategory[pro.category].push(pro);
  }

  const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  useEffect(() => {
    document.title = "Featured Professionals | Align";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <FeaturedNav />

      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold mb-4" data-testid="text-featured-heading">
              Featured Professionals
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Discover the stories behind Miami's most passionate professionals — and the portraits that tell them.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {weeklyPro && <WeeklySpotlight pro={weeklyPro} />}

        <div className="flex items-center justify-end mb-8">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search professionals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-featured"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-16">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-7 bg-muted rounded w-40 mb-2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-72 mb-6 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2].map(j => (
                    <div key={j} className="animate-pulse">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2">No professionals found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Try a different search term" : "Check back soon for new featured stories"}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {sortedCategories.map((category, idx) => (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                data-testid={`section-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="mb-6">
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-1" data-testid={`text-category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                    {category}
                  </h2>
                  {CATEGORY_DESCRIPTIONS[category] && (
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedByCategory[category].map(pro => (
                    <ProfessionalCard key={pro.id} pro={pro} />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}

        <section className="mt-20 sm:mt-24 text-center py-12 sm:py-16 px-6 bg-stone-100 rounded-2xl">
          <Camera className="w-10 h-10 mx-auto mb-4 text-foreground/60" />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-3" data-testid="text-get-featured-heading">
            Want to Be Featured?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            Tell your story and get professional portraits for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-foreground/70 mb-8">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">1</span>
              Book a headshot session
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">2</span>
              Share your story
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">3</span>
              Get featured on Align
            </div>
          </div>
          <Link href="/">
            <Button size="lg" data-testid="button-book-session-featured">
              Book a Session
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

function ProfilePage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();

  const { data: pro, isLoading, error } = useQuery<FeaturedProfessional>({
    queryKey: ["/api/featured", slug],
    queryFn: async () => {
      const res = await fetch(`/api/featured/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

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
  }, [pro]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = pro ? `Meet ${pro.name}, ${pro.profession} — ${pro.headline}` : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FeaturedNav />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-6">
            <div className="aspect-[16/9] bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="space-y-3 mt-8">
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

  const initials = pro.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <FeaturedNav />

      <section className="relative">
        <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-8">
          <Link href="/featured">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8" data-testid="link-back-featured">
              <ArrowLeft className="w-4 h-4" />
              All Professionals
            </button>
          </Link>

          <div className="grid md:grid-cols-[1fr,1.2fr] gap-8 md:gap-12 items-start">
            <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-stone-200 shadow-lg">
              {pro.portraitImageUrl ? (
                <img
                  src={pro.portraitImageUrl}
                  alt={`${pro.name} - ${pro.profession}`}
                  className="w-full h-full object-cover"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400">
                  <span className="text-6xl font-serif text-white/80">{initials}</span>
                </div>
              )}
              {pro.isSample ? (
                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Sample
                </div>
              ) : null}
            </div>

            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-1" data-testid="text-profile-name">{pro.name}</h1>
              <p className="text-lg text-muted-foreground mb-1">{pro.profession}</p>
              <p className="text-sm text-muted-foreground mb-6">{pro.location}</p>

              <div className="flex items-center gap-3 mb-8">
                {pro.socialLinks?.linkedin && (
                  <a href={pro.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" data-testid="link-linkedin" className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors">
                    <SiLinkedin className="w-4 h-4" />
                  </a>
                )}
                {pro.socialLinks?.facebook && (
                  <a href={pro.socialLinks.facebook} target="_blank" rel="noopener noreferrer" data-testid="link-facebook" className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors">
                    <SiFacebook className="w-4 h-4" />
                  </a>
                )}
                {pro.socialLinks?.twitter && (
                  <a href={pro.socialLinks.twitter} target="_blank" rel="noopener noreferrer" data-testid="link-twitter" className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors">
                    <SiX className="w-4 h-4" />
                  </a>
                )}
                <div className="h-5 w-px bg-border mx-1" />
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: pro.name, text: shareText, url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                    }
                  }}
                  className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <blockquote className="border-l-4 border-foreground/20 pl-5 py-2 mb-8" data-testid="text-profile-quote">
                <p className="font-serif text-xl sm:text-2xl italic text-foreground/80 leading-relaxed">
                  "{pro.quote}"
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        <div data-testid="section-why-started">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-4">Why They Started</h2>
          <p className="text-foreground/80 leading-relaxed">{pro.storySections.whyStarted}</p>
        </div>

        <div data-testid="section-what-they-love">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-4">What They Love About Their Work</h2>
          <p className="text-foreground/80 leading-relaxed">{pro.storySections.whatTheyLove}</p>
        </div>

        <div data-testid="section-misunderstanding">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-4">One Thing People Misunderstand</h2>
          <p className="text-foreground/80 leading-relaxed">{pro.storySections.misunderstanding}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center py-12 sm:py-16 px-6 bg-stone-100 rounded-2xl">
          <Camera className="w-10 h-10 mx-auto mb-4 text-foreground/60" />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-3">Want to Be Featured?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            Tell your story and get professional portraits for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-foreground/70 mb-8">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">1</span>
              Book a headshot session
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">2</span>
              Share your story
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">3</span>
              Get featured on Align
            </div>
          </div>
          <Link href="/">
            <Button size="lg" data-testid="button-book-session-profile">
              Book a Session
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="h-12" />
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
