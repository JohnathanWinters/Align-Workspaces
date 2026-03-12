# Align

## Overview

Align is a premium, mobile-first interactive website designed to help professionals create personal portrait photoshoots. It guides users through a 6-step configurator to define their photoshoot concept, updating a visual gallery and concept summary in real time. The primary goal is to capture lead information via a booking form, with options for immediate booking requiring a 50% Stripe downpayment. The project aims to streamline the photoshoot planning process and provide a clear, personalized experience for clients.

## User Preferences

Preferred communication style: Simple, everyday language.

### Terminology
- **Portraits Landing Page**: The hero page at `/` with the "Your Portrait Is Your First Impression" heading. Component: `client/src/components/hero-section.tsx`.
- **Spaces Landing Page**: The hero page at `/spaces` with the "Your Space, Your Practice" heading. Component: `client/src/pages/align-spaces.tsx`.

## System Architecture

### Monorepo Structure
The application uses a monorepo structure, separating the React frontend (`client/`), Express backend (`server/`), and shared code (`shared/`) for database schemas and types.

### Frontend
- **Framework & UI**: React with TypeScript, Vite, Wouter for routing, and shadcn/ui (New York style) built on Radix UI with Tailwind CSS for styling.
- **State & Forms**: Local React state for the configurator, TanStack React Query for server data, React Hook Form with Zod for form validation.
- **Visuals**: Framer Motion for animations, warm neutral color palette, and Google Fonts (Plus Jakarta Sans, Playfair Display).
- **Key Features**: A 6-step configurator with dynamic image previews (`ImageGallery`), a live `ConceptSummary`, labeled step indicator (`StepIndicator` with step names), clickable selection summary chips for quick step navigation, staggered reveal animations, and a `BookingForm` that handles both collaboration requests and secure session bookings with Stripe integration.
- **Site Footer**: Shared `SiteFooter` component (`client/src/components/site-footer.tsx`) with `variant` prop ("dark"/"light"), used on hero pages. Includes nav links, contact info, and copyright.

### Backend
- **Framework & API**: Express 5 on Node.js with TypeScript, providing a RESTful JSON API.
- **Admin Panel**: A password-protected `/admin` panel for managing photoshoots, galleries, edit tokens, featured professionals, portfolio photos with tagging (environments, brand messages, emotional impacts, color palette), and a built-in Analytics dashboard.
- **File Management**: `multer` for file uploads, streaming to Replit Object Storage, with temporary files cleaned post-upload. Supports image uploads up to 50MB per file, with batched processing.
- **Notifications**: Google Mail for email notifications (bookings, collaborations, edit requests) and Web Push (VAPID) for real-time chat messages between clients and admins.
- **Stripe Integration**: Handles checkout sessions for downpayments, edit token purchases, and space booking payments. Allows admins to create and send itemized invoices using the Stripe Invoicing API. Stripe Connect Express for host payouts on space bookings (7% renter fee + 7% host fee hybrid model).

### Database
- **PostgreSQL**: The primary data store, managed with Drizzle ORM.
- **Schema**: Shared `schema.ts` defines tables for leads, shoots, galleries, edit tokens, edit requests, push subscriptions, nominations, and spaces.
- **Pricing**: `shared/pricing.ts` contains server-authoritative pricing logic.

### Build System
- **Development**: `tsx server/index.ts` with Vite middleware for HMR.
- **Production**: A custom build script uses Vite for the client and esbuild for the server, outputting to `dist/`.

### Design Patterns
- **Storage Interface**: An `IStorage` interface abstracts database operations for swappability.
- **Schema Sharing**: Drizzle table definitions and Zod schemas are shared between frontend and backend for consistent validation.

## External Dependencies

### Database
- **PostgreSQL**

### Key NPM Packages
- **drizzle-orm**, **drizzle-kit**
- **express**
- **@tanstack/react-query**
- **framer-motion**
- **react-hook-form**, **zod**
- **wouter**
- **shadcn/ui ecosystem** (Radix UI, Tailwind CSS)
- **react-day-picker**
- **vaul**
- **recharts**
- **embla-carousel-react**

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**
- **@replit/vite-plugin-cartographer**
- **@replit/vite-plugin-dev-banner**

### Fonts (External CDN)
- **Plus Jakarta Sans**
- **Playfair Display**

## AI Crawlability & SEO
- **robots.txt**: Server-rendered at `/robots.txt`, explicitly allows major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Anthropic, Applebot-Extended, Bytespider, CCBot). Blocks `/admin`, `/portal`, `/employee`, `/api/`.
- **sitemap.xml**: Dynamic server-rendered at `/sitemap.xml`, includes static pages and all featured professional profile URLs.
- **llms.txt**: Summary for LLMs at `/llms.txt` with business info, services, pricing, location, and key pages.
- **llms-full.txt**: Extended version at `/llms-full.txt` with full featured professionals directory.
- **Structured Data**: JSON-LD in `client/index.html` includes LocalBusiness (Photographer), FAQPage, and WebSite schemas.
- **Meta Tags**: OG, Twitter Card, geo, classification, and descriptive meta tags in `client/index.html`.
- **Canonical URL**: `https://alignphotodesign.com`

## Align Spaces
- **Landing Page**: `/spaces` — duplicate of main hero with workspace-focused messaging ("Your Space, Your Practice")
- **Browse Page**: `/spaces/browse` — split-view layout with scrollable space cards on the left and an interactive Leaflet map on the right. Price markers on the map are color-coded by space type. Hovering a card highlights its map marker; clicking a map marker scrolls to the card. Mobile users toggle between list and map views via a floating button (shows result count). Cards show: "Verified by Align" badge, top 3 amenity chips, side-by-side "Details" + "Book" buttons, portfolio photo count indicator on card image. Intro text below nav explains Align Spaces concept. Filters bar hidden when fewer than 3 spaces. "Early access" banner shown when 1-2 spaces. Bottom padding on mobile prevents CTA overlap with floating toggle.
- **Database**: `spaces` table with fields for name, slug, type, description, address, neighborhood, latitude, longitude, price_per_hour, price_per_day, capacity, amenities array, image_urls array, target_profession, user_id (owner), approval_status (pending/approved/rejected), etc.
- **Booking System**: `space_bookings` table tracks bookings with date (`bookingDate`, `bookingStartTime`, `bookingHours`), payment fields (`paymentAmount`, `renterFeeAmount`, `hostFeeAmount`, `hostEarnings`, `paymentStatus`, `stripeSessionId`), refund fields (`stripePaymentIntentId`, `refundStatus`, `refundAmount`), Google Calendar field (`googleCalendarEventId`), and unread tracking (`lastReadGuest`, `lastReadHost`). `space_messages` table enables chat between guest and host per booking, with `messageType` field (text, system, payment_request, reschedule_request, reschedule_accepted, reschedule_declined).
- **Stripe Connect Express**: Hosts connect their Stripe accounts via Express onboarding in the portal Spaces tab. When a guest books, payment is split automatically: host receives earnings minus 7% host fee, Align keeps both renter + host fees as `application_fee_amount`. Hosts can view their Stripe Express dashboard from the portal. Reassurance text during onboarding: "Payments are securely processed by Stripe. Your earnings are automatically deposited to your bank account."
- **Fee Model**: Hybrid 7%/7% — renter pays base price + 7% service fee, host receives base price minus 7% host fee. Config in `shared/pricing.ts` (`calculateSpaceBookingFees`).
- **Messages Tab**: Dedicated "Messages" tab in the Client Portal (`client/src/components/portal-messages.tsx`) with inbox-style conversation list sorted by recency, unread badges, "Hosting"/"Renting" role labels on each conversation, conversation view with approve/reject/cancel actions, payment request flow (host specifies amount → guest pays via Stripe), system messages for status changes and payment confirmations, and read receipts.
- **Client Space Listing & Editing**: Authenticated clients can submit new space listings and edit existing ones via the "Spaces" tab in the Client Portal (`/portal`). Stripe Connect onboarding card appears when host has spaces. Submitted spaces start as `pending` and require admin approval. Admin receives email notification on new submissions. Owners can edit all space details inline (name, type, description, address, pricing, amenities, etc.) via a pencil icon on each space card. Address changes auto-trigger geocoding.
- **Structured Availability**: `availabilitySchedule` JSON field on spaces stores day-by-day open/close hours. `AvailabilityScheduleEditor` component provides day toggles, per-day time pickers, and "same hours" shortcut. Visual calendar booking uses `react-day-picker` Calendar + time slot grid based on schedule. `bufferMinutes` integer field (default 15) controls gap between booking slots — hosts can adjust from 0 to 60 minutes in their portal.
- **Booking Flow**: Users click "Book" on a space card in `/spaces/browse`, select a date from an inline calendar (disabled days with no availability), pick a time slot from the grid, choose duration, see fee breakdown (base price + 7% service fee = total) with expandable cancellation policy, then click "Book & Pay" to be redirected to Stripe Checkout. If host has Stripe Connect, payment splits automatically. On successful payment, booking is auto-approved, a system message is posted, and a Google Calendar event is created on the admin calendar. If not logged in, auth prompt appears. Both parties can chat in the Client Portal.
- **Google Calendar Integration**: `server/googleCalendar.ts` — Replit connector for Google Calendar. On successful booking payment (webhook), creates a calendar event on the admin's primary calendar with space name, guest info, time, and location. Event is auto-deleted on cancellation. Clients can add bookings to their own Google Calendar via "Add to Google Calendar" button in the portal chat, which generates a Google Calendar URL (`calendar.google.com/calendar/render`). API: `GET /api/space-bookings/:id/calendar-url` (auth).
- **Cancellation Policy**: Full refund if cancelled 24+ hours before booking; non-refundable within 24 hours. Expandable policy accordion on booking confirmation step. Cancel button in portal chat with refund eligibility info. Refund via Stripe (`stripe.refunds.create`). System messages document outcome.
- **Reschedule Flow**: Either party can propose a reschedule from the chat booking info card. Opens inline calendar+time picker. Creates `reschedule_request` message. Other party sees Accept/Decline buttons. Accept updates booking date/time/hours. Decline keeps original. Only one pending reschedule at a time. Server validates date format, future date, and booking status. API: `POST /api/space-bookings/:id/reschedule`, `POST /api/space-bookings/:id/reschedule-respond`.
- **Admin Approval**: `GET /api/admin/spaces/pending`, `POST /api/admin/spaces/:id/approve`, `POST /api/admin/spaces/:id/reject`
- **Portfolio-Space Link**: `portfolio_photos.location_space_id` column links photos to spaces. Admin can set location in the Portfolio tag editor. `GET /api/portfolio-photos/by-space/:spaceId` returns photos linked to a space. Browse page shows "View Photos Taken Here" button on each space card, opening a fullscreen gallery.
- **Photo Management**: Both admin and portal photo managers support batched multi-file uploads (2 per request to prevent timeouts), drag-and-drop upload zones, drag-to-reorder with visual feedback (cover label on first photo, grab handle on hover), and individual photo deletion. Reorder endpoints validate exact permutation of existing URLs.
- **API**: `GET /api/spaces`, `GET /api/spaces/:slug`, `POST /api/spaces` (auth, creates pending listing), `PATCH /api/spaces/:id` (auth, owner edit with validation), `GET /api/my-spaces` (auth), `GET /api/spaces/:id/booking-fees?hours=N` (public, fee calculator), `POST /api/spaces/:id/book` (auth, creates booking + Stripe checkout with Connect split), `POST /api/spaces/:id/photos` (auth, upload), `DELETE /api/spaces/:id/photos` (auth, delete), `PUT /api/spaces/:id/photos/reorder` (auth, reorder), `GET /api/space-bookings` (auth, enriched with latest message/unread/space info), `GET/POST /api/space-bookings/:id/messages` (auth), `PATCH /api/space-bookings/:id/status` (auth, approve/reject/cancel with system message), `POST /api/space-bookings/:id/request-payment` (auth, host only), `POST /api/space-bookings/:id/checkout` (auth, guest Stripe checkout), `POST /api/space-bookings/:id/read` (auth, mark as read), `GET /api/portfolio-photos/by-space/:spaceId` (public), `POST /api/stripe/connect/onboard` (auth, create Express account + onboarding link), `GET /api/stripe/connect/status` (auth, check Connect status), `GET /api/stripe/connect/dashboard` (auth, Express dashboard login link), admin routes include `PUT /api/admin/spaces/:id/photos/reorder`
- **Sample Data**: Seeding disabled; sample spaces defined in `server/seed-spaces.ts` but `seedSpacesIfEmpty()` is a no-op. API excludes samples (`includeSamples: false`). Admin can purge samples via `POST /api/admin/spaces/purge-samples`.
- **Concept**: Airbnb-style workspace rental for small business professionals in Miami
- **UI Components**: `client/src/components/portal-spaces.tsx` — portal tab for My Spaces, space listing form, booking requests, and chat

## Data Migrations
- `server/migrations.ts`: `fixPortfolioImageExtensions()` runs on startup — fixes `.jpg` → `.webp` in portfolio_photos table.