import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
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
  Wifi,
  Check,
} from "lucide-react";
import type { Space } from "@shared/schema";

const SPACE_TYPES = [
  { key: "all", label: "All Spaces", icon: Building2 },
  { key: "office", label: "Offices", icon: Briefcase },
  { key: "gym", label: "Training Studios", icon: Dumbbell },
  { key: "meeting", label: "Meeting Rooms", icon: Building2 },
] as const;

const TYPE_LABELS: Record<string, string> = {
  office: "Office",
  gym: "Training Studio",
  meeting: "Meeting Room",
};

const TYPE_COLORS: Record<string, string> = {
  office: "bg-blue-50 text-blue-700",
  gym: "bg-emerald-50 text-emerald-700",
  meeting: "bg-amber-50 text-amber-700",
};

function SpaceCard({ space }: { space: Space }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md transition-shadow duration-300"
      data-testid={`card-space-${space.id}`}
    >
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        {space.imageUrls && space.imageUrls.length > 0 ? (
          <img
            src={space.imageUrls[0]}
            alt={space.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
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
        ) : null}
      </div>

      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1" data-testid={`text-space-name-${space.id}`}>
          {space.name}
        </h3>

        <div className="flex items-center gap-1.5 text-foreground/50 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{space.neighborhood || space.address}</span>
        </div>

        <p className="text-foreground/60 text-sm leading-relaxed mb-4 line-clamp-2">
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

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
          data-testid={`button-expand-space-${space.id}`}
        >
          {expanded ? "Show less" : "View details"}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

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
                <p className="text-sm text-foreground/60 leading-relaxed">{space.description}</p>

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

                {space.contactEmail && (
                  <a
                    href={`mailto:${space.contactEmail}`}
                    className="inline-flex items-center gap-2 text-sm bg-foreground text-background px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium mt-2"
                    data-testid={`button-contact-space-${space.id}`}
                  >
                    Contact Host
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SpacesBrowsePage() {
  const [activeType, setActiveType] = useState<string>("all");

  const { data: allSpaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = activeType === "all"
    ? allSpaces
    : allSpaces.filter(s => s.type === activeType);

  const typeCounts = SPACE_TYPES.map(t => ({
    ...t,
    count: t.key === "all" ? allSpaces.length : allSpaces.filter(s => s.type === t.key).length,
  }));

  useEffect(() => {
    document.title = "Browse Spaces | Align Spaces — Miami Workspaces for Professionals";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/spaces">
            <button className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors" data-testid="link-back-spaces">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Align Spaces</span>
            </button>
          </Link>
          <Link href="/spaces">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Align Spaces</span>
          </Link>
          <Link href="/featured">
            <button className="text-xs text-foreground/50 hover:text-foreground transition-colors" data-testid="link-featured-from-spaces">
              Featured
            </button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold mb-3">Miami Workspaces</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold mb-4" data-testid="text-spaces-heading">
            Find Your Space
          </h1>
          <p className="text-foreground/50 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Professional workspaces in Miami built for therapists, trainers, consultants, and small business owners. Rent by the hour or the day.
          </p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {typeCounts.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              data-testid={`button-filter-${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 ${
                activeType === key
                  ? "bg-foreground text-background font-medium"
                  : "bg-stone-100 text-foreground/60 hover:bg-stone-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs ${activeType === key ? "text-background/60" : "text-foreground/30"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((space, i) => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <SpaceCard space={space} />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 pb-12"
        >
          <div className="bg-stone-50 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-3" data-testid="text-list-space-heading">
              Have a space to share?
            </h2>
            <p className="text-foreground/50 text-sm mb-6 max-w-md mx-auto">
              If you own a workspace in Miami that could serve small business professionals, we'd love to hear from you.
            </p>
            <a
              href="mailto:ArmandoRamirezRomero89@gmail.com?subject=List my space on Align Spaces"
              className="inline-flex items-center gap-2 text-sm tracking-widest uppercase bg-foreground text-background px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity font-medium"
              data-testid="button-list-space"
            >
              List Your Space
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
