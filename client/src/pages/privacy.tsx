import { useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() {
  useEffect(() => {
    setPageMeta({
      title: "Privacy Policy | Align Workspaces",
      description: "Privacy Policy for Align Workspaces. Learn how we collect, use, and protect your personal information.",
      url: "https://alignworkspaces.com/privacy",
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
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2a2a2a] mb-2">Privacy Policy</h1>
        <p className="text-sm text-stone-400 mb-10">Last updated: April 10, 2026</p>

        <div className="prose prose-stone prose-sm max-w-none [&_h2]:font-serif [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#2a2a2a] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-stone-500 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-stone-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-stone-600 [&_li]:mb-1">

          <h2>1. Introduction</h2>
          <p>Align Workspaces ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our website, applications, and services (collectively, the "Platform").</p>
          <p><strong>Align Workspaces is a facilitator that connects Hosts and Guests. We are not legally responsible for the actions, content, or conduct of any user on the Platform.</strong> This policy is intended to be transparent about what data we collect and how it is used.</p>
          <p>By using the Platform, you consent to the practices described in this Privacy Policy. If you do not agree, please do not use the Platform.</p>

          <h2>2. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Account information:</strong> Name, email address, phone number, profile photo</li>
            <li><strong>Listing information (Hosts):</strong> Workspace descriptions, photos, pricing, availability, address, amenities, arrival guide details (Wi-Fi credentials, door codes, emergency phone number, step-by-step directions with photos)</li>
            <li><strong>Booking information (Guests):</strong> Booking dates, times, duration, notes</li>
            <li><strong>Insurance documentation (Hosts):</strong> Carrier name, policy number, coverage details, expiration date, and uploaded declarations page</li>
            <li><strong>Professional profile (Guests, optional):</strong> Professional title, industry, license numbers, licensing state</li>
            <li><strong>Communications:</strong> Messages between users (including text and images), support requests, reviews</li>
            <li><strong>Payment information:</strong> Payment method details (processed and stored by Stripe, not by us)</li>
          </ul>
          <h3>Information Collected Automatically</h3>
          <ul>
            <li>IP address, device type, browser type, operating system</li>
            <li>Pages visited, time spent, search queries, booking history</li>
            <li>Approximate location (based on IP address)</li>
            <li>Push notification subscription tokens (if you enable notifications)</li>
            <li>Booking rules acceptance records (timestamp, IP address, user agent)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
          <h3>Information from Third Parties</h3>
          <ul>
            <li><strong>Stripe:</strong> Payment confirmation and transaction data (we do not receive or store full credit card numbers)</li>
            <li><strong>Google Calendar:</strong> Calendar availability data if you enable calendar sync (we store OAuth tokens securely)</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Operate and provide the Platform's features and services</li>
            <li>Process bookings and facilitate payments between Hosts and Guests</li>
            <li>Share arrival guide information (Wi-Fi, access codes, directions) with confirmed Guests</li>
            <li>Communicate with you about bookings, account updates, and support</li>
            <li>Send push notifications for booking updates, messages, and reminders (if enabled)</li>
            <li>Send marketing communications (you can opt out at any time)</li>
            <li>Track insurance expiration dates and send renewal reminders to Hosts</li>
            <li>Verify user identity and prevent fraud</li>
            <li>Improve and personalize the Platform experience through analytics</li>
            <li>Enforce our Terms of Service and protect user safety</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. How We Share Your Information</h2>
          <p><strong>With other users:</strong> Hosts see Guest names, contact information, and booking details. Guests see Host names, workspace details, addresses, and arrival guide information for confirmed bookings. <strong>Align Workspaces is not responsible for how users handle information shared through the Platform.</strong></p>
          <p><strong>With Stripe:</strong> Payment information is collected and processed directly by Stripe. Refer to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a> for details.</p>
          <p><strong>With service providers:</strong> We use third-party services for hosting (Railway), file storage (Cloudflare R2), email delivery (Gmail API), newsletter management (ConvertKit), and analytics. These providers access your data only as needed to perform their services.</p>
          <p><strong>For legal compliance:</strong> We may disclose information in response to law enforcement requests, court orders, or as required by applicable law.</p>
          <p><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred to the acquiring entity.</p>
          <p><strong>We do not sell your personal information.</strong></p>

          <h2>5. Payment Data</h2>
          <p>Align Workspaces does not store credit card numbers or full payment credentials. All payment information is collected and processed directly by Stripe, which is PCI DSS Level 1 certified. We receive only confirmation of payment status and transaction amounts. We store fee breakdowns and payout records for accounting and dispute resolution purposes.</p>

          <h2>6. Messaging and Communications</h2>
          <p>Messages sent through the Platform (booking messages, direct conversations, and admin messages) are stored in plain text on our servers. <strong>Messages are not end-to-end encrypted.</strong> Platform administrators have access to all messages for support and safety purposes. If your profession requires encrypted communications, you should use a separate secure channel for sensitive client communications.</p>

          <h2>7. Cookies</h2>
          <p>We use essential cookies to operate the Platform (session management, authentication). We may also use analytics cookies to understand how users interact with the Platform. You can manage cookie preferences through your browser settings.</p>

          <h2>8. Data Retention</h2>
          <p>We retain your personal information for as long as your account is active or as needed to provide services, comply with legal obligations, and resolve disputes. Booking records and booking rules acceptance records are retained indefinitely for audit purposes. You may request deletion of your account and associated personal data at any time, subject to our legal retention obligations.</p>

          <h2>9. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit (TLS/SSL), secure file storage (Cloudflare R2 with encryption at rest), HttpOnly secure session cookies, and rate limiting on authentication endpoints. However, no method of electronic storage or transmission is 100% secure. <strong>We cannot guarantee absolute security of your data and are not liable for unauthorized access resulting from circumstances beyond our reasonable control.</strong></p>

          <h2>10. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal information we hold about you</li>
            <li><strong>Correct</strong> inaccurate or incomplete information</li>
            <li><strong>Delete</strong> your account and associated data</li>
            <li><strong>Export</strong> your data in a portable format</li>
            <li><strong>Opt out</strong> of marketing communications and push notifications</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:hello@alignworkspaces.com">hello@alignworkspaces.com</a>.</p>
          <h3>California Residents (CCPA)</h3>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act: the right to know what personal information is collected, the right to deletion, and the right to non-discrimination for exercising your rights. We do not sell personal information as defined by the CCPA.</p>

          <h2>11. Children's Privacy</h2>
          <p>The Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If we learn that we have collected information from a child under 18, we will delete it promptly.</p>

          <h2>12. Third-Party Links and Services</h2>
          <p>The Platform may contain links to third-party websites or services (including Stripe, Google Calendar, and ConvertKit). We are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party sites you visit.</p>

          <h2>13. Limitation of Liability</h2>
          <p><strong>Align Workspaces is a facilitator and is not responsible for the privacy practices of any Host or Guest.</strong> Information that users share with each other through the Platform (including personal details, messages, and contact information) is shared at the users' own risk. Align Workspaces is not liable for any misuse of personal information by another user of the Platform.</p>

          <h2>14. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. The "Last updated" date at the top of this page indicates when the policy was last revised.</p>

          <h2>15. Contact Us</h2>
          <p>For questions about this Privacy Policy or to exercise your data rights, contact us at:</p>
          <p><a href="mailto:hello@alignworkspaces.com">hello@alignworkspaces.com</a><br />Align Workspaces<br />Miami, FL</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
