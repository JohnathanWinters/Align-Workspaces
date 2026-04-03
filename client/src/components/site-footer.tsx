import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";
import { NewsletterSignup } from "./newsletter-signup";

interface SiteFooterProps {
  variant?: "dark" | "light";
  hideNewsletter?: boolean;
}

export function SiteFooter({ variant = "light", hideNewsletter = false }: SiteFooterProps) {
  const isDark = variant === "dark";
  const textColor = isDark ? "text-white/60" : "text-stone-500 dark:text-white/60";
  const hoverColor = isDark ? "hover:text-white" : "hover:text-stone-900 dark:hover:text-white";
  const dividerColor = isDark ? "border-white/10" : "border-stone-200 dark:border-white/10";

  const navLinks = [
    { label: "Workspaces", href: "/workspaces" },
    { label: "Portraits", href: "/portraits" },
    { label: "Community Events", href: "/#events" },
    { label: "Featured Pros", href: "/featured" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Our Vision", href: "/our-vision" },
    { label: "Support", href: "/support" },
    { label: "Client Portal", href: "/portal" },
  ];

  return (
    <footer className={`relative z-10 w-full px-6 py-8 sm:py-10 pb-16 sm:pb-10`} data-testid="site-footer">
      <div className={`max-w-4xl mx-auto border-t ${dividerColor} pt-8`}>
        {!hideNewsletter && (
          <div className="mb-10 px-2">
            <div className="text-center mb-4">
              <span className={`text-[10px] tracking-[0.3em] uppercase font-semibold block mb-1.5 ${isDark ? "text-[#c9a96e]/70" : "text-[#c4956a]"}`}>Stay Connected</span>
              <p className={`text-sm ${isDark ? "text-white/50" : "text-stone-500"} max-w-sm mx-auto leading-relaxed`}>
                New spaces, community guides, and stories from professionals across Miami.
              </p>
            </div>
            <NewsletterSignup variant={variant} />
          </div>
        )}

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`text-xs tracking-widest uppercase ${textColor} ${hoverColor} transition-colors duration-200 cursor-pointer`}
                data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
          <span className={`flex items-center gap-1.5 text-xs ${textColor}`}>
            <MapPin className="w-3 h-3" />
            Miami, FL
          </span>
          <a
            href="mailto:hello@alignworkspaces.com"
            className={`flex items-center gap-1.5 text-xs ${textColor} ${hoverColor} transition-colors duration-200`}
            data-testid="link-footer-email"
          >
            <Mail className="w-3 h-3" />
            hello@alignworkspaces.com
          </a>
        </div>

        <div className="flex flex-col items-center mb-2">
          <img src="/images/logo-align-dark.png" alt="Align" className="w-10 h-10 object-contain" />
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Link href="/terms">
            <span className={`text-[10px] ${textColor} ${hoverColor} transition-colors cursor-pointer`}>Terms of Service</span>
          </Link>
          <span className={`text-[10px] ${textColor}`}>|</span>
          <Link href="/privacy">
            <span className={`text-[10px] ${textColor} ${hoverColor} transition-colors cursor-pointer`}>Privacy Policy</span>
          </Link>
        </div>
        <p className={`text-center text-[10px] ${textColor}`} data-testid="text-footer-copyright">
          &copy; 2026 Align Workspaces
        </p>
      </div>
    </footer>
  );
}
