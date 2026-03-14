import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";
import { NewsletterSignup } from "./newsletter-signup";

interface SiteFooterProps {
  variant?: "dark" | "light";
}

export function SiteFooter({ variant = "light" }: SiteFooterProps) {
  const isDark = variant === "dark";
  const textColor = isDark ? "text-white/60" : "text-stone-500 dark:text-white/60";
  const hoverColor = isDark ? "hover:text-white" : "hover:text-stone-900 dark:hover:text-white";
  const dividerColor = isDark ? "border-white/10" : "border-stone-200 dark:border-white/10";

  const navLinks = [
    { label: "Portraits", href: "/portraits" },
    { label: "Spaces", href: "/browse" },
    { label: "Featured Pros", href: "/featured" },
    { label: "About Us", href: "/about" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Client Portal", href: "/portal" },
  ];

  return (
    <footer className={`relative z-10 w-full px-6 py-8 sm:py-10 pb-16 sm:pb-10`} data-testid="site-footer">
      <div className={`max-w-4xl mx-auto border-t ${dividerColor} pt-8`}>
        <div className="mb-8 px-2">
          <NewsletterSignup variant={variant} />
        </div>

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
        <p className={`text-center text-[10px] ${textColor}`} data-testid="text-footer-copyright">
          &copy; 2026 Align Workspaces
        </p>
      </div>
    </footer>
  );
}
