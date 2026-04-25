import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Globe, Lock } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const COMPARISON_ROWS = [
  { label: "Monthly cost", marketplace: "$0", saas: "$29 – $299" },
  { label: "Commission per booking", marketplace: "12.5%", saas: "0%" },
  { label: "Who brings clients", marketplace: "Align does", saas: "You do" },
  { label: "Listed publicly", marketplace: "Yes", saas: "No (private)" },
  { label: "Branded booking page", marketplace: "Align branded", saas: "Your branding" },
  { label: "Best when", marketplace: "Filling empty hours", saas: "Running existing clients" },
];

export default function HostLandingPage() {
  useEffect(() => {
    document.title = "List Your Space | Align Workspaces";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface-warm">
      <SiteHeader title="For Hosts" />

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-8 sm:pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-white border border-stone-200/80 text-[11px] tracking-[0.2em] uppercase text-[#c4956a] font-medium">
              <Sparkles className="w-3 h-3" />
              For space owners
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-stone-900 leading-[1.1] tracking-tight mb-6">
              List your space.<br />
              <span className="text-stone-400">Two ways.</span>
            </h1>
            <p className="text-stone-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Whether you want clients brought to your door, or you already have them and just need the software to run things — pick the path that fits.
            </p>
          </motion.div>
        </section>

        {/* Quick decision banner */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8 sm:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-stone-200/60 p-5 sm:p-6 text-center"
          >
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#c4956a] font-semibold mb-3">A 5-second decision</p>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
              <span className="font-semibold">Need clients?</span> Use the Marketplace.
              <span className="text-stone-300 mx-2">·</span>
              <span className="font-semibold">Already have clients?</span> Use Studio Software.
            </p>
          </motion.div>
        </section>

        {/* Two paths */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {/* Marketplace */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl border border-stone-200/60 p-7 sm:p-8 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-700 font-semibold">Marketplace</span>
                  <h2 className="font-serif text-2xl text-stone-900">List Publicly</h2>
                </div>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                Your space goes live on alignworkspaces.com. Miami's therapists, coaches, and wellness pros find and book your space directly.
              </p>

              <div className="bg-stone-50 rounded-xl p-4 mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-serif text-stone-900">$0</span>
                  <span className="text-stone-500 text-sm">/ month</span>
                </div>
                <p className="text-xs text-stone-500">Pay <span className="font-semibold text-stone-700">12.5% only when you book</span>. No upfront cost.</p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Free to list — no monthly fees, ever</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>We bring vetted Miami professionals</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Keep 87.5% (or 89.5% with your referral link)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Automatic Stripe payouts every hour</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Listed publicly on the Align marketplace</span>
                </li>
              </ul>

              <p className="text-xs text-stone-400 mb-3 text-center">Best for: empty space, building bookings</p>

              <Link
                href="/pricing"
                className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-stone-900 text-white hover:bg-stone-800 inline-flex items-center justify-center gap-2"
                data-testid="link-marketplace-cta"
              >
                See Earnings & List Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* SaaS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative bg-white rounded-2xl border-2 border-[#c4956a] shadow-lg shadow-[#c4956a]/10 p-7 sm:p-8 flex flex-col"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#c4956a] text-white text-[10px] tracking-[0.2em] uppercase font-semibold">
                Keep 100%
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#c4956a]/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-[#c4956a]" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#c4956a] font-semibold">Studio Software</span>
                  <h2 className="font-serif text-2xl text-stone-900">Run Privately</h2>
                </div>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">
                Get all the booking software (calendar, contracts, payments, branded page) for the clients you already have. No marketplace, no commission.
              </p>

              <div className="bg-[#c4956a]/5 rounded-xl p-4 mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-serif text-stone-900">$29</span>
                  <span className="text-stone-500 text-sm">+ / month</span>
                </div>
                <p className="text-xs text-stone-500"><span className="font-semibold text-stone-700">Keep 100%</span> of every booking. 0% commission.</p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
                  <span>Branded booking page (your logo, your colors)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
                  <span>Calendar with double-booking prevention</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
                  <span>Direct Stripe payouts — Align never touches the money</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
                  <span>Contracts, automated reminders, arrival guides</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
                  <span>14-day free trial — cancel anytime</span>
                </li>
              </ul>

              <p className="text-xs text-stone-400 mb-3 text-center">Best for: existing clients, want a real system</p>

              <Link
                href="/for-studios"
                className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-[#c4956a] text-white hover:bg-[#b48659] inline-flex items-center justify-center gap-2"
                data-testid="link-saas-cta"
              >
                See Plans & Start Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-white border-y border-stone-200/60">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
            <div className="text-center mb-10">
              <span className="text-[11px] tracking-[0.25em] uppercase text-[#c4956a] font-semibold">Side by side</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 mt-3">A clearer look</h2>
            </div>

            <div className="rounded-2xl border border-stone-200/60 overflow-hidden">
              <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200/60">
                <div className="p-3 sm:p-5"></div>
                <div className="p-3 sm:p-5 text-xs sm:text-sm font-semibold text-stone-900 text-center">Marketplace</div>
                <div className="p-3 sm:p-5 text-xs sm:text-sm font-semibold text-stone-900 text-center bg-[#c4956a]/5">Studio Software</div>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div key={row.label} className="grid grid-cols-3 border-b border-stone-100 last:border-b-0 text-xs sm:text-sm">
                  <div className="p-3 sm:p-5 font-medium text-stone-700">{row.label}</div>
                  <div className="p-3 sm:p-5 text-center text-stone-600">{row.marketplace}</div>
                  <div className="p-3 sm:p-5 text-center text-stone-600 bg-[#c4956a]/5">{row.saas}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-3">Common questions</h2>
          </div>
          <div className="space-y-6">
            <Faq q="Can I do both?">
              Yes. You can list one workspace publicly on the marketplace and run another privately on Studio Software — or even toggle a single workspace between public and private from your portal.
            </Faq>
            <Faq q="If I'm on the Marketplace, will Align take a cut of my own clients?">
              Only if they book through your public listing. Use your personal referral link to send your own clients through Align and the host fee drops from 12.5% to 10.5%. Or skip the marketplace entirely and use Studio Software for 0% on every booking.
            </Faq>
            <Faq q="What does the Marketplace cost upfront?">
              Nothing. No listing fees, no monthly subscription, no setup costs. You only pay a commission when you actually get a booking.
            </Faq>
            <Faq q="What does Studio Software cost?">
              $29/month for solo operators, up to $299/month for multi-location studios. There's a 14-day free trial — cancel before day 14 and you won't be charged.
            </Faq>
            <Faq q="Can I switch later?">
              Anytime. Start on the Marketplace to test demand, then switch to Studio Software once you have your own clients. Or vice versa.
            </Faq>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-stone-900 text-white">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl mb-4">Two paths. One platform.</h2>
            <p className="text-stone-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Pick the model that fits today. Switch when your business changes. Either way, your space starts earning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-white text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-100 transition-all"
                data-testid="link-final-marketplace"
              >
                List on Marketplace
              </Link>
              <Link
                href="/for-studios"
                className="px-6 py-3 bg-[#c4956a] text-white rounded-xl text-sm font-medium hover:bg-[#b48659] transition-all"
                data-testid="link-final-saas"
              >
                Try Studio Software
              </Link>
            </div>
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
