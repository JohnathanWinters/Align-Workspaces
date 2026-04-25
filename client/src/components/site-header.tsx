import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Menu, X, Building2, DollarSign, Sparkles, Camera, Images, CalendarDays, Heart, Compass, HelpCircle, User } from "lucide-react";
import { UserIndicator } from "./user-indicator";

interface SiteHeaderProps {
  /** Optional page title shown centered in uppercase tracked styling. */
  title?: string;
  /** Back link destination. Defaults to "/". Pass null to hide. */
  backTo?: string | null;
  /** Label for the back link. Defaults to "Home". */
  backLabel?: string;
}

const MENU_ITEMS: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; group?: "services" | "photography" | "community" | "about" }[] = [
  { href: "/workspaces", icon: Building2, label: "Workspaces", group: "services" },
  { href: "/host", icon: DollarSign, label: "List Your Space", group: "services" },
  { href: "/for-studios", icon: Sparkles, label: "For Studios", group: "services" },
  { href: "/portraits", icon: Camera, label: "Portraits", group: "photography" },
  { href: "/portfolio", icon: Images, label: "Portfolio", group: "photography" },
  { href: "/#events", icon: CalendarDays, label: "Community Events", group: "community" },
  { href: "/featured", icon: Heart, label: "Featured Pros", group: "community" },
  { href: "/our-vision", icon: Compass, label: "Our Vision", group: "about" },
  { href: "/support", icon: HelpCircle, label: "Support", group: "about" },
  { href: "/portal", icon: User, label: "Client Portal", group: "about" },
];

export function SiteHeader({ title, backTo = "/", backLabel = "Home" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const groups = [
    ["services", MENU_ITEMS.filter(i => i.group === "services")] as const,
    ["photography", MENU_ITEMS.filter(i => i.group === "photography")] as const,
    ["community", MENU_ITEMS.filter(i => i.group === "community")] as const,
    ["about", MENU_ITEMS.filter(i => i.group === "about")] as const,
  ];

  const handleNav = (href: string) => {
    setMenuOpen(false);
    if (href.includes("#")) {
      setLocation("/");
      setTimeout(() => {
        const id = href.split("#")[1];
        document.querySelector(`[data-testid="section-${id}"]`)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else {
      setLocation(href);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface-warm/95 backdrop-blur-sm border-b border-stone-200/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
        {backTo ? (
          <Link
            href={backTo}
            className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        ) : <div className="w-10" />}

        {title && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-brand-primary font-semibold pointer-events-none">
            {title}
          </span>
        )}

        <div className="flex items-center gap-3 z-10">
          <UserIndicator />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors"
              data-testid="site-header-menu-toggle"
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
                  className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[220px] z-[9999]"
                >
                  {groups.map(([name, items], idx) =>
                    items.length > 0 && (
                      <div key={name}>
                        {idx > 0 && <div className="border-t border-stone-100 my-1" />}
                        {items.map(item => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.href}
                              onClick={() => handleNav(item.href)}
                              className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3"
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
