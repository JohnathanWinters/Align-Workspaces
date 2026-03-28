import { useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function TermsPage() {
  useEffect(() => {
    setPageMeta({
      title: "Terms of Service | Align Workspaces",
      description: "Terms of Service for Align Workspaces. Read about bookings, cancellations, host and guest obligations, and platform policies.",
      url: "https://alignworkspaces.com/terms",
    });
    window.scrollTo(0, 0);
  }, []);

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
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2a2a2a] mb-2">Terms of Service</h1>
        <p className="text-sm text-stone-400 mb-10">Last updated: March 27, 2026</p>

        <div className="prose prose-stone prose-sm max-w-none [&_h2]:font-serif [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#2a2a2a] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-stone-500 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-stone-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-stone-600 [&_li]:mb-1">

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Align Workspaces ("Platform"), <strong>you agree to be bound by these Terms of Service ("Terms")</strong>. If you do not agree to these Terms, do not use the Platform. <strong>You must be at least 18 years of age to use the Platform.</strong></p>
          <p>Align Workspaces reserves the right to update these Terms at any time. We will notify registered users of material changes via email. <strong>Your continued use of the Platform after such changes constitutes acceptance of the updated Terms.</strong></p>

          <h2>2. Definitions</h2>
          <p><strong>"Platform"</strong> means the Align Workspaces website, applications, and all related services.</p>
          <p><strong>"Host"</strong> means a user who lists one or more workspaces for booking on the Platform.</p>
          <p><strong>"Guest"</strong> means a user who books or uses a workspace through the Platform.</p>
          <p><strong>"Booking"</strong> means a confirmed reservation for a specific workspace, date, time, and duration.</p>
          <p><strong>"Content"</strong> means any text, photos, reviews, messages, or other materials posted by users.</p>
          <p><strong>"Service Fee"</strong> means the fees charged by Align Workspaces for facilitating transactions.</p>
          <p><strong>"Space License"</strong> means the revocable, non-exclusive license granted by a Host to a Guest for the booked period. <strong>THIS IS NOT A LEASE OR ANY INTEREST IN REAL PROPERTY.</strong></p>

          <h2>3. Platform Role</h2>
          <p><strong>Align Workspaces is a marketplace intermediary.</strong> We are not a workspace owner, operator, landlord, real estate broker, or employer of any Host or Guest. The Platform facilitates connections between Hosts and Guests but does not provide workspace services itself.</p>
          <p>When Hosts and Guests enter into Bookings, they enter into a direct contractual relationship with each other. <strong>Align Workspaces is not a party to that agreement.</strong> The arrangement between a Host and Guest creates a revocable license to occupy, not a lease or any other interest in real property.</p>
          <p><strong>Align Workspaces does not endorse, verify, or guarantee any listing, workspace, Host, or Guest.</strong> We make no representations about the safety, suitability, legality, or quality of any workspace or service provided through the Platform.</p>

          <h2>4. User Accounts</h2>
          <p>To use certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information. <strong>You are responsible for maintaining the security of your account credentials and for all activity under your account.</strong></p>
          <p>Align Workspaces reserves the right to <strong>suspend or terminate accounts at its sole discretion</strong>, including for violation of these Terms, fraudulent activity, or conduct that we determine is harmful to other users or the Platform.</p>

          <h2>5. Host Obligations</h2>
          <p>As a Host, you represent and warrant that:</p>
          <ul>
            <li><strong>You have the legal authority to list the workspace</strong> (you own it or have written permission from the owner).</li>
            <li>Your listing descriptions, photos, and amenities are accurate and not misleading.</li>
            <li>Your workspace complies with all applicable laws, regulations, zoning requirements, and building codes.</li>
            <li><strong>You are solely responsible for the condition, safety, maintenance, and legal compliance of your workspace</strong>, including ADA accessibility requirements.</li>
            <li>You will disclose any surveillance devices present in or around the workspace.</li>
            <li><strong>You maintain appropriate liability insurance for your workspace.</strong></li>
            <li>You are responsible for determining and paying all applicable taxes related to your Host earnings.</li>
          </ul>

          <h2>6. Guest Obligations</h2>
          <p>As a Guest, you agree that:</p>
          <ul>
            <li>You will use workspaces in accordance with the listing description and any Host rules.</li>
            <li>You are responsible for your conduct and the conduct of anyone you bring to the workspace.</li>
            <li><strong>You are liable for any damage you or your invitees cause to the workspace or its contents.</strong></li>
            <li><strong>You will not use workspaces for illegal activities.</strong></li>
            <li>You will leave the workspace in the condition you found it.</li>
            <li>You are responsible for verifying your own compliance with professional licensing requirements applicable to your practice.</li>
          </ul>

          <h2>7. Bookings and Payments</h2>
          <p>All payments are processed through Stripe, our third-party payment processor. Align Workspaces acts as the Host's limited payment collection agent solely for the purpose of accepting payments from Guests on the Host's behalf.</p>
          <p><strong>By making a Booking, you authorize Align Workspaces to charge the payment method on file.</strong> Hosts will receive payouts according to the Platform's payout schedule, less applicable Service Fees.</p>
          <p>For complete payment processing terms, please refer to the <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe Connected Account Agreement</a>.</p>

          <h2>8. Cancellation and Refunds</h2>
          <p>Cancellation policies are set by individual Hosts and displayed on each listing. The applicable cancellation policy is shown before you confirm a Booking.</p>
          <ul>
            <li><strong>24+ hours before start time:</strong> Eligible for a full refund per the Host's policy.</li>
            <li><strong>Less than 24 hours:</strong> Non-refundable per standard policy.</li>
            <li><strong>Host-initiated cancellation:</strong> Guest receives a full refund. Hosts who cancel confirmed Bookings may face penalties including listing demotion or account suspension.</li>
            <li><strong>No-shows:</strong> Guests who do not arrive forfeit payment. Hosts who are unavailable for confirmed Bookings must provide a full refund.</li>
          </ul>
          <p>Refunds are processed to the original payment method within 5-10 business days.</p>

          <h2>9. Non-Circumvention</h2>
          <p>Users may not use contact information obtained through the Platform to transact outside the Platform in order to avoid paying Service Fees. <strong>If you are found to have circumvented the Platform, you agree to pay Align Workspaces an amount equal to 30% of the booking subtotal as liquidated damages.</strong></p>

          <h2>10. User-Generated Content</h2>
          <p>You retain ownership of Content you post on the Platform. <strong>By posting Content, you grant Align Workspaces a non-exclusive, worldwide, royalty-free, perpetual license</strong> to use, copy, modify, display, distribute, and sublicense your Content for the purpose of operating and marketing the Platform.</p>
          <p>You represent that you have the right to post your Content and that it does not infringe any third-party rights. Align Workspaces may remove Content at its sole discretion.</p>

          <h2>11. Professional Use Disclaimer</h2>
          <p>The Platform makes no representations about the professional credentials, licenses, or qualifications of any Host or Guest. <strong>Users who are licensed professionals (therapists, counselors, coaches, etc.) are solely responsible for their own professional compliance.</strong> Align Workspaces is not responsible for any professional malpractice or misconduct that occurs in booked workspaces.</p>

          <h2>12. DISCLAIMER OF WARRANTIES</h2>
          <p className="uppercase text-xs leading-relaxed"><strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. ALIGN WORKSPACES DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. ALIGN WORKSPACES DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. ALIGN WORKSPACES DOES NOT ENDORSE OR WARRANT THE EXISTENCE, CONDUCT, PERFORMANCE, SAFETY, QUALITY, LEGALITY, OR SUITABILITY OF ANY GUEST, HOST, WORKSPACE, LISTING, OR HOST SERVICE.</strong></p>

          <h2>13. LIMITATION OF LIABILITY</h2>
          <p className="uppercase text-xs leading-relaxed"><strong>IN NO EVENT SHALL ALIGN WORKSPACES' AGGREGATE LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE AMOUNTS PAID BY YOU TO ALIGN WORKSPACES IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.</strong></p>
          <p className="uppercase text-xs leading-relaxed"><strong>ALIGN WORKSPACES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF ALIGN WORKSPACES HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</strong></p>

          <h2>14. Indemnification</h2>
          <p><strong>You agree to indemnify, defend, and hold harmless Align Workspaces</strong>, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in connection with: (i) your breach of these Terms; (ii) your use of the Platform; (iii) your interaction with any other user or use of any workspace; (iv) any damage you cause to a workspace; (v) your violation of any applicable law or regulation; (vi) your Content.</p>
          <p>As a Host, you additionally agree to indemnify Align Workspaces from claims arising from: the condition, safety, or legality of your workspace; your failure to comply with applicable laws; any injury, loss, or damage to a Guest or their property occurring at your workspace.</p>

          <h2>15. Dispute Resolution</h2>
          <p>In the event of a dispute between a Host and Guest, users agree to first attempt resolution directly through Platform messaging. If direct resolution fails, Align Workspaces support may review the dispute and make a determination. <strong>The Platform's determination on disputes between Hosts and Guests is final.</strong></p>
          <p>For disputes between a user and Align Workspaces, <strong>you agree to binding arbitration on an individual basis. You waive any right to participate in a class action or class arbitration.</strong> Arbitration shall be conducted under the rules of the American Arbitration Association. This arbitration provision may be opted out of within 30 days of account creation by sending written notice to hello@alignworkspaces.com.</p>

          <h2>16. Insurance</h2>
          <p><strong>Hosts are responsible for maintaining their own liability insurance</strong> covering their workspace. Guests are responsible for insuring their own personal property. <strong>Align Workspaces does not provide insurance coverage</strong> for Hosts, Guests, or workspaces. We make no representations about the adequacy of any insurance.</p>

          <h2>17. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the <strong>laws of the State of Florida</strong>, without regard to its conflict of law provisions. Any legal action permitted outside of arbitration shall be brought in the courts of <strong>Miami-Dade County, Florida</strong>.</p>

          <h2>18. General</h2>
          <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect. Align Workspaces' failure to enforce any right does not constitute a waiver. <strong>These Terms constitute the entire agreement between you and Align Workspaces.</strong> Align Workspaces may assign these Terms; you may not.</p>

          <h2>19. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:hello@alignworkspaces.com">hello@alignworkspaces.com</a>.</p>
          <p>Align Workspaces<br />Miami, FL</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
