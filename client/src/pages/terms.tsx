import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { AnimatePresence, motion } from "framer-motion";

interface Section {
  title: string;
  synopsis: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    title: "1. Acceptance of Terms",
    synopsis: "By using Align Workspaces you agree to these terms. You must be 18+.",
    content: (
      <>
        <p>By accessing or using Align Workspaces ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. You must be at least 18 years of age to use the Platform.</p>
        <p>Align Workspaces reserves the right to update these Terms at any time. We will notify registered users of material changes via email. Your continued use of the Platform after such changes constitutes acceptance of the updated Terms.</p>
      </>
    ),
  },
  {
    title: "2. Definitions",
    synopsis: "Key terms like Platform, Host, Guest, Booking, and Service Fee explained.",
    content: (
      <>
        <p><strong>"Platform"</strong> means the Align Workspaces website, applications, and all related services.</p>
        <p><strong>"Host"</strong> means a user who lists one or more workspaces for booking on the Platform.</p>
        <p><strong>"Guest"</strong> means a user who books or uses a workspace through the Platform.</p>
        <p><strong>"Booking"</strong> means a confirmed reservation for a specific workspace, date, time, and duration.</p>
        <p><strong>"Content"</strong> means any text, photos, reviews, messages, or other materials posted by users.</p>
        <p><strong>"Service Fee"</strong> means the fees charged by Align Workspaces for facilitating transactions.</p>
        <p><strong>"Space License"</strong> means the revocable, non-exclusive license granted by a Host to a Guest for the booked period. THIS IS NOT A LEASE OR ANY INTEREST IN REAL PROPERTY.</p>
      </>
    ),
  },
  {
    title: "3. Platform Role",
    synopsis: "Align Workspaces is a marketplace, not a landlord, employer, or workspace operator.",
    content: (
      <>
        <p><strong>Align Workspaces is a marketplace intermediary.</strong> We are not a workspace owner, operator, landlord, real estate broker, or employer of any Host or Guest. The Platform facilitates connections between Hosts and Guests but does not provide workspace services itself.</p>
        <p>When Hosts and Guests enter into Bookings, they enter into a direct contractual relationship with each other. Align Workspaces is not a party to that agreement. The arrangement between a Host and Guest creates a revocable license to occupy, not a lease or any other interest in real property.</p>
        <p>Align Workspaces does not endorse, verify, or guarantee any listing, workspace, Host, or Guest. We make no representations about the safety, suitability, legality, or quality of any workspace or service provided through the Platform.</p>
      </>
    ),
  },
  {
    title: "4. User Accounts",
    synopsis: "You must provide accurate info and keep your account secure.",
    content: (
      <>
        <p>To use certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>
        <p>Align Workspaces reserves the right to suspend or terminate accounts at its sole discretion, including for violation of these Terms, fraudulent activity, or conduct that we determine is harmful to other users or the Platform.</p>
      </>
    ),
  },
  {
    title: "5. Host Obligations",
    synopsis: "Hosts must have legal authority, accurate listings, and proper insurance.",
    content: (
      <>
        <p>As a Host, you represent and warrant that:</p>
        <ul>
          <li>You have the legal authority to list the workspace (you own it or have written permission from the owner).</li>
          <li>Your listing descriptions, photos, and amenities are accurate and not misleading.</li>
          <li>Your workspace complies with all applicable laws, regulations, zoning requirements, and building codes.</li>
          <li>You are solely responsible for the condition, safety, maintenance, and legal compliance of your workspace, including ADA accessibility requirements.</li>
          <li>You will disclose any surveillance devices present in or around the workspace.</li>
          <li>You maintain appropriate liability insurance for your workspace.</li>
          <li>You are responsible for determining and paying all applicable taxes related to your Host earnings.</li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Guest Obligations",
    synopsis: "Guests must follow workspace rules, avoid illegal activity, and cover any damage.",
    content: (
      <>
        <p>As a Guest, you agree that:</p>
        <ul>
          <li>You will use workspaces in accordance with the listing description and any Host rules.</li>
          <li>You are responsible for your conduct and the conduct of anyone you bring to the workspace.</li>
          <li>You are liable for any damage you or your invitees cause to the workspace or its contents.</li>
          <li>You will not use workspaces for illegal activities.</li>
          <li>You will leave the workspace in the condition you found it.</li>
          <li>You are responsible for verifying your own compliance with professional licensing requirements applicable to your practice.</li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Bookings and Payments",
    synopsis: "Payments are processed through Stripe. Hosts receive payouts minus service fees.",
    content: (
      <>
        <p>All payments are processed through Stripe, our third-party payment processor. Align Workspaces acts as the Host's limited payment collection agent solely for the purpose of accepting payments from Guests on the Host's behalf.</p>
        <p>By making a Booking, you authorize Align Workspaces to charge the payment method on file. Hosts will receive payouts according to the Platform's payout schedule, less applicable Service Fees.</p>
        <p>For complete payment processing terms, please refer to the <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe Connected Account Agreement</a>.</p>
      </>
    ),
  },
  {
    title: "8. Cancellation and Refunds",
    synopsis: "Cancellation policies vary by Host. Full refund if 24+ hours out; no refund under 24 hours.",
    content: (
      <>
        <p>Cancellation policies are set by individual Hosts and displayed on each listing. The applicable cancellation policy is shown before you confirm a Booking.</p>
        <ul>
          <li><strong>24+ hours before start time:</strong> Eligible for a full refund per the Host's policy.</li>
          <li><strong>Less than 24 hours:</strong> Non-refundable per standard policy.</li>
          <li><strong>Host-initiated cancellation:</strong> Guest receives a full refund. Hosts who cancel confirmed Bookings may face penalties including listing demotion or account suspension.</li>
          <li><strong>No-shows:</strong> Guests who do not arrive forfeit payment. Hosts who are unavailable for confirmed Bookings must provide a full refund.</li>
        </ul>
        <p>Refunds are processed to the original payment method within 5-10 business days.</p>
      </>
    ),
  },
  {
    title: "9. Non-Circumvention",
    synopsis: "Don't take transactions off-platform to avoid fees, 30% liquidated damages apply.",
    content: (
      <p>Users may not use contact information obtained through the Platform to transact outside the Platform in order to avoid paying Service Fees. If you are found to have circumvented the Platform, you agree to pay Align Workspaces an amount equal to 30% of the booking subtotal as liquidated damages.</p>
    ),
  },
  {
    title: "10. User-Generated Content",
    synopsis: "You own your content but grant us a license to use it for operating the platform.",
    content: (
      <>
        <p>You retain ownership of Content you post on the Platform. By posting Content, you grant Align Workspaces a non-exclusive, worldwide, royalty-free, perpetual license to use, copy, modify, display, distribute, and sublicense your Content for the purpose of operating and marketing the Platform.</p>
        <p>You represent that you have the right to post your Content and that it does not infringe any third-party rights. Align Workspaces may remove Content at its sole discretion.</p>
      </>
    ),
  },
  {
    title: "11. Professional Use Disclaimer",
    synopsis: "Licensed professionals are responsible for their own compliance and credentials.",
    content: (
      <p>The Platform makes no representations about the professional credentials, licenses, or qualifications of any Host or Guest. Users who are licensed professionals (therapists, counselors, coaches, etc.) are solely responsible for their own professional compliance. Align Workspaces is not responsible for any professional malpractice or misconduct that occurs in booked workspaces.</p>
    ),
  },
  {
    title: "12. Disclaimer of Warranties",
    synopsis: "The platform is provided \"as is\" with no guarantees of any kind.",
    content: (
      <p className="uppercase text-xs leading-relaxed"><strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. ALIGN WORKSPACES DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. ALIGN WORKSPACES DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. ALIGN WORKSPACES DOES NOT ENDORSE OR WARRANT THE EXISTENCE, CONDUCT, PERFORMANCE, SAFETY, QUALITY, LEGALITY, OR SUITABILITY OF ANY GUEST, HOST, WORKSPACE, LISTING, OR HOST SERVICE.</strong></p>
    ),
  },
  {
    title: "13. Limitation of Liability",
    synopsis: "Our liability is capped at what you paid us in the last 12 months or $100.",
    content: (
      <>
        <p className="uppercase text-xs leading-relaxed"><strong>IN NO EVENT SHALL ALIGN WORKSPACES' AGGREGATE LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE AMOUNTS PAID BY YOU TO ALIGN WORKSPACES IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.</strong></p>
        <p className="uppercase text-xs leading-relaxed"><strong>ALIGN WORKSPACES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF ALIGN WORKSPACES HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</strong></p>
      </>
    ),
  },
  {
    title: "14. Indemnification",
    synopsis: "You agree to cover our legal costs if your actions cause a claim against us.",
    content: (
      <>
        <p>You agree to indemnify, defend, and hold harmless Align Workspaces, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in connection with: (i) your breach of these Terms; (ii) your use of the Platform; (iii) your interaction with any other user or use of any workspace; (iv) any damage you cause to a workspace; (v) your violation of any applicable law or regulation; (vi) your Content.</p>
        <p>As a Host, you additionally agree to indemnify Align Workspaces from claims arising from: the condition, safety, or legality of your workspace; your failure to comply with applicable laws; any injury, loss, or damage to a Guest or their property occurring at your workspace.</p>
      </>
    ),
  },
  {
    title: "15. Dispute Resolution",
    synopsis: "Resolve disputes through the platform first, then binding individual arbitration.",
    content: (
      <>
        <p>In the event of a dispute between a Host and Guest, users agree to first attempt resolution directly through Platform messaging. If direct resolution fails, Align Workspaces support may review the dispute and make a determination. The Platform's determination on disputes between Hosts and Guests is final.</p>
        <p>For disputes between a user and Align Workspaces, you agree to binding arbitration on an individual basis. You waive any right to participate in a class action or class arbitration. Arbitration shall be conducted under the rules of the American Arbitration Association. This arbitration provision may be opted out of within 30 days of account creation by sending written notice to hello@alignworkspaces.com.</p>
      </>
    ),
  },
  {
    title: "16. Insurance",
    synopsis: "Hosts insure their spaces, guests insure their belongings, we provide no coverage.",
    content: (
      <p>Hosts are responsible for maintaining their own liability insurance covering their workspace. Guests are responsible for insuring their own personal property. Align Workspaces does not provide insurance coverage for Hosts, Guests, or workspaces. We make no representations about the adequacy of any insurance.</p>
    ),
  },
  {
    title: "17. Governing Law",
    synopsis: "Florida law applies. Legal actions go through Miami-Dade County courts.",
    content: (
      <p>These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any legal action permitted outside of arbitration shall be brought in the courts of Miami-Dade County, Florida.</p>
    ),
  },
  {
    title: "18. General",
    synopsis: "Unenforceable provisions don't void the rest. These terms are the full agreement.",
    content: (
      <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect. Align Workspaces' failure to enforce any right does not constitute a waiver. These Terms constitute the entire agreement between you and Align Workspaces. Align Workspaces may assign these Terms; you may not.</p>
    ),
  },
  {
    title: "19. Contact",
    synopsis: "Reach us at hello@alignworkspaces.com in Miami, FL.",
    content: (
      <>
        <p>For questions about these Terms, contact us at <a href="mailto:hello@alignworkspaces.com">hello@alignworkspaces.com</a>.</p>
        <p>Align Workspaces<br />Miami, FL</p>
      </>
    ),
  },
];

function SectionAccordion({ section, isOpen, onToggle }: { section: Section; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-stone-200/60 rounded-xl bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-stone-50/50 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base sm:text-lg text-[#2a2a2a] leading-snug">{section.title}</h2>
          <AnimatePresence initial={false}>
            {!isOpen && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-stone-400 mt-1 leading-relaxed"
              >
                {section.synopsis}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pl-12 prose prose-stone prose-sm max-w-none [&_p]:text-stone-600 [&_p]:leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:text-stone-600 [&_li]:mb-1 [&_a]:text-[#c4956a] [&_a]:underline [&_a:hover]:text-[#a07a54]">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TermsPage() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    document.title = "Terms of Service | Align Workspaces";
    window.scrollTo(0, 0);
  }, []);

  const toggle = (index: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const allOpen = openSections.size === sections.length;

  const toggleAll = () => {
    if (allOpen) setOpenSections(new Set());
    else setOpenSections(new Set(sections.map((_, i) => i)));
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="sticky top-0 z-50 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">Legal</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2a2a2a] mb-2">Terms of Service</h1>
            <p className="text-sm text-stone-400">Last updated: March 27, 2026</p>
          </div>
          <button
            onClick={toggleAll}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {sections.map((section, i) => (
            <SectionAccordion
              key={i}
              section={section}
              isOpen={openSections.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
