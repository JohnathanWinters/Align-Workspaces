import { useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { Link } from "wouter";
import { ArrowLeft, Shield, ShieldCheck, BadgeCheck, FileCheck, Heart, Briefcase, Leaf, Scissors, Building2, ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function TrustPage() {
  useEffect(() => {
    setPageMeta({
      title: "Trust & Safety | Align Workspaces",
      description: "How Align Workspaces protects hosts and guests. Insurance verification, professional use certifications, booking rules, and damage protection.",
      url: "https://alignworkspaces.com/trust",
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">Trust & Safety</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8">

        {/* Hero */}
        <section className="py-16 sm:py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2a2a2a] tracking-tight leading-tight mb-4">
            Your Space. Your Practice. Protected.
          </h1>
          <p className="text-stone-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Align Workspaces gives independent professionals the trust and safety infrastructure that used to be reserved for large organizations. Every host is insured. Every booking is documented. Every space is accountable.
          </p>
        </section>

        {/* How Align Protects Hosts */}
        <section className="pb-16 sm:pb-20">
          <div className="text-center mb-10">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">For Hosts</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]">How Align Protects Your Space</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: ShieldCheck, title: "Verified Insurance", desc: "Every host maintains $1M+ general liability insurance. Listings are automatically suspended if coverage lapses. Your documentation is stored securely and tracked for expiration." },
              { icon: FileCheck, title: "Booking Ruless", desc: "Every booking includes a mutual acknowledgment. Guests confirm responsibility for their conduct, their professional compliance, and any damage to the space." },
              { icon: Shield, title: "Damage Protection", desc: "If something goes wrong, our damage reporting tool lets you document issues with photos, notify the guest, and escalate to Align support within a structured resolution process." },
              { icon: BadgeCheck, title: "Professional Certifications", desc: "Certify your space for specific professional categories. Clinical Ready, Wellness Ready, Service Ready, and more. Attract the right professionals with clear trust signals." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-stone-100 p-6 sm:p-7">
                  <div className="w-11 h-11 rounded-lg bg-stone-900 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-stone-800 mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How Align Protects Guests */}
        <section className="pb-16 sm:pb-20">
          <div className="text-center mb-10">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">For Guests</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]">How Align Protects Your Practice</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: ShieldCheck, title: "Insured Spaces", desc: "Every workspace on Align is backed by verified host insurance. You never have to wonder if a space is covered." },
              { icon: BadgeCheck, title: "Certification Badges", desc: "Professional Use Certifications tell you exactly what a space is equipped for before you book. Soundproofing, running water, ventilation, whatever your profession requires." },
              { icon: FileCheck, title: "Clear Expectations", desc: "The Booking Rules confirms what the host has guaranteed about their space and what you're responsible for. No surprises on either side." },
              { icon: CheckCircle2, title: "Transparent Pricing", desc: "See the full price breakdown before you book. 7% service fee (5% for repeat guests). No hidden charges, no deposits, no membership." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-stone-100 p-6 sm:p-7">
                  <div className="w-11 h-11 rounded-lg bg-[#c4956a]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#c4956a]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-stone-800 mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Professional Use Certifications */}
        <section className="pb-16 sm:pb-20">
          <div className="text-center mb-10">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Certifications</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a] mb-3">Professional Use Certifications</h2>
            <p className="text-stone-500 text-sm max-w-lg mx-auto">Hosts self-certify their spaces across five professional tiers. Certifications describe the space, not the person booking it. Any professional can book any space.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: "Clinical Ready", desc: "Soundproofed, private, no surveillance. For therapists, counselors, psychologists, and social workers.", color: "bg-blue-50 text-blue-600", items: ["Private, sound-dampened session space", "No surveillance in session area", "Private or disclosed shared entry", "Secure network connection", "ADA accessible"] },
              { icon: Briefcase, title: "Consultation Ready", desc: "Professional meeting rooms with closable doors. For advisors, coaches, consultants, and attorneys.", color: "bg-amber-50 text-amber-600", items: ["Professional, client-facing environment", "Private space with closable door", "Reliable internet and power", "Adequate seating for capacity"] },
              { icon: Leaf, title: "Wellness Ready", desc: "Ventilation, sanitizable surfaces, changing areas. For bodyworkers, yoga instructors, and massage therapists.", color: "bg-emerald-50 text-emerald-600", items: ["Appropriate flooring and ventilation", "Adequate space dimensions", "Clean, sanitizable surfaces", "Private changing area or restroom"] },
              { icon: Scissors, title: "Service Ready", desc: "Running water, electrical capacity, health-code compliant. For barbers, stylists, and tattoo artists.", color: "bg-rose-50 text-rose-600", items: ["Proper ventilation per local code", "Running water and sanitation", "Adequate electrical capacity", "Easy-to-clean surfaces", "Health department compliant"] },
              { icon: Building2, title: "General Professional", desc: "Clean workspaces with internet and power. For photographers, podcasters, freelancers, and tutors.", color: "bg-stone-100 text-stone-600", items: ["Clean, maintained workspace", "Reliable internet and power", "Private or semi-private space", "Adequate for stated use case"] },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-stone-100 p-5 sm:p-6">
                  <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-stone-800 mb-1">{cat.title}</h3>
                  <p className="text-stone-400 text-xs leading-relaxed mb-3">{cat.desc}</p>
                  <ul className="space-y-1.5">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-stone-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#c4956a] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-stone-400 mt-6 max-w-lg mx-auto italic">
            Professional Use Certifications are self-reported by the Host and are not independently verified by Align Workspaces. Guests are responsible for independently confirming that a workspace meets their professional requirements before booking.
          </p>
        </section>

        {/* FAQ */}
        <section className="pb-16 sm:pb-20">
          <div className="text-center mb-10">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4956a] font-semibold block mb-2">Common Questions</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a]">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              { q: "What insurance do hosts need?", a: "All hosts must maintain active general liability insurance with a minimum coverage of $1,000,000 per occurrence. You upload proof of coverage during onboarding and we track expiration dates automatically." },
              { q: "What happens if a host's insurance expires?", a: "We send reminders at 30 days and 7 days before expiration. If coverage lapses, all of that host's listings are automatically suspended until valid documentation is provided." },
              { q: "Do guests need insurance?", a: "Guests who are licensed or regulated professionals are strongly encouraged to maintain their own professional liability insurance. The platform may require proof for certain certified spaces. All guests are responsible for insuring their own equipment and property." },
              { q: "What if something gets damaged during a booking?", a: "Hosts can file a damage report within 14 days of the booking with photos and a description. The guest is notified and has 72 hours to respond. If unresolved, the report escalates to Align support." },
              { q: "Who verifies Professional Use Certifications?", a: "Certifications are self-reported by hosts. Align does not independently verify them. Guests should independently confirm a space meets their professional requirements. We reserve the right to remove certifications if we receive credible reports of non-compliance." },
              { q: "What does the Booking Rules cover?", a: "Every booking includes a mutual acknowledgment where the host confirms their space is accurately described and insured, and the guest confirms responsibility for their conduct and professional compliance. This creates an audit trail for dispute resolution." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-100 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-[#c4956a] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-800 mb-2">{item.q}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <section className="pb-16 sm:pb-20 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2a2a2a] mb-3">Ready to Get Started?</h2>
          <p className="text-stone-500 text-sm mb-6 max-w-md mx-auto">Whether you have a space to share or a practice to build, Align has you covered.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/workspaces" className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
              Browse Workspaces <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/portal?tab=spaces" className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white/60 hover:border-stone-400 transition-colors">
              List Your Space <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/terms" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
              Read our full Terms of Service
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
