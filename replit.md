# Align

## Overview
Align is a premium, mobile-first interactive website designed to help professionals create personal portrait photoshoots. It guides users through a 6-step configurator to define their photoshoot concept, updating a visual gallery and concept summary in real time. The primary goal is to capture lead information via a booking form, with options for immediate booking requiring a 50% Stripe downpayment. The project also features "Align Spaces," an Airbnb-style workspace rental platform for small business professionals in Miami, allowing users to browse, book, and manage creative spaces.

## User Preferences
Preferred communication style: Simple, everyday language.

### Terminology
- **Home / Spaces Landing Page**: The hero page at `/` with the "Your Space, Your Practice" heading. Component: `client/src/pages/align-spaces.tsx`.
- **Portraits Landing Page**: The hero page at `/portraits` with the "Your Portrait Is Your First Impression" heading. Component: `client/src/components/hero-section.tsx`.
- **Browse Spaces**: The spaces marketplace at `/browse`. Component: `client/src/pages/spaces-browse.tsx`.
- **Portraits Builder**: The 6-step configurator at `/portraits/builder`. Component: `client/src/pages/home.tsx` (with `autoStart`).

## System Architecture

### Monorepo Structure
The application uses a monorepo structure, separating the React frontend (`client/`), Express backend (`server/`), and shared code (`shared/`) for database schemas and types.

### Frontend
- **Framework & UI**: React with TypeScript, Vite, Wouter for routing, and shadcn/ui (New York style) built on Radix UI with Tailwind CSS for styling.
- **State & Forms**: Local React state for the configurator, TanStack React Query for server data, React Hook Form with Zod for form validation.
- **Visuals**: Framer Motion for animations, warm neutral color palette, and Google Fonts (Plus Jakarta Sans, Playfair Display).
- **Key Features**: A 6-step configurator with dynamic image previews (`ImageGallery`), a live `ConceptSummary`, labeled step indicator, clickable selection summary chips for quick step navigation, staggered reveal animations, and a `BookingForm`. A shared `SiteFooter` component handles navigation and contact information.

### Backend
- **Framework & API**: Express 5 on Node.js with TypeScript, providing a RESTful JSON API.
- **Admin Panel**: A password-protected `/admin` panel for managing photoshoots, galleries, edit tokens, featured professionals, portfolio photos with tagging, an Analytics dashboard, and user profile photo editing.
- **File Management**: `multer` for file uploads, streaming to Replit Object Storage, with temporary files cleaned post-upload. Supports image uploads up to 50MB per file.
- **Notifications**: Google Mail for email notifications and Web Push (VAPID) for real-time chat messages.
- **Stripe Integration**: Handles checkout sessions for downpayments, edit token purchases, and space booking payments. Admins can create and send itemized invoices. Stripe Connect Express facilitates host payouts on space bookings (7% renter fee + 7% host fee hybrid model).

### Database
- **PostgreSQL**: The primary data store, managed with Drizzle ORM.
- **Schema**: `shared/schema.ts` defines tables for leads, shoots, galleries, edit tokens, edit requests, push subscriptions, nominations, spaces, and space bookings. `shared/models/auth.ts` defines users (with `password`, `pendingEmail`, `pendingEmailToken` fields) and magic tokens.
- **Pricing**: `shared/pricing.ts` contains server-authoritative pricing logic.

### Client Portal Settings
- **Settings Tab**: The portal (`/portal`) includes a Settings tab with profile photo upload, name editing, password management (set/change with bcryptjs), and email change (via confirmation link to current email).
- **Email Change Flow**: Two-step: GET renders a confirmation page, POST finalizes the swap. Token expires in 30 minutes.
- **Password**: Optional — users who signed up via magic link can set a password. `hasPassword` boolean sent to frontend (actual hash never exposed).
- **Profile Photo**: Uploaded via multer, processed to 400x400 WebP via sharp, stored in object storage. Admin can also upload user profile photos.

### Domain Redirects
- **Primary domain**: `alignworkspaces.com`
- **Contact email**: `hello@alignworkspaces.com` (display), `armando@alignworkspaces.com` (notifications)
- Server-side 301 redirects in `server/index.ts`: `alignportraits.com`, `buildmyphoto.com`, `alignvisuals.com` (+ www variants) all redirect to `https://alignworkspaces.com/portraits`.

### Build System
- **Development**: `tsx server/index.ts` with Vite middleware for HMR.
- **Production**: A custom build script uses Vite for the client and esbuild for the server, outputting to `dist/`.

### Design Patterns
- **Storage Interface**: An `IStorage` interface abstracts database operations for swappability.
- **Schema Sharing**: Drizzle table definitions and Zod schemas are shared between frontend and backend for consistent validation.

### Align Spaces Specifics
- **Browse Page**: Split-view layout with scrollable space cards and an interactive Leaflet map. Supports filtering, mobile toggles between list/map, and displays "Verified by Align" badges and amenities.
- **Booking System**: `space_bookings` table tracks bookings with payment details, Google Calendar integration, and unread tracking. `space_messages` table enables chat between guest and host.
- **Client Space Management**: Authenticated clients can submit and edit space listings via the Client Portal. Submitted spaces require admin approval.
- **Structured Availability**: `availabilitySchedule` JSON field on spaces stores day-by-day open/close hours. `bufferMinutes` allows hosts to set gaps between booking slots.
- **Booking Flow**: Users select date/time, duration, see fee breakdown, and complete payment via Stripe Checkout. Auto-approval and Google Calendar event creation on successful payment.
- **Cancellation Policy**: Full refund if cancelled 24+ hours before booking; non-refundable within 24 hours.
- **Reschedule Flow**: Either party can propose a reschedule from chat, creating a request that the other party can accept or decline.
- **Portfolio Categories**: `portfolio_photos.category` field (`people` or `spaces`) enables a People/Spaces toggle on the `/portfolio` page. Admin panel includes category filtering, category-aware uploads, and category editing per photo.
- **Portfolio-Space Link**: `portfolio_photos.location_space_id` links photos to spaces, allowing users to view photos taken at a specific space.
- **Photo Management**: Supports batched multi-file uploads, drag-and-drop, drag-to-reorder (`displayOrder` column), crop/position adjustment (`cropPosition` JSON: x, y, zoom), and individual photo deletion. Spaces photos use landscape (4:3) framing; people photos use portrait (3:4).
- **Book of Business (Pipeline CRM)**: `pipeline_contacts` and `pipeline_activities` tables. Kanban board and list views with stages: New Lead → Contacted → Follow-up → Proposal Sent → Booked → Completed → Lost. Drag between columns to move stages. Activity logging (calls, emails, notes, meetings). Auto-imports website leads. CSV import/export for Excel compatibility. Filter by Portraits/Spaces.

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