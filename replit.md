# Align

## Overview

Align is a premium, mobile-first interactive website that helps professionals design a personal portrait photoshoot. Tagline: "Build Portraits that reflect who you are." Users are guided through a 6-step configurator (environment, brand message, emotional impact, shoot intent, concept summary, booking) that updates a visual gallery and live concept summary in real time. The final goal is to capture lead information via a booking form, with locked-date bookings requiring a 50% Stripe downpayment.

The app follows a monorepo structure with a React frontend (`client/`), an Express backend (`server/`), and shared code (`shared/`) for database schemas and types.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) — home, portfolio, about, portal (client portal) pages + 404
- **Authentication**: Replit Auth (OIDC) via `server/replit_integrations/auth/` — login at `/api/login`, logout at `/api/logout`, user at `/api/auth/user`
- **State Management**: Local React state for the configurator flow; TanStack React Query for server data fetching/mutations
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for transitions, hover effects, and step animations
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Styling**: Tailwind CSS with CSS custom properties for theming. Warm neutral color palette (beige/white tones). Two fonts loaded from Google Fonts: Plus Jakarta Sans (sans-serif) and Playfair Display (serif)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Key Frontend Components
- `HeroSection` — Landing hero with CTA to start the configurator
- `StepIndicator` — Visual progress through 3 configurator steps
- `OptionCard` — Clickable selection cards for each configurator option
- `ImageGallery` — Dynamic image preview that updates based on environment/emotional impact selections
- `ConceptSummary` — Live summary panel showing current selections and pricing
- `BookingForm` — Step 6 with two modes: "Collaborate on Your Vision" (creates account + pending-review shoot + emails photographer) and "Secure Your Session" (date picker + Stripe payment)

### Configurator Data Model (client/src/lib/configurator-data.ts)
The configurator state tracks four selections:
1. **Environment**: restaurant, office, nature, workvan, urban, suburban
2. **Brand Message**: assured, empathy, confidence, motivation
3. **Emotional Impact**: cozy, bright, powerful, cinematic
4. **Shoot Intent**: website, social-media, marketing, personal-brand, team

Pricing is calculated dynamically based on selections.

### Backend (server/)
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx)
- **API**: RESTful JSON API under `/api/` prefix
- **Endpoints**:
  - `POST /api/leads` — Create a new lead/booking (validated with Zod)
  - `GET /api/leads` — Retrieve all leads
  - `POST /api/collaborate` — Create account + pending-review shoot + email photographer (no auth required)
  - `POST /api/checkout` — Create a Stripe checkout session for 50% downpayment (pricing calculated server-side)
  - `POST /api/stripe/webhook` — Stripe webhook handler (registered before express.json middleware)
  - `GET /api/stripe/publishable-key` — Returns Stripe publishable key
  - `GET /api/shoots` — Get shoots for authenticated user (protected)
  - `POST /api/shoots` — Create shoot for authenticated user (protected, but currently admin-only via admin panel)
  - `GET /api/shoots/:id` — Get single shoot (protected, user-scoped)
  - `GET /api/shoots/:id/gallery` — Get gallery images for a shoot (protected, user-scoped)
  - `POST /api/admin/login` — Verify admin password
  - `GET /api/admin/users` — List all users (admin only)
  - `GET/POST /api/admin/shoots` — List/create shoots (admin only)
  - `PATCH/DELETE /api/admin/shoots/:id` — Update/delete shoots (admin only)
  - `GET /api/admin/shoots/:id/gallery` — Gallery images for shoot (admin only)
  - `POST /api/admin/gallery` — Add gallery image (admin only)
  - `DELETE /api/admin/gallery/:id` — Delete gallery image and file (admin only)
  - `POST /api/admin/shoots/:id/upload` — Upload photos to shoot (admin only, multipart/form-data)
  - `GET /api/admin/shoots/:id/folders` — List folders for shoot (admin only)
  - `POST /api/admin/folders` — Create folder (admin only)
  - `PATCH /api/admin/folders/:id` — Rename folder (admin only)
  - `DELETE /api/admin/folders/:id` — Delete folder and its photos (admin only)
  - `POST /api/admin/shoots/:id/send-invoice` — Create and send Stripe invoice to client (admin only, uses Stripe Invoicing API)
  - `PATCH /api/admin/users/:id` — Update client name/email (admin only)
  - `GET /api/shoots/:id/folders` — Client: get folders for a shoot (authenticated, user-scoped)
  - `GET /api/shoots/:id/favorites` — Client: get favorited image IDs for a shoot (authenticated, user-scoped)
  - `POST /api/shoots/:shootId/gallery/:imageId/favorite` — Client: toggle favorite on an image (authenticated)
  - `GET /api/shoots/:shootId/gallery/:imageId/download` — Client: download single image (authenticated)
  - `GET /api/shoots/:id/download-all` — Client: download all images as zip (authenticated)
  - `GET /api/edit-tokens` — Get current user's edit token balance (authenticated, auto-creates if none)
  - `GET /api/edit-requests` — Get current user's edit requests (authenticated)
  - `POST /api/edit-requests` — Submit photos for editing, deducts tokens (authenticated, multipart)
  - `POST /api/edit-tokens/checkout` — Create Stripe checkout for purchasing edit tokens (authenticated)
  - `GET /api/edit-tokens/config` — Get token pricing config (public)
  - `GET /api/admin/edit-tokens/:userId` — Get user's token balance (admin)
  - `PATCH /api/admin/edit-tokens/:userId` — Adjust user's token balance (admin)
  - `GET /api/admin/edit-requests` — Get all edit requests (admin)
  - `DELETE /api/admin/edit-requests/:id` — Delete edit request, refund tokens, clean up photos from storage (admin only)
  - `GET /api/admin/edit-requests/:id/photos` — Get photos for edit request (admin)
  - `GET /api/admin/token-transactions/:userId` — Get token transaction history (admin)
  - `GET /api/admin/all-edit-tokens` — Get all edit token records (admin)
  - `GET /api/edit-requests/:id/messages` — Get messages for an edit request (authenticated, user-scoped)
  - `POST /api/edit-requests/:id/messages` — Send a message on an edit request (authenticated)
  - `GET /api/admin/edit-requests/:id/messages` — Get messages for edit request (admin)
  - `POST /api/admin/edit-requests/:id/messages` — Send a message as admin (admin)
- **Admin Panel**: Password-protected at `/admin` using `ADMIN_PASSWORD` env secret. Bearer token auth for all admin API calls. Allows managing client photoshoots (create/edit/delete), gallery images with folder organization, photo uploads, and edit token management.
- **File Uploads**: Photos uploaded via multer (disk storage in `tmp_uploads/`) then streamed to Replit Object Storage for persistence across republishes. Temp files cleaned up after upload. Served via `/objects/uploads/{uuid}` route. Legacy files from `/uploads/` path still served for backward compatibility. Max 50MB per file, max 10 files per request, image types only. Frontend batches uploads in groups of 2 to prevent memory overflow with large files.
- **Stripe Integration**: Uses `stripe-replit-sync` for webhook management. Checkout creates lead with `paymentStatus: "pending"`, redirects to Stripe, then back with `?payment=success` or `?payment=cancelled` URL params.
- **Email Notifications**: Booking notifications, collaboration requests, help requests, and edit request submissions sent to ArmandoRamirezRomero89@gmail.com via Google Mail integration
- **Push Notifications**: Web Push (VAPID) for chat messages — clients get notified when admin replies, admin gets notified when clients message. Service worker at `/sw.js`, `web-push` library server-side, `push_subscriptions` table stores endpoints. VAPID keys in env vars `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VITE_VAPID_PUBLIC_KEY`.
- **Stripe Invoicing**: Admin can create and send itemized invoices via Stripe Invoicing API (customers created/reused automatically, invoices finalized and sent with configurable due dates)
- **Dev Server**: Vite middleware is used in development for HMR; in production, static files are served from `dist/public`

### Database
- **Database**: PostgreSQL (required — `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (`shared/schema.ts`): `leads` table with fields for contact info (name, email, phone), configurator selections (environment, brandMessage, emotionalImpact, shootIntent), preferred date, notes, estimated pricing range (min/max), paymentStatus (none/pending/paid), and timestamps. Also `shoots` table (per-user photoshoot sessions with optional `location` field), `gallery_folders` table (folder organization per shoot, admin-only), `gallery_images` table (photos per shoot with optional folderId and originalFilename), and `image_favorites` table (userId + imageId for client photo favoriting). Edit token system: `edit_tokens` table (per-user token balance with annualTokens, purchasedTokens, annualTokenResetDate), `token_transactions` table (audit log of all token changes), `edit_requests` table (photo editing submissions with token usage and optional notes/instructions), `edit_request_photos` table (uploaded photos per edit request), `edit_request_messages` table (per-edit-request chat between client and admin, with senderRole and senderName), `push_subscriptions` table (Web Push subscriptions per user/admin). Auth tables (`users`, `sessions`) from Replit Auth integration.
- **Shared Pricing** (`shared/pricing.ts`): Server-authoritative pricing logic used by both frontend and backend
- **Migrations**: Drizzle Kit with `db:push` command for schema sync

### Build System
- **Development**: `tsx server/index.ts` runs the Express server with Vite middleware
- **Production Build**: Custom build script (`script/build.ts`) that runs Vite for the client and esbuild for the server, outputting to `dist/`
- **Server Bundle**: esbuild bundles server code with select dependencies inlined (allowlisted) to reduce cold start syscalls; other deps are kept external

### Project Structure
```
client/           # React frontend
  src/
    components/   # App-specific components
      ui/         # shadcn/ui component library
    hooks/        # Custom React hooks
    lib/          # Utilities, configurator data, query client
    pages/        # Page components (home, not-found)
server/           # Express backend
  index.ts        # Entry point, middleware setup
  routes.ts       # API route definitions
  storage.ts      # Database storage layer (implements IStorage interface)
  db.ts           # Drizzle database connection
  vite.ts         # Vite dev server integration
  static.ts       # Production static file serving
shared/           # Shared between client and server
  schema.ts       # Drizzle table definitions and Zod schemas
migrations/       # Drizzle migration files
attached_assets/  # Project requirements and reference docs
```

### Design Patterns
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations, making it swappable
- **Schema Sharing**: Database schema and validation types are shared between frontend and backend via `shared/schema.ts`
- **Validation**: Zod schemas derived from Drizzle table definitions ensure consistent validation across the stack

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple** — PostgreSQL session store (available but sessions not currently implemented)

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **express** v5 — HTTP server framework
- **@tanstack/react-query** — Async state management for API calls
- **framer-motion** — Animation library for UI transitions
- **react-hook-form** + **zod** — Form handling and validation
- **wouter** — Lightweight client-side routing
- **shadcn/ui ecosystem** — Radix UI primitives, Tailwind CSS, class-variance-authority, clsx, tailwind-merge
- **react-day-picker** — Calendar component for date selection
- **vaul** — Drawer component
- **recharts** — Charting library (available via shadcn chart component)
- **embla-carousel-react** — Carousel component

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal** — Runtime error overlay in development
- **@replit/vite-plugin-cartographer** — Dev tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Development banner (dev only)

### Fonts (External CDN)
- **Plus Jakarta Sans** — Primary sans-serif font
- **Playfair Display** — Serif font for headings

### Static Assets
- All images are in WebP format at `/images/` path (hero background, environment previews) in `client/public/images/`
- Images were compressed from PNG/JPG to WebP (93% size reduction, ~100MB down to ~7MB)
- Portfolio images in database also use `.webp` paths
- Admin gallery supports drag-and-drop photo upload with batched processing (5 files per request)