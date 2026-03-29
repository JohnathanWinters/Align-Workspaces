import { useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function TermsPage() {
  useEffect(() => {
    setPageMeta({
      title: "Terms of Service | Align Workspaces",
      description: "Terms of Service for Align Workspaces. Read about bookings, cancellations, host and guest obligations, insurance requirements, professional use certifications, and platform policies.",
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
        <p className="text-sm text-stone-400 mb-10">Last updated: March 2026</p>

        <div className="prose prose-stone prose-sm max-w-none [&_h2]:font-serif [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#2a2a2a] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-stone-500 [&_h3]:mt-6 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-[#2a2a2a] [&_h4]:mt-4 [&_h4]:mb-2 [&_p]:text-stone-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-stone-600 [&_li]:mb-1 [&_ol]:text-stone-600">

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Align Workspaces ("Platform"), <strong>you agree to be bound by these Terms of Service ("Terms")</strong>. If you do not agree to these Terms, do not use the Platform. <strong>You must be at least 18 years of age to use the Platform.</strong></p>
          <p>Align Workspaces reserves the right to update these Terms at any time. We will notify registered users of material changes via email. <strong>Your continued use of the Platform after such changes constitutes acceptance of the updated Terms.</strong></p>

          <h2>2. Definitions</h2>
          <p><strong>"Platform"</strong> means the Align Workspaces website, applications, and all related services.</p>
          <p><strong>"Host"</strong> means a user who lists one or more workspaces for booking on the Platform.</p>
          <p><strong>"Guest"</strong> means a user who books or uses a workspace through the Platform, regardless of their profession, industry, or intended use.</p>
          <p><strong>"Booking"</strong> means a confirmed reservation for a specific workspace, date, time, and duration.</p>
          <p><strong>"Booking Agreement"</strong> means the mutual acknowledgment executed by both Host and Guest at the time of each Booking, incorporating these Terms and any additional conditions specific to the reserved workspace.</p>
          <p><strong>"Content"</strong> means any text, photos, reviews, messages, or other materials posted by users.</p>
          <p><strong>"Service Fee"</strong> means the fees charged by Align Workspaces for facilitating transactions.</p>
          <p><strong>"Space License"</strong> means the revocable, non-exclusive license granted by a Host to a Guest for the booked period. <strong>THIS IS NOT A LEASE OR ANY INTEREST IN REAL PROPERTY.</strong></p>
          <p><strong>"Professional Use Certification"</strong> means a Host's voluntary self-certification that their workspace meets specific standards for a designated professional category. Current categories include Clinical Ready, Consultation Ready, Wellness Ready, Service Ready, and General Professional. Certifications describe the space, not the credentials of the person booking it.</p>
          <p><strong>"Host Protection Plan"</strong> means the optional damage protection coverage available to Hosts through the Platform, subject to separate plan terms.</p>
          <p><strong>"Insurance Verification"</strong> means the process by which Hosts provide proof of active liability insurance coverage as a condition of listing on the Platform.</p>

          <h2>3. Platform Role</h2>
          <p><strong>Align Workspaces is a marketplace intermediary.</strong> We are not a workspace owner, operator, landlord, real estate broker, or employer of any Host or Guest. The Platform facilitates connections between Hosts and Guests but does not provide workspace services itself.</p>
          <p>When Hosts and Guests enter into Bookings, they enter into a direct contractual relationship with each other. <strong>Align Workspaces is not a party to that agreement.</strong> The arrangement between a Host and Guest creates a revocable license to occupy, not a lease or any other interest in real property.</p>
          <p><strong>Align Workspaces does not endorse, verify, or guarantee any listing, workspace, Host, or Guest.</strong> We make no representations about the safety, suitability, legality, or quality of any workspace or service provided through the Platform. Professional Use Certifications are Host self-declarations and are not independently verified by Align Workspaces. A Professional Use Certification describes the features of the space and does not constitute a representation about the qualifications, credentials, or intentions of any Guest who books that space.</p>

          <h2>4. User Accounts</h2>
          <p>To use certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information. <strong>You are responsible for maintaining the security of your account credentials and for all activity under your account.</strong></p>
          <p>Align Workspaces reserves the right to <strong>suspend or terminate accounts at its sole discretion</strong>, including for violation of these Terms, fraudulent activity, failure to maintain required insurance documentation, or conduct that we determine is harmful to other users or the Platform.</p>

          <h2>5. Host Obligations</h2>
          <p>As a Host, you represent and warrant that:</p>
          <ol>
            <li><strong>You have the legal authority to list the workspace</strong> (you own it or have written permission from the owner).</li>
            <li>Your listing descriptions, photos, and amenities are accurate and not misleading.</li>
            <li>Your workspace complies with all applicable laws, regulations, zoning requirements, building codes, and health department requirements applicable to the services you are permitting in the space.</li>
            <li><strong>You are solely responsible for the condition, safety, maintenance, and legal compliance of your workspace</strong>, including ADA accessibility requirements.</li>
            <li>You will disclose any surveillance devices present in or around the workspace.</li>
            <li><strong>You maintain appropriate liability insurance for your workspace</strong> and will provide proof of coverage as required by the Platform (see Section 14).</li>
            <li>You are responsible for determining and paying all applicable taxes related to your Host earnings.</li>
            <li>If you elect to obtain a Professional Use Certification for your workspace, you are solely responsible for the accuracy of that certification and for maintaining the stated conditions at all times the workspace is available for booking.</li>
            <li>You will accurately represent the suitability of your workspace for specific professional uses and will disclose any known limitations that could affect a Guest's ability to conduct their professional activities, including but not limited to soundproofing limitations, shared entry points, ventilation constraints, plumbing or water access, electrical capacity, and network security configurations.</li>
            <li>If your space is used for services that require specific health, safety, or sanitation standards (such as barbering, cosmetology, bodywork, food preparation, or similar regulated services), you are solely responsible for ensuring the space meets those standards as required by applicable local and state regulations.</li>
          </ol>

          <h2>6. Guest Obligations</h2>
          <p>As a Guest, you agree that:</p>
          <ol>
            <li>You will use workspaces in accordance with the listing description and any Host rules.</li>
            <li>You are responsible for your conduct and the conduct of anyone you bring to the workspace.</li>
            <li><strong>You are liable for any damage you or your invitees cause to the workspace or its contents.</strong></li>
            <li><strong>You will not use workspaces for illegal activities.</strong></li>
            <li>You will leave the workspace in the condition you found it.</li>
            <li>You are solely responsible for verifying your own compliance with all professional licensing, regulatory, health department, and ethical requirements applicable to your practice or business activities, including but not limited to client privacy, recordkeeping, sanitation standards, and confidentiality obligations.</li>
            <li>If your professional practice or business requires specific environmental conditions (e.g., soundproofing, private entry, secure network access, ventilation, running water, specialized electrical), you are responsible for independently verifying that a workspace meets those requirements before booking, regardless of any Professional Use Certification displayed on the listing.</li>
            <li>You will maintain your own professional liability, malpractice, or errors and omissions insurance if required by your licensure, professional standards, or industry norms, and you may be asked to provide proof of coverage through the Platform.</li>
            <li>You are responsible for obtaining and maintaining any permits, licenses, or approvals required to conduct your specific business activities at the booked location.</li>
            <li>A Professional Use Certification on a listing describes the features of the space. It does not guarantee the space is compliant with the specific regulatory requirements of your profession or jurisdiction. You are solely responsible for making that determination.</li>
          </ol>

          <h2>7. Booking Agreement</h2>
          <p>Each Booking on the Platform incorporates a Booking Agreement between the Host and Guest. By confirming a Booking, both parties acknowledge and agree to the following:</p>

          <h4>Host Acknowledgment</h4>
          <p>The Host confirms that the workspace is accurately described in the listing, is maintained in safe and functional condition, is covered by active liability insurance, and meets any Professional Use Certification standards the Host has elected, if applicable.</p>

          <h4>Guest Acknowledgment</h4>
          <p>The Guest confirms that they accept responsibility for their own professional conduct and the conduct of any individuals they bring to the workspace, that they carry their own professional liability or business insurance if required by their profession or industry, that they have independently evaluated the workspace for suitability to their professional and regulatory needs, that they will comply with all applicable laws and regulations in connection with their use of the space, and that they will report any damage or safety concerns to the Host and to Align Workspaces promptly.</p>

          <h4>Mutual Acknowledgment</h4>
          <p>Both parties acknowledge that Align Workspaces is a marketplace facilitator and is not a party to the Booking Agreement. The Host bears responsibility for premises liability and the condition of the space. The Guest bears responsibility for professional liability, regulatory compliance, and their use of the space. Neither party may hold Align Workspaces liable for the actions, omissions, or representations of the other party.</p>

          <h2>8. Payments and Processing</h2>
          <p>All payments are processed through Stripe, our third-party payment processor. Align Workspaces acts as the Host's limited payment collection agent solely for the purpose of accepting payments from Guests on the Host's behalf.</p>
          <p><strong>By making a Booking, you authorize Align Workspaces to charge the payment method on file.</strong> Hosts will receive payouts according to the Platform's payout schedule, less applicable Service Fees.</p>
          <p>For complete payment processing terms, please refer to the <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe Connected Account Agreement</a>.</p>

          <h2>9. Cancellation and Refunds</h2>
          <p>Cancellation policies are set by individual Hosts and displayed on each listing. The applicable cancellation policy is shown before you confirm a Booking.</p>
          <ul>
            <li><strong>24+ hours before start time:</strong> Eligible for a full refund per the Host's policy.</li>
            <li><strong>Less than 24 hours:</strong> Non-refundable per standard policy.</li>
            <li><strong>Host-initiated cancellation:</strong> Guest receives a full refund. Hosts who cancel confirmed Bookings may face penalties including listing demotion or account suspension.</li>
            <li><strong>No-shows:</strong> Guests who do not arrive forfeit payment. Hosts who are unavailable for confirmed Bookings must provide a full refund.</li>
          </ul>
          <p>Refunds are processed to the original payment method within 5 to 10 business days.</p>

          <h2>10. Non-Circumvention</h2>
          <p>Users may not use contact information obtained through the Platform to transact outside the Platform in order to avoid paying Service Fees. <strong>If you are found to have circumvented the Platform, you agree to pay Align Workspaces an amount equal to 30% of the booking subtotal as liquidated damages.</strong></p>

          <h2>11. User-Generated Content</h2>
          <p>You retain ownership of Content you post on the Platform. <strong>By posting Content, you grant Align Workspaces a non-exclusive, worldwide, royalty-free, perpetual license</strong> to use, copy, modify, display, distribute, and sublicense your Content for the purpose of operating and marketing the Platform.</p>
          <p>You represent that you have the right to post your Content and that it does not infringe any third-party rights. Align Workspaces may remove Content at its sole discretion.</p>

          <h2>12. Professional Use Disclaimer</h2>
          <p>The Platform serves professionals across all industries, including but not limited to licensed therapists, counselors, holistic health practitioners, barbers, stylists, estheticians, real estate agents, coaches, consultants, attorneys, accountants, fitness instructors, bodyworkers, tattoo artists, photographers, podcasters, and any other small business professional who needs flexible workspace.</p>
          <p><strong>Align Workspaces makes no representations about the professional credentials, licenses, permits, or qualifications of any Host or Guest.</strong> Users who are licensed, certified, or regulated professionals are solely responsible for their own compliance, including adherence to applicable federal, state, and local licensing requirements, professional ethical standards, privacy and confidentiality obligations (including but not limited to HIPAA, state privacy laws, and professional board regulations), health department and sanitation standards, continuing education requirements, scope-of-practice limitations, and any permits or approvals required to operate at a given location.</p>
          <p>Align Workspaces is not responsible for any professional malpractice, misconduct, regulatory violation, health code violation, or breach of professional duty that occurs in booked workspaces. The Platform does not verify, monitor, or enforce any Guest's compliance with the regulatory requirements of their profession.</p>

          <h2>13. Professional Use Certifications</h2>
          <p>Hosts may voluntarily self-certify their workspace for specific professional use categories. Certifications describe the features and suitability of the space itself. They do not restrict who may book the space, and they do not represent anything about the credentials or qualifications of any Guest. Any Guest may book any space regardless of its certification status.</p>
          <p>Current certification categories include:</p>

          <h3>Clinical Ready</h3>
          <p>For workspaces designed to support licensed therapists, counselors, psychologists, psychiatrists, social workers, and similar mental health professionals. Certification criteria include:</p>
          <ul>
            <li>Private, soundproofed or sound-dampened session space</li>
            <li>No surveillance devices (audio or video) in the session area</li>
            <li>Separated or private entry/waiting area, or a disclosed shared arrangement</li>
            <li>Secure, non-shared internet connection, or disclosure of network configuration</li>
            <li>Compliance with ADA accessibility requirements</li>
          </ul>

          <h3>Consultation Ready</h3>
          <p>For workspaces designed to support professionals conducting client meetings, consultations, and advisory sessions, including real estate agents, financial advisors, coaches, consultants, attorneys, and accountants. Certification criteria include:</p>
          <ul>
            <li>Professional, client-facing environment</li>
            <li>Private meeting space with a closable door</li>
            <li>Reliable internet and power access</li>
            <li>Adequate seating for the stated capacity</li>
          </ul>

          <h3>Wellness Ready</h3>
          <p>For workspaces designed to support holistic health practitioners, bodyworkers, acupuncturists, yoga instructors, massage therapists, and similar wellness professionals. Certification criteria include:</p>
          <ul>
            <li>Appropriate flooring and ventilation for the stated modalities</li>
            <li>Adequate space dimensions for the stated practice type</li>
            <li>Clean, sanitizable surfaces</li>
            <li>Private changing area or restroom access</li>
          </ul>

          <h3>Service Ready</h3>
          <p>For workspaces designed to support barbers, stylists, estheticians, nail technicians, tattoo artists, and other hands-on service providers whose work requires specialized infrastructure. Certification criteria include:</p>
          <ul>
            <li>Proper ventilation per local code for the stated service type</li>
            <li>Access to running water and sanitation facilities</li>
            <li>Adequate electrical capacity for professional equipment</li>
            <li>Easy-to-clean flooring and work surfaces</li>
            <li>Compliance with local health department requirements for the stated service category</li>
          </ul>

          <h3>General Professional</h3>
          <p>For workspaces that serve a broad range of professional uses but do not fall into a specific certification tier above. This includes spaces used by photographers, podcasters, remote workers, freelancers, tutors, and other professionals. Certification criteria include:</p>
          <ul>
            <li>Clean, well-maintained workspace</li>
            <li>Reliable internet and power access</li>
            <li>Private or semi-private space as described in the listing</li>
            <li>Adequate for the use case stated in the listing description</li>
          </ul>

          <h3>Certification Disclaimer</h3>
          <p><strong>Professional Use Certifications are self-reported by the Host and are not independently verified, audited, or endorsed by Align Workspaces.</strong> A certification describes the space and does not guarantee compliance with the specific regulatory, licensing, or permitting requirements of any Guest's profession or jurisdiction. Guests are solely responsible for independently confirming that a workspace meets their professional requirements before booking. Align Workspaces assumes no liability for the accuracy of any Professional Use Certification.</p>
          <p>Hosts who maintain a Professional Use Certification are responsible for ensuring continuous compliance with the stated criteria. Align Workspaces reserves the right to remove certifications if we receive credible reports of non-compliance. The Platform may add, modify, or retire certification categories at any time.</p>

          <h2>14. Insurance Requirements</h2>

          <h4>Host Insurance (Required)</h4>
          <p><strong>All Hosts must maintain active general liability insurance</strong> covering their workspace with a minimum coverage amount of $1,000,000 per occurrence. Hosts are required to upload proof of coverage during the onboarding process, including policy number, carrier name, coverage limits, and policy expiration date.</p>
          <p>Hosts whose spaces are used for regulated services (barbering, cosmetology, bodywork, food service, or similar) should also carry coverage appropriate to those activities or require their Guests to carry such coverage independently.</p>
          <p>Align Workspaces may request updated proof of coverage at any time. <strong>Listings associated with lapsed or unverified insurance will be suspended</strong> until valid documentation is provided. Hosts will receive automated reminders 30 days before their policy expiration date.</p>

          <h4>Guest Insurance (Recommended/Conditional)</h4>
          <p>Guests who are licensed or regulated professionals are strongly encouraged to maintain active professional liability, malpractice, or errors and omissions insurance appropriate to their industry. This includes but is not limited to therapists, counselors, barbers, stylists, bodyworkers, real estate agents, attorneys, financial advisors, and any professional whose work involves direct client contact or advisory services.</p>
          <p>The Platform may require proof of professional liability insurance for Guests booking workspaces with certain Professional Use Certifications. All Guests are responsible for insuring their own personal property, professional equipment, and client property. <strong>Align Workspaces does not provide insurance coverage for Guest belongings or equipment.</strong></p>

          <h4>Platform Insurance Disclaimer</h4>
          <p><strong>Align Workspaces does not provide insurance coverage for Hosts, Guests, or workspaces.</strong> Insurance Verification conducted by the Platform is limited to confirming that a Host has submitted documentation that appears to reflect active coverage. Align Workspaces does not verify the terms, exclusions, adequacy, or validity of any insurance policy. We make no representations about the sufficiency of any insurance coverage maintained by Hosts or Guests.</p>

          <h2>15. Host Protection Plan</h2>
          <p>Align Workspaces offers an optional Host Protection Plan ("HPP") that provides damage coverage for eligible incidents caused by Guests during confirmed Bookings.</p>

          <h4>Coverage</h4>
          <ul>
            <li>Property damage to the workspace or its contents caused by a Guest or their invitees during a confirmed Booking</li>
            <li>Coverage limits, deductibles, and exclusions are detailed in the HPP plan terms provided at enrollment</li>
          </ul>

          <h4>What Is Not Covered</h4>
          <ul>
            <li>Normal wear and tear</li>
            <li>Pre-existing damage or maintenance issues</li>
            <li>Damage caused by the Host, their employees, or third parties unrelated to the Booking</li>
            <li>Loss of income or consequential damages</li>
            <li>Professional malpractice or liability claims</li>
            <li>Damage to Guest property or equipment</li>
            <li>Claims arising from a Guest's regulatory non-compliance or failure to obtain required permits</li>
            <li>Chemical, biological, or environmental contamination, unless caused by a specific identifiable incident during the Booking</li>
          </ul>

          <h4>Claims Process</h4>
          <p>Hosts must report damage within 48 hours of the Booking end time through the Platform's damage reporting tool. Documentation including photos, descriptions, and estimated repair costs is required. Align Workspaces will review claims and make determinations in accordance with the HPP plan terms. HPP determinations are final.</p>
          <p>The Host Protection Plan is a voluntary, supplementary benefit and does not replace the Host's obligation to maintain their own liability insurance. Enrollment in the HPP does not create an insurance contract between Align Workspaces and the Host.</p>

          <h2>16. Damage Resolution</h2>
          <p>In the event of damage to a workspace during a Booking:</p>
          <ol>
            <li>The Host must document the damage with photos and descriptions within 48 hours of the Booking end time.</li>
            <li>The Host must report the damage through the Platform's damage reporting tool.</li>
            <li>Align Workspaces will notify the Guest and provide an opportunity to respond within 72 hours.</li>
            <li>If the parties cannot reach a resolution directly, Align Workspaces support may review the evidence and issue a determination.</li>
            <li>Guests found responsible for damage may be charged through their payment method on file, up to the documented repair or replacement cost.</li>
            <li>If the Host is enrolled in the Host Protection Plan, eligible claims will be processed under the HPP terms.</li>
          </ol>

          <h2>17. DISCLAIMER OF WARRANTIES</h2>
          <p className="uppercase text-xs leading-relaxed"><strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. ALIGN WORKSPACES DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. ALIGN WORKSPACES DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. ALIGN WORKSPACES DOES NOT ENDORSE OR WARRANT THE EXISTENCE, CONDUCT, PERFORMANCE, SAFETY, QUALITY, LEGALITY, OR SUITABILITY OF ANY GUEST, HOST, WORKSPACE, LISTING, HOST SERVICE, OR PROFESSIONAL USE CERTIFICATION. ALIGN WORKSPACES DOES NOT WARRANT THAT ANY WORKSPACE IS COMPLIANT WITH THE REGULATORY, LICENSING, PERMITTING, OR HEALTH DEPARTMENT REQUIREMENTS APPLICABLE TO ANY GUEST'S PROFESSION, TRADE, OR BUSINESS ACTIVITY.</strong></p>

          <h2>18. LIMITATION OF LIABILITY</h2>
          <p className="uppercase text-xs leading-relaxed"><strong>IN NO EVENT SHALL ALIGN WORKSPACES' AGGREGATE LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE AMOUNTS PAID BY YOU TO ALIGN WORKSPACES IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.</strong></p>
          <p className="uppercase text-xs leading-relaxed"><strong>ALIGN WORKSPACES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF ALIGN WORKSPACES HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</strong></p>
          <p className="uppercase text-xs leading-relaxed"><strong>THIS LIMITATION APPLIES TO ALL CLAIMS, WHETHER BASED ON WARRANTY, CONTRACT, TORT, STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT ALIGN WORKSPACES HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, INCLUDING BUT NOT LIMITED TO CLAIMS ARISING FROM THE ACTIONS OR OMISSIONS OF HOSTS OR GUESTS, THE CONDITION OR SUITABILITY OF ANY WORKSPACE, ANY PROFESSIONAL USE CERTIFICATION, THE ADEQUACY OF ANY INSURANCE COVERAGE, ANY REGULATORY NON-COMPLIANCE BY A HOST OR GUEST, OR ANY HEALTH, SAFETY, OR SANITATION ISSUE OCCURRING AT A BOOKED WORKSPACE.</strong></p>

          <h2>19. Indemnification</h2>
          <p><strong>You agree to indemnify, defend, and hold harmless Align Workspaces</strong>, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in connection with:</p>
          <ol type="a">
            <li>Your breach of these Terms;</li>
            <li>Your use of the Platform;</li>
            <li>Your interaction with any other user or use of any workspace;</li>
            <li>Any damage you cause to a workspace;</li>
            <li>Your violation of any applicable law, regulation, licensing requirement, or health code;</li>
            <li>Your Content;</li>
            <li>Any claim arising from your professional, trade, or business activities conducted in a booked workspace;</li>
            <li>Any claim arising from your failure to obtain or maintain required professional licenses, permits, or insurance.</li>
          </ol>
          <p>As a Host, you additionally agree to indemnify Align Workspaces from claims arising from the condition, safety, or legality of your workspace; your failure to comply with applicable laws, building codes, or health department requirements; any injury, loss, or damage to a Guest or their property occurring at your workspace; any inaccuracy in a Professional Use Certification you have elected; and any claim related to services performed by Guests at your workspace if you were aware or should have been aware that the space was not suitable or compliant for those services.</p>

          <h2>20. Dispute Resolution</h2>
          <p>In the event of a dispute between a Host and Guest, users agree to first attempt resolution directly through Platform messaging. If direct resolution fails, Align Workspaces support may review the dispute and make a determination. <strong>The Platform's determination on disputes between Hosts and Guests is final.</strong></p>
          <p>For disputes between a user and Align Workspaces, <strong>you agree to binding arbitration on an individual basis. You waive any right to participate in a class action or class arbitration.</strong> Arbitration shall be conducted under the rules of the American Arbitration Association. This arbitration provision may be opted out of within 30 days of account creation by sending written notice to <a href="mailto:hello@alignworkspaces.com">hello@alignworkspaces.com</a>.</p>

          <h2>21. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the <strong>laws of the State of Florida</strong>, without regard to its conflict of law provisions. Any legal action permitted outside of arbitration shall be brought in the courts of <strong>Miami-Dade County, Florida</strong>.</p>

          <h2>22. General</h2>
          <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect. Align Workspaces' failure to enforce any right does not constitute a waiver. <strong>These Terms constitute the entire agreement between you and Align Workspaces.</strong> Align Workspaces may assign these Terms; you may not.</p>

          <h2>23. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:hello@alignworkspaces.com">hello@alignworkspaces.com</a>.</p>
          <p className="mt-6">Align Workspaces<br />Miami, FL</p>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
