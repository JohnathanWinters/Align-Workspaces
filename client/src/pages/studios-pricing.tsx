import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, Calendar, FileSignature, Wallet, MessageSquare, RefreshCw, BellRing, ShieldAlert, BarChart3, UserCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SiteFooter } from "@/components/site-footer";
import { UserIndicator } from "@/components/user-indicator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Tier = "starter" | "growth" | "studio";

interface TierConfig {
  id: Tier;
  name: string;
  price: number;
  tagline: string;
  highlights: string[];
  highlighted?: boolean;
}

const TIERS: TierConfig[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    tagline: "For solo studio owners ready to get off group texts.",
    highlights: [
      "1 workspace",
      "Up to 5 active renters",
      "1 admin login",
      "Branded booking page",
      "Subdomain: yourname.alignworkspaces.com",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    tagline: "Built for growing studios running a real operation.",
    highlights: [
      "3 workspaces",
      "Unlimited active renters",
      "3 team seats",
      "Full custom branding",
      "Custom domain (bookings.yourstudio.com)",
    ],
    highlighted: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 299,
    tagline: "For multi-location operators and serious teams.",
    highlights: [
      "Unlimited workspaces",
      "Unlimited team seats",
      "White label (remove Align branding)",
      "API access",
      "Priority support",
    ],
  },
];

const INCLUDED_EVERYWHERE = [
  { icon: Calendar, label: "Calendar with double-booking prevention" },
  { icon: FileSignature, label: "Booking contracts & agreements" },
  { icon: Wallet, label: "Direct payouts via Stripe Connect" },
  { icon: MessageSquare, label: "In-app messaging" },
  { icon: RefreshCw, label: "Recurring bookings" },
  { icon: BellRing, label: "Automated reminders & arrival guides" },
  { icon: ShieldAlert, label: "Damage & incident logging" },
  { icon: BarChart3, label: "Revenue & utilization analytics" },
  { icon: UserCheck, label: "Guest booking without Align account" },
];

export default function StudiosPricingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  useEffect(() => {
    document.title = "For Studios | Align Workspaces";
    window.scrollTo(0, 0);
  }, []);

  const handleSubscribe = async (tier: Tier) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign in to start your trial",
        description: "Create an Align account or sign in first, then return here to pick a plan.",
      });
      // Take them to portal, which handles magic-link signin
      window.location.href = `/portal?redirect=${encodeURIComponent("/for-studios")}`;
      return;
    }

    setLoadingTier(tier);
    try {
      const res = await fetch("/api/saas/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Checkout failed");
      }
      const { url } = await res.json();
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Couldn't start checkout",
        description: err.message || "Try again in a moment.",
        variant: "destructive",
      });
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="sticky top-0 z-50 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">
            For Studios
          </span>
          <UserIndicator />
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-white border border-stone-200/80 text-[11px] tracking-[0.2em] uppercase text-[#c4956a] font-medium">
              <Sparkles className="w-3 h-3" />
              Now in early access
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-stone-900 leading-[1.1] tracking-tight mb-6">
              Run your workspace.<br />
              <span className="text-stone-400">Not your admin.</span>
            </h1>
            <p className="text-stone-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Booking, contracts, and payments for independent studio owners who bring their own clients. Calendars that don't double-book. Payouts that go direct to you. Admin that handles itself.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-stone-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                7-day free trial
              </span>
              <span className="hidden sm:inline text-stone-300">·</span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Cancel anytime
              </span>
              <span className="hidden sm:inline text-stone-300">·</span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                No transaction fees
              </span>
            </div>
          </motion.div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {TIERS.map((tier, idx) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`relative bg-white rounded-2xl border p-7 sm:p-8 flex flex-col ${
                  tier.highlighted
                    ? "border-[#c4956a] shadow-lg shadow-[#c4956a]/10 md:-translate-y-2"
                    : "border-stone-200/60"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#c4956a] text-white text-[10px] tracking-[0.2em] uppercase font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-serif text-2xl text-stone-900 mb-1">{tier.name}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed min-h-[40px]">{tier.tagline}</p>
                </div>
                <div className="mb-7">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-serif text-stone-900">${tier.price}</span>
                    <span className="text-stone-500 text-sm">/ month</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">Billed monthly after 7-day trial</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-sm text-stone-700">
                      <Check className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loadingTier !== null}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${
                    tier.highlighted
                      ? "bg-stone-900 text-white hover:bg-stone-800"
                      : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                  }`}
                >
                  {loadingTier === tier.id ? "Starting trial..." : "Start 7-day free trial"}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Every plan includes */}
        <section className="bg-white border-y border-stone-200/60">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <div className="text-center mb-12">
              <span className="text-[11px] tracking-[0.25em] uppercase text-[#c4956a] font-semibold">What's included</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 mt-3 mb-3">Every plan has the full toolkit.</h2>
              <p className="text-stone-500 max-w-xl mx-auto">
                We don't cripple the product at lower tiers. Every subscriber gets the same core tools to run a real studio.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {INCLUDED_EVERYWHERE.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl hover:bg-stone-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#faf9f7] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#c4956a]" />
                    </div>
                    <p className="text-sm text-stone-700 pt-2 leading-relaxed">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-3">Common questions</h2>
          </div>
          <div className="space-y-6">
            <Faq q="How is this different from listing on Align's marketplace?">
              The marketplace finds you new clients in exchange for a booking fee. This is for studio owners who already have their own clients and just want the software to manage them. No marketplace fees, no sharing revenue — a flat monthly subscription and your payouts go direct.
            </Faq>
            <Faq q="Do I need my own Stripe account?">
              Yes. During onboarding you'll connect your own Stripe account via Stripe Connect. Every booking payment flows directly to you — Align never touches the money.
            </Faq>
            <Faq q="What happens after the 7-day trial?">
              You'll be charged your plan's monthly price automatically. Cancel anytime before day 7 and you won't be charged. After the trial you can cancel anytime from your portal and keep access until the end of the billing period.
            </Faq>
            <Faq q="Can my renters bring their own clients?">
              Yes. That's the whole point. Each renter manages their own bookings and their own client relationships. You just provide the space and the infrastructure.
            </Faq>
            <Faq q="How long does setup take?">
              Most studios are fully onboarded in under an hour: connect Stripe, add your workspace, invite renters. Your branded booking page is live the same day.
            </Faq>
            <Faq q="Can I switch plans later?">
              Anytime. Upgrade or downgrade from the billing portal — changes are prorated automatically.
            </Faq>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-stone-900 text-white">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl mb-4">Stop running your studio from a group text.</h2>
            <p className="text-stone-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Seven days free. No credit surprises. Your renters and clients will notice the difference within a week.
            </p>
            <button
              onClick={() => handleSubscribe("growth")}
              disabled={loadingTier !== null}
              className="px-8 py-3.5 bg-[#c4956a] hover:bg-[#b48659] text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            >
              {loadingTier ? "Starting trial..." : "Start free trial"}
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-stone-200/80 pb-6">
      <summary className="cursor-pointer flex items-center justify-between gap-4 list-none">
        <span className="font-serif text-lg text-stone-900">{q}</span>
        <span className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 group-open:rotate-45 transition-transform">
          +
        </span>
      </summary>
      <p className="mt-4 text-stone-600 leading-relaxed text-sm sm:text-base">{children}</p>
    </details>
  );
}
